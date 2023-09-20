import type * as LType from "leaflet";
declare var L: typeof LType;

function readQueryFlags() {
  const flags = new URLSearchParams(window.location.search);
  const result: { [key: string]: boolean } = {};
  for (const [key, value] of flags.entries()) {
    result[key] = value === "1";
  }
  return result as {
    reinstall: boolean;
    clear_cache: boolean;
    clear_code_cache: boolean;
    clear_tile_cache: boolean;
  };
}

class AppController {
  // create a two-way communication channel with the service worker
  onServiceWorkerMessage(event: MessageEvent<any>) {
    console.log(
      `Received message from service worker: ${JSON.stringify(event.data)}`
    );
    const { command, version } = event.data;

    switch (command) {
      case "pong": {
        console.log("pong received from service worker");
        break;
      }
      case "version_info":
        document.title += ` ${version}`;
        const currentVersion = localStorage.getItem("version") || version;
        if (currentVersion !== version) {
          // tell the service worker to clear the cache
          navigator.serviceWorker.controller?.postMessage({
            command: "clearCache",
          });
          localStorage.setItem("version", version);
          console.log(`version updated to ${version}`);
        }
        break;
    }
  }

  postMessageToServiceWorker(message: { command: string }) {
    const channel1 = new MessageChannel();
    channel1.port1.onmessage = (event: MessageEvent<any>) => {};
    navigator.serviceWorker.controller?.postMessage(message, [channel1.port2]);
  }

  async run() {
    // this seems to be the best way to deal with versioning...
    // it will force the app to re-install
    const queryFlags = readQueryFlags();
    if (queryFlags.reinstall) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.unregister();
        console.log("service worker unregistered");
        const mapDiv = document.querySelector("#map")!;
        mapDiv.innerHTML = "Service worker unregistered";
        return;
      }
    }
    if (queryFlags.clear_cache) {
      this.postMessageToServiceWorker({ command: "clearCache" });
    }

    if (queryFlags.clear_tile_cache) {
      this.postMessageToServiceWorker({ command: "clearCacheTiles" });
    }

    if (queryFlags.clear_code_cache) {
      this.postMessageToServiceWorker({ command: "clearCacheCode" });
    }

    await this.installServiceWorker();
    this.showKmlViewer();

    this.listenForChangesToDeviceOrientation();
  }

  async installServiceWorker() {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (registrationError) {
      console.error("SW registration failed: ", registrationError);
      throw registrationError;
    }
    this.postMessageToServiceWorker({ command: "ping" });
    this.postMessageToServiceWorker({ command: "getVersionInfo" });
  }

  showKmlViewer() {
    const map = L.map("map");

    const topo = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 15,
        opacity: 1,
      }
    );
    topo.addTo(map);

    if (0) {
      const control = L.control.layers({}, {}, { collapsed: false }).addTo(map);

      const overlayGroup = new L.LayerGroup();
      control.addOverlay(overlayGroup, "Overlay");

      [
        "VT_Jay_Peak_OE_N_20210413_TM",
        "VT_North_Troy_OE_N_20210413_TM",
        "VT_Jay_Peak_20210414_TM",
        "VT_North_Troy_20210414_TM",
        "VT_Lowell_20210415_TM",
        "VT_Hazens_Notch_20210414_TM",
      ].forEach((fileName) => {
        const kmlFileName = `./data/${fileName}.kml`;
        // create a kml layer
        const kmlLayer = new (<any>L).KML(kmlFileName, { async: true });
        // add the kml layer to the overlay group
        overlayGroup.addLayer(kmlLayer);
      });
    }

    // show the coordinates when the mouse is clicked
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      const minutes = {
        lat: Math.abs((lat % 1) * 60).toFixed(2),
        lng: Math.abs((lng % 1) * 60).toFixed(2),
      };
      const degrees = {
        lat: Math.floor(Math.abs(lat)),
        lng: Math.floor(Math.abs(lng)),
      };

      const display = `${degrees.lat}°${minutes.lat}'N, ${degrees.lng}°${minutes.lng}'W`;
      document.getElementById("coordinates")!.innerHTML = display;
    });

    // allow user to draw lines on the map
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({
      draw: {
        polyline: {
          shapeOptions: {
            color: "red",
            weight: 10,
          },
        },
      },
      // ability to delete lines
      edit: {
        featureGroup: drawnItems,
      },
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: { layer: L.Layer }) => {
      drawnItems.addLayer(e.layer);
      // persist the drawn lines to local storage
      localStorage.setItem(
        "drawnItems",
        JSON.stringify(drawnItems.toGeoJSON())
      );
    });

    // load the drawn lines from local storage
    const geojson = localStorage.getItem("drawnItems");
    if (geojson) {
      drawnItems.addLayer(L.geoJSON(JSON.parse(geojson)));
    }

    // when map extent changes, persist it to localstorage
    map.on("moveend", () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      localStorage.setItem("map", JSON.stringify({ center, zoom }));
    });

    // load the map extent from local storage
    // location of jay,vt: 44.476,-73.212
    const mapExtent = localStorage.getItem("map");
    if (mapExtent) {
      const { center, zoom } = JSON.parse(mapExtent);
      map.setView([center.lat, center.lng], zoom);
    } else {
      map.setView([44.875, -72.5], 13);
    }

    // add a button to go to current location
    const locationButton = document.createElement("button");
    locationButton.innerHTML = "&#x1F4CD;";
    locationButton.onclick = async () => {
      // get the current location using web api
      const currentLocation = await new Promise<{ lat: number; lng: number }>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              resolve({ lat: latitude, lng: longitude });
            },
            (error) => {
              reject(error);
            }
          );
        }
      );
      map.setView(currentLocation, 16);
      // place a circle the current location
      L.marker(currentLocation, {
        icon: L.divIcon({
          className: "current_location",
          html: "&#x1F4CD;",
        }),
      }).addTo(map);
    };

    // add the button to the bottom-right of the map
    locationButton.style.position = "absolute";
    locationButton.style.bottom = "30px";
    locationButton.style.right = "10px";
    locationButton.style.zIndex = "1000";
    map.getContainer().appendChild(locationButton);

    if (document.querySelector(".north_arrow")) {
      const northArrow = document.querySelector(".north_arrow")!;
      // set the text to an up arrow
      northArrow.innerHTML = "&#8593;";
    }
  }

  listenForChangesToDeviceOrientation() {
    // listen for a DeviceMotionEvent
    const orientation = document.getElementById("north_arrow")!;
    window.addEventListener(
      "deviceorientationabsolute",
      (event) => {
        // set the --orientation css variable
        const { alpha, beta, gamma } = event as any;
        if (typeof alpha === "number" && typeof beta === "number") {
          if (beta > 45) {
            orientation.style.visibility = "hidden";
          }
          if (beta < 45) {
            orientation.style.visibility = "visible";
            orientation.style.setProperty("--orientation", `${alpha}deg`);
            orientation.classList.toggle(
              "not-north",
              alpha < -15 || alpha > 15
            );
          }
        }
      },
      true
    );
  }
}

export async function run() {
  const appController = new AppController();
  return appController.run();
}
