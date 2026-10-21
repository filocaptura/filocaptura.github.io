/* Filocaptura · service worker: abre sin internet y se actualiza solo cuando hay conexión */
const CACHE = "filocaptura-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-512-maskable.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  // la base de datos (notas, terrapesos, perfiles) siempre va directo a internet
  if (u.hostname.endsWith("googleapis.com") && u.hostname !== "fonts.googleapis.com") return;
  if (r.mode === "navigate") { // el juego: red primero (para recibir versiones nuevas), caché si no hay internet
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put("./index.html", cp)); return res; }).catch(() => caches.match("./index.html")));
    return;
  }
  // tipografía, módulos de Firebase e imágenes: caché primero
  e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res && (res.ok || res.type === "opaque")) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); } return res; }).catch(() => hit)));
});
