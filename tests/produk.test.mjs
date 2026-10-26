import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

const root = new URL("../", import.meta.url);

// Jalankan Server Action asli dengan batas Next.js/Supabase pengganti.
// Tidak memakai kredensial atau mengubah database toko.
async function aplikasi({ login = true, authError = false, authThrow = false, queryError = false, queryThrow = false } = {}) {
  const rows = new Map([["1", { id: 1, nama: "Produk lama", harga: 1000 }]]);
  const events = [];
  const cache = [];
  let nextId = 2;
  const client = {
    auth: {
      async getUser() {
        events.push("auth");
        if (authThrow) throw new Error("rahasia layanan");
        return { data: { user: login ? { id: "admin-uji" } : null }, error: authError ? new Error("sesi ditolak") : null };
      },
    },
    from(table) {
      events.push("query");
      assert.equal(table, "produk");
      let operation;
      let values;
      let id;
      const query = {
        insert(data) { operation = "insert"; values = data; return query; },
        update(data) { operation = "update"; values = data; return query; },
        delete() { operation = "delete"; return query; },
        eq(column, value) { assert.equal(column, "id"); id = String(value); return query; },
        select(columns) { assert.equal(columns, "id"); return query; },
        async maybeSingle() {
          if (queryThrow) throw new Error("rahasia database");
          if (queryError) return { error: new Error("rahasia RLS"), data: null };
          if (operation === "insert") {
            id = String(nextId++);
            rows.set(id, { ...values, id: Number(id) });
          } else {
            assert.ok(id, "Perubahan wajib difilter berdasarkan ID");
            if (!rows.has(id)) return { data: null, error: null };
            if (operation === "update") rows.set(id, { ...rows.get(id), ...values });
            else if (operation === "delete") rows.delete(id);
            else assert.fail("Operasi tidak dikenal");
          }
          return { data: { id: Number(id) }, error: null };
        },
      };
      return query;
    },
  };

  const context = createContext({ URL });
  const modules = new Map();
  function stub(name, exports) {
    const module = new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context, identifier: name });
    modules.set(name, module);
  }
  stub("server-only", {});
  stub("next/navigation", { redirect(location) { throw Object.assign(new Error("redirect"), { location }); } });
  stub("next/cache", { revalidatePath(path) { cache.push(path); } });
  stub("session", { createSessionClient: async () => client });

  async function load(name) {
    if (modules.has(name)) return modules.get(name);
    const file = name === "actions" ? "app/admin/actions.js" : name === "admin" ? "lib/supabase/admin.js" : "lib/produk.js";
    const module = new SourceTextModule(await readFile(new URL(file, root), "utf8"), { context, identifier: name });
    modules.set(name, module);
    await module.link((specifier) => {
      if (specifier.endsWith("/session") || specifier === "./session") return load("session");
      if (specifier === "@/lib/supabase/admin") return load("admin");
      if (specifier === "@/lib/produk") return load("produk");
      if (modules.has(specifier)) return modules.get(specifier);
      throw new Error(`Import pengujian tidak dikenal: ${specifier}`);
    });
    return module;
  }

  const actions = await load("actions");
  await actions.evaluate();
  return { actions: actions.namespace, produk: modules.get("produk").namespace, rows, events, cache };
}

function form(changes = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ nama: " Kopi uji ", harga: "25000", kategori: " Minuman ", foto_url: "/produk/kopi.svg", deskripsi: " Deskripsi uji ", ...changes })) {
    data.set(key, value);
  }
  return data;
}

async function redirected(action, location) {
  await assert.rejects(action, (error) => error.location === location);
}

test("tambah, ubah, hapus: data tersimpan, hanya ID tujuan berubah, cache diperbarui", async () => {
  const app = await aplikasi();
  await redirected(() => app.actions.tambahProduk(null, form({ id: "999", created_at: "palsu" })), "/admin?status=created");
  assert.equal(app.rows.size, 2);
  assert.equal(app.rows.get("2").nama, "Kopi uji");
  assert.equal(app.rows.get("2").harga, 25000);
  assert.equal(app.rows.get("2").created_at, undefined);

  await redirected(() => app.actions.ubahProduk("2", null, form({ nama: "Kopi diperbarui", harga: "30000" })), "/admin?status=updated");
  assert.equal(app.rows.get("2").nama, "Kopi diperbarui");
  assert.equal(app.rows.get("2").harga, 30000);
  assert.equal(app.rows.get("1").nama, "Produk lama");

  await redirected(() => app.actions.hapusProduk("2", null, new FormData()), "/admin?status=deleted");
  assert.equal(app.rows.has("2"), false);
  assert.equal(app.rows.has("1"), true);
  assert.deepEqual(app.events, ["auth", "query", "auth", "query", "auth", "query"]);
  assert.deepEqual(app.cache, Array(3).fill(["/admin", "/", "/produk/2", "/admin/produk/2/ubah"]).flat());
});

for (const mode of [{ login: false }, { authError: true }, { authThrow: true }]) {
  test(`ketiga aksi ditolak sebelum query saat sesi tidak sah: ${JSON.stringify(mode)}`, async () => {
    const app = await aplikasi(mode);
    const location = mode.authThrow ? "/admin/login?error=service" : "/admin/login";
    await redirected(() => app.actions.tambahProduk(null, form()), location);
    await redirected(() => app.actions.ubahProduk("1", null, form()), location);
    await redirected(() => app.actions.hapusProduk("1", null, new FormData()), location);
    assert.deepEqual(app.events, ["auth", "auth", "auth"]);
    assert.equal(app.rows.size, 1);
    assert.equal(app.cache.length, 0);
  });
}

test("validasi server menolak nama kosong, harga salah, dan link foto tidak aman", async () => {
  const app = await aplikasi();
  const invalid = [
    { nama: "   " }, { harga: "" }, { harga: " " }, { harga: "-1" },
    { harga: "1.5" }, { harga: "1e3" }, { harga: "NaN" }, { harga: "Infinity" },
    { harga: "2147483648" }, { foto_url: "javascript:alert(1)" },
    { foto_url: "//example.com/foto.png" },
    { nama: new Blob(["file bukan nama"]) },
  ];
  for (const values of invalid) {
    const hasil = await app.actions.tambahProduk(null, form(values));
    assert.equal(typeof hasil.error, "string", JSON.stringify(values));
    const ubah = await app.actions.ubahProduk("1", null, form(values));
    assert.equal(typeof ubah.error, "string");
  }
  for (const malformed of [null, {}, "bukan formulir"]) {
    assert.equal(typeof (await app.actions.tambahProduk(null, malformed)).error, "string");
  }
  assert.equal(app.events.includes("query"), false);
  assert.equal(app.rows.size, 1);
  assert.equal(app.cache.length, 0);
});

test("harga nol dan batas integer diterima; kolom opsional boleh kosong", async () => {
  const app = await aplikasi();
  for (const harga of ["0", "2147483647"]) {
    await redirected(() => app.actions.tambahProduk(null, form({ harga, kategori: "", foto_url: "", deskripsi: "" })), "/admin?status=created");
  }
  assert.equal(app.rows.get("2").harga, 0);
  assert.equal(app.rows.get("2").foto_url, null);
  assert.equal(app.rows.get("3").harga, 2147483647);
});

test("ID mengikuti bigint positif; ID tidak valid ditolak tanpa query", async () => {
  const app = await aplikasi();
  for (const id of ["0", "-1", "abc", "1.5", "1 OR 1=1", "9223372036854775808", "999999999999999999999999999", 9007199254740992, {}, null, undefined]) {
    assert.equal(app.produk.idProdukValid(id), false);
    assert.equal(typeof (await app.actions.ubahProduk(id, null, form())).error, "string");
    assert.equal(typeof (await app.actions.hapusProduk(id, null, new FormData())).error, "string");
  }
  assert.equal(app.produk.idProdukValid("9223372036854775807"), true);
  assert.equal(app.events.includes("query"), false);
});

test("produk tidak ditemukan tidak menghasilkan pesan sukses atau revalidasi", async () => {
  const app = await aplikasi();
  assert.match((await app.actions.ubahProduk("999", null, form())).error, /tidak ditemukan/);
  assert.match((await app.actions.hapusProduk("999", null, new FormData())).error, /tidak ditemukan/);
  assert.equal(app.rows.size, 1);
  assert.equal(app.cache.length, 0);
});

for (const mode of [{ queryError: true }, { queryThrow: true }]) {
  test(`kegagalan database ditangani tanpa membocorkan detail: ${JSON.stringify(mode)}`, async () => {
    const app = await aplikasi(mode);
    const results = [
      await app.actions.tambahProduk(null, form()),
      await app.actions.ubahProduk("1", null, form()),
      await app.actions.hapusProduk("1", null, new FormData()),
    ];
    for (const hasil of results) {
      assert.equal(typeof hasil.error, "string");
      assert.doesNotMatch(hasil.error, /rahasia/);
    }
    assert.equal(app.rows.size, 1);
    assert.equal(app.rows.get("1").nama, "Produk lama");
    assert.equal(app.cache.length, 0);
  });
}

test("galeri, stok, harga diskon, dan badge tersimpan serta dapat dikosongkan", async () => {
  const app = await aplikasi();
  await redirected(() => app.actions.tambahProduk(null, form({ foto_tambahan: "https://example.com/2.jpg\n/produk/keripik.svg", stok: "0", harga_diskon: "20000", badge: "Baru" })), "/admin?status=created");
  const row = app.rows.get("2");
  assert.equal(row.stok, 0);
  assert.equal(row.harga_diskon, 20000);
  assert.equal(row.badge, "Baru");
  assert.equal(row.foto_tambahan.length, 2);
  await redirected(() => app.actions.ubahProduk("2", null, form({ foto_tambahan: "", stok: "", harga_diskon: "", badge: "" })), "/admin?status=updated");
  assert.equal(app.rows.get("2").stok, null);
  assert.equal(app.rows.get("2").harga_diskon, null);
  assert.equal(app.rows.get("2").badge, null);
  assert.equal(app.rows.get("2").foto_tambahan.length, 0);
});

test("validasi bonus menolak stok negatif, promo tidak valid, serta galeri berlebihan", async () => {
  const app = await aplikasi();
  const invalid = [
    { stok: "-1" }, { stok: "2.5" }, { stok: "2147483648" },
    { harga_diskon: "25000" }, { harga_diskon: "26000" }, { harga_diskon: "-1" },
    { harga_diskon: "1.5" }, { badge: "Promo palsu" },
    { foto_tambahan: "javascript:alert(1)" },
    { foto_tambahan: Array.from({ length: 10 }, (_, i) => `https://example.com/${i}.jpg`).join("\n") },
  ];
  for (const values of invalid) {
    assert.equal(typeof (await app.actions.tambahProduk(null, form(values))).error, "string");
  }
  assert.equal(app.events.includes("query"), false);
  assert.equal(app.rows.size, 1);
});
