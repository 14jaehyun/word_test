// Danju̇ v0.8 — 오프라인에서도 열리게 앱 파일과 글꼴을 캐시
const CACHE = "danju-v0.8";
const CORE = ["./", "index.html", "manifest.webmanifest", "danju2-180.png", "danju2-192.png", "danju2-512.png", "sfx/logo.wav"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 앱 화면은 새 버전 우선, 안 되면 캐시
  if (req.mode === "navigate") {
    e.respondWith(fetch(req.url, { cache: "no-cache" }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // 앱 파일(이름·아이콘·설정 포함)은 새 버전 우선, 안 되면 캐시
  if (url.origin === location.origin) {
    e.respondWith(fetch(req, { cache: "no-cache" }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // 글꼴은 캐시 우선
  if (url.host.endsWith("fonts.googleapis.com") || url.host.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r;
    })));
  }
});
