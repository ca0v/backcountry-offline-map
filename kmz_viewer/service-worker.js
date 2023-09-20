const APP_VERSION = "v1.0.1";
const CACHE_NAME = `kmz_viewer-cache-${APP_VERSION}`;
const OLD_CACHE_NAMES = [
  "kmz_viewer-cache-v2",
  "kmz_viewer-cache-v1",
  "kmz_viewer-cache-v0",
];

async function removeFromCache(extensions = [".png", ".jpg"]) {
  const cache = await caches.open(CACHE_NAME);
  cache.keys().then((keys) => {
    keys.forEach((request) => {
      if (extensions.some((v) => request.url.endsWith(v))) {
        cache.delete(request);
        console.log(`deleted ${request.url}`);
      }
    });
  });
}

// delete old caches
self.addEventListener("activate", async (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (OLD_CACHE_NAMES.includes(cacheName)) {
            console.log(`deleting ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// if client requests the cache to be cleared, do it
self.addEventListener("message", async (event) => {
  const port = event.ports[0];
  switch (event.data.command) {
    case "ping":
      console.log("ping");
      port?.postMessage({ version: APP_VERSION, command: "pong" });
      break;
    case "clearCacheTiles":
      removeFromCache([".png", ".jpg"]);
      port?.postMessage({ version: APP_VERSION, command: "cache_cleared" });
      break;
    case "clearCacheCode":
      removeFromCache([".js", ".css", ".html"]);
      port?.postMessage({ version: APP_VERSION, command: "cache_cleared" });
      break;
    case "clearCache":
      caches.delete(CACHE_NAME);
      port?.postMessage({ version: APP_VERSION, command: "cache_cleared" });
      break;
    case "getVersionInfo":
      port?.postMessage({
        version: APP_VERSION,
        command: "version_info",
      });
      break;
  }
});

const strategies = {
  cacheFirst: async (request) => {
    const cache = await caches.open(CACHE_NAME);
    // is it already cached?
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    const response = await fetch(request);
    await cache.put(request, response.clone());
    return response;
  },
};

// intercept fetch requests
self.addEventListener("fetch", (event) => {
  event.respondWith(strategies.cacheFirst(event.request));
});

// receive a message from the client
self.addEventListener("message", (event) => {
  console.log("message", JSON.stringify(event));
});
