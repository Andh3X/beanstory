import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { loadSource } from "./helpers.mjs";

const root = new URL("../", import.meta.url);

async function worker({ offline = false } = {}) {
  const handlers = {};
  const calls = [];
  const cache = { addAll: async (paths) => calls.push(["precache", ...paths]), put: async () => calls.push(["put"]) };
  runInNewContext(await readFile(new URL("public/sw.js", root), "utf8"), {
    URL,
    self: { location: { origin: "https://example.com" }, addEventListener: (event, action) => { handlers[event] = action; }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches: {
      open: async () => cache,
      match: async (request) => { calls.push(["match", request]); return "halaman-offline"; },
      keys: async () => ["beanstory-static-v0", "beanstory-static-v1", "aplikasi-lain"],
      delete: async (name) => calls.push(["delete", name]),
    },
    fetch: async (request) => {
      calls.push(["network", request.url]);
      if (offline) throw new Error("offline");
      return "respons-jaringan";
    },
  });
  return { handlers, calls };
}

test("manifest memiliki ikon PNG 192/512 yang valid serta maskable", async () => {
  const { default: manifest } = await loadSource("app/manifest.js");
  const data = manifest();
  assert.equal(data.display, "standalone");
  assert.equal(data.start_url, "/");
  assert.ok(data.icons.some((icon) => icon.purpose === "maskable"));
  for (const icon of data.icons) {
    const png = await readFile(new URL(`public${icon.src}`, root));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    const size = Number(icon.sizes.split("x")[0]);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

test("service worker tidak menangani admin, POST Server Action, cross-origin, atau RSC", async () => {
  const { handlers, calls } = await worker();
  for (const request of [
    { url: "https://example.com/admin", method: "GET", mode: "navigate" },
    { url: "https://example.com/admin/produk/baru", method: "GET", mode: "navigate" },
    { url: "https://example.com/", method: "POST", mode: "cors" },
    { url: "https://other.example/", method: "GET", mode: "navigate" },
    { url: "https://example.com/?_rsc=abc", method: "GET", mode: "cors" },
  ]) handlers.fetch({ request, respondWith: () => assert.fail("Permintaan ini tidak boleh dicegat") });
  assert.equal(calls.length, 0);
});

test("katalog selalu memakai jaringan; saat offline hanya menampilkan halaman koneksi", async () => {
  for (const offline of [false, true]) {
    const app = await worker({ offline });
    let response;
    app.handlers.fetch({ request: { url: "https://example.com/", method: "GET", mode: "navigate" }, respondWith: (value) => { response = value; } });
    assert.equal(await response, offline ? "halaman-offline" : "respons-jaringan");
    assert.ok(!app.calls.some(([kind]) => kind === "put"));
  }
});

test("aktivasi service worker hanya membersihkan cache milik aplikasi versi lama", async () => {
  const app = await worker();
  let done;
  app.handlers.activate({ waitUntil: (value) => { done = value; } });
  await done;
  assert.deepEqual(app.calls, [["delete", "beanstory-static-v0"]]);
});
