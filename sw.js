const CACHE = "speelstad-v29";
const FILES = [
  "./", "index.html", "app.js", "farm.js", "bouw.js", "winkel.js", "vervoer.js", "trein.js", "taxi.js", "dinoart.js", "dino.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "voices-index.json",
];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // eerst internet (altijd de nieuwste versie), zonder internet de bewaarde kopie
  // stemmen veranderen nooit: die komen uit de bewaarde kopie (snel, en werkt offline)
  if (/\/audio\/.+\.m4a$/.test(new URL(e.request.url).pathname)) {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    })));
    return;
  }
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
