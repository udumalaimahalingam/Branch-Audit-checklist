// Offline cache for Farm SOP Audit. Bump VERSION whenever index.html is updated.
const VERSION = "farm-audit-v5";
const LOCAL = ["./", "./index.html", "./single.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
const CDN = [
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(LOCAL.map(u => cache.add(u).catch(() => {})));
    await Promise.all(CDN.map(u => fetch(u, { mode: "cors" }).then(r => r.ok && cache.put(u, r)).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    } catch (err) {
      if (e.request.mode === "navigate") return (await cache.match("./index.html")) || Response.error();
      return Response.error();
    }
  })());
});
