const CACHE_NAME = "touramas-random-v10-design1";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./data.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./design/app-background.png",
  "./design/sparkle-texture.png",
  "./design/icon-song.svg",
  "./design/icon-idol.svg",
  "./design/icon-costume.svg",
  "./design/icon-star.svg",
  "./design/icon-genre.svg",
  "./design/icon-rarity.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // data.js is network-first so Excel-driven updates arrive without changing app logic.
  if (url.pathname.endsWith("/data.js")) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (!response.ok) throw new Error("data.js fetch failed");
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Other app assets stay cache-first for reliable offline execution.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
        return response;
      });
    })
  );
});
