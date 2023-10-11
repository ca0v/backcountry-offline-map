const APP_VERSION = "v1.0.1";
const CACHE_NAME = `kmz_viewer-cache-${APP_VERSION}`;
const OLD_CACHE_NAMES = [
  "kmz_viewer-cache-v2",
  "kmz_viewer-cache-v1",
  "kmz_viewer-cache-v0",
];

function clearCurrentCache() {
  caches.delete(CACHE_NAME);
}

function clearTiles() {
  // url:"https://a.tile.opentopomap.org/11/608/736.png"
  // get the current cache
}

// delete old caches
self.addEventListener("activate", async (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (OLD_CACHE_NAMES.includes(cacheName)) {
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
    case "clearCache":
      clearCurrentCache();
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
  cacheFirst: async (request: any) => {
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
self.addEventListener("fetch", (event: any) => {
  event.respondWith(strategies.cacheFirst(event.request));
});

// send a message to the client
self.addEventListener("message", (event) => {
  console.log("message", JSON.stringify(event));
});

// define a class that continually runs in the background
// and updates the cache with location information
class BackgroundWorker {
  #handle: number | null = null;

  constructor() {
  }

  start() {
    // listen for location change events
    const database = new Database();
    this.#handle = setInterval(() => {
    }, 1000);
  }

  stop() {
    if (this.#handle) {
      clearInterval(this.#handle);
      this.#handle = null;
    }
  }
}

class Database {
  private _db: IDBDatabase | null = null;

  constructor() {
    // open the database
    const request = indexedDB.open("myDatabase", 1);

    // define the object store
    request.onupgradeneeded = (event: any) => {
      this._db = event.target.result;
      const db = this._db!;
      db.createObjectStore("positions", {
        keyPath: "id",
        autoIncrement: true,
      });
    };

    // handle errors
    request.onerror = (event: any) => {
      console.error("Database error:", event.target.error);
    };

    // handle success
    request.onsuccess = (event: any) => {
      this._db = event.target.result;
    };
  }

  addPosition(position: any) {
    // add the position to the object store
    const transaction = this._db!.transaction("positions", "readwrite");
    const objectStore = transaction.objectStore("positions");
    objectStore.add({ position });
  }
}

// start the background worker
const worker = new BackgroundWorker();
worker.start();


