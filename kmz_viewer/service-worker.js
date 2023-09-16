const CACHE_NAME = "kmz_viewer-cache-v2";
const OLD_CACHE_NAMES = ["kmz_viewer-cache-v0", "kmz_viewer-cache-v1"];

// delete old caches
self.addEventListener("activate", async (event) => {
  console.log("activate");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (OLD_CACHE_NAMES.includes(cacheName)) {
            console.log("deleting", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // update every cache item upon activation but do it in the background
  if (1) {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    Promise.all(
      requests.map(async (request) => {
        const response = await fetch(request);
        await cache.put(request, response.clone());
        return request.url;
      })
    ).then((urls) => {
      console.log(`updated ${requests.length} items: ${urls.join(", ")}`);
    });
  }
});

const strategies = {
  cacheFirst: async (request) => {
    const cache = await caches.open(CACHE_NAME);
    // is it already cached?
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log("found in cache", request.url);
      return cachedResponse;
    }
    const response = await fetch(request);
    await cache.put(request, response.clone());
    return response;
  },
};

// intercept fetch requests
self.addEventListener("fetch", (event) => {
  console.log("fetch", event.request.url);
  event.respondWith(strategies.cacheFirst(event.request));
});
