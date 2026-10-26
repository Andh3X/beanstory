const CACHE = "beanstory-static-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, "/icons/icon-192.png", "/icons/icon-512.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("beanstory-static-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Jangan menyimpan halaman admin, sesi, Server Action, atau respons RSC.
  if (request.method !== "GET" || url.origin !== self.location.origin || /^\/(admin|api)(\/|$)/.test(url.pathname)) return;
  if (request.mode === "navigate") {
    // Harga dan stok selalu berasal dari jaringan; halaman katalog tidak dicache.
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE)));
  } else if (/^\/icons\//.test(url.pathname) || /^\/produk\/[^/]+\.svg$/.test(url.pathname)) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
      }
      return response;
    }).catch(() => caches.match(request)));
  }
});
