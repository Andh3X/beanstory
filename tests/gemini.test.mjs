import test from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers.mjs";

async function ai({ key = "kunci-uji-bukan-kredensial", login = true, status = 200, result, fail = false } = {}) {
  const calls = [];
  const module = await loadSource("app/admin/ai-actions.js", {
    mocks: { "@/lib/supabase/admin": { requireAdmin: async () => { calls.push("auth"); if (!login) throw new Error("login diperlukan"); } } },
    globals: {
      process: { env: { GEMINI_API_KEY: key } },
      fetch: async (url, options) => {
        calls.push({ url, options });
        if (fail) throw new Error("detail jaringan rahasia");
        return { ok: status === 200, status, json: async () => result || { candidates: [{ finishReason: "STOP", content: { parts: [{ text: "Draf deskripsi kopi." }] } }] } };
      },
    },
  });
  return { module, calls };
}

test("AI memeriksa admin lalu memanggil Gemini di server; kunci tidak masuk URL", async () => {
  const app = await ai();
  const hasil = await app.module.buatDeskripsiAI({ nama: "Kopi", kategori: "Minuman" });
  assert.equal(hasil.deskripsi, "Draf deskripsi kopi.");
  assert.equal(app.calls[0], "auth");
  const call = app.calls[1];
  assert.ok(call.url.startsWith("https://generativelanguage.googleapis.com/"));
  assert.ok(!call.url.includes("kunci-uji"));
  assert.equal(call.options.headers["x-goog-api-key"], "kunci-uji-bukan-kredensial");
  assert.equal(call.options.cache, "no-store");
  assert.ok(call.options.signal);
  assert.deepEqual(JSON.parse(JSON.parse(call.options.body).contents[0].parts[0].text), { nama: "Kopi", kategori: "Minuman" });
});

test("tanpa login, kunci, atau input valid, Gemini tidak dipanggil", async () => {
  const noLogin = await ai({ login: false });
  await assert.rejects(() => noLogin.module.buatDeskripsiAI({ nama: "Kopi", kategori: "Minuman" }), /login diperlukan/);
  assert.equal(noLogin.calls.length, 1);
  const noKey = await ai({ key: "" });
  assert.ok((await noKey.module.buatDeskripsiAI({ nama: "Kopi", kategori: "Minuman" })).error);
  assert.equal(noKey.calls.length, 1);
  const invalid = await ai();
  assert.ok((await invalid.module.buatDeskripsiAI({ nama: "", kategori: "Minuman" })).error);
  assert.ok((await invalid.module.buatDeskripsiAI({ nama: "Kopi", kategori: "x".repeat(101) })).error);
  assert.equal(invalid.calls.length, 2);
});

test("kuota, jaringan, dan jawaban kosong AI menghasilkan pesan yang jelas", async () => {
  for (const options of [{ status: 429 }, { status: 403 }, { fail: true }, { result: { candidates: [] } }]) {
    const app = await ai(options);
    const hasil = await app.module.buatDeskripsiAI({ nama: "Kopi", kategori: "Minuman" });
    assert.equal(typeof hasil.error, "string");
    assert.doesNotMatch(hasil.error, /rahasia/);
    assert.equal(hasil.deskripsi, undefined);
  }
});
