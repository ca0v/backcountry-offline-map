// use a cache-first strategy

const CACHE_NAME = "kmz_viewer-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/dist/index.js",
  "/index.css",
];

self.addEventListener("install", (event) => {
  console.log("installing");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
