// Offline support, so the timer works without a connection once opened.
//
// The page is network-first: new deploys show up on the next load, and the
// cached copy is only used offline. Everything else (font, icons, manifest) is
// served from the cache and refreshed in the background.
//
// Bump CACHE only when changing what's precached or how; content updates
// don't need it.

const CACHE = "countdown-v1";
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/fonts/fredoka-latin.woff2",
  "/fonts/fredoka-latin-ext.woff2",
  "/icons/icon.svg",
  "/icons/icon-192.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;

  // It's a single page: every navigation is "/" (share links live in the
  // fragment, which never reaches the network).
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.pathname === "/") {
            const copy = res.clone();
            e.waitUntil(caches.open(CACHE).then((cache) => cache.put("/", copy)));
          }
          return res;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then((cache) => cache.put(req, copy)));
        }
        return res;
      });
      if (!hit) return fresh;
      e.waitUntil(fresh.catch(() => {}));
      return hit;
    }),
  );
});
