// Bump this on every deploy so returning visitors pick up the new app shell instead of a stale cache.
const CACHE_NAME = "stza-site-visit-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Only cache the app shell itself — Google Sheet API calls must always hit the network (or fail
  // naturally) so the app's own online/offline + sync-queue logic keeps working correctly.
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request)
        .then(resp => { if (resp && resp.ok) caches.open(CACHE_NAME).then(c => c.put(e.request, resp.clone())); return resp; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
