// use a cache-first strategy

const CACHE_NAME = "kmz_viewer-cache-v1"
const cache = await caches.open(CACHE_NAME)

const cacheResponse = async (request) => {
  // is it already cached?
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    console.log("found in cache", request.url)
    return cachedResponse
  }
  const response = await fetch(request)
  await cache.put(request, response.clone())
  return response
}

// on fetch call cache
self.addEventListener("fetch", (event) => {
  console.log("fetch", event.request.url)
  event.respondWith(cacheResponse(event.request))
})
