import type * as LType from "leaflet";
declare var L: typeof LType;

export async function run() {
  // this seems to be the best way to deal with versioning...
  // it will force the app to re-install
  if (window.location.search.includes("reinstall=1")) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.unregister();
      console.log("service worker unregistered");
    }
  }

  showKmlViewer();
  installServiceWorker();
}

async function installServiceWorker() {
  return new Promise<{ version: string }>((resolve, reject) => {
    window.addEventListener("load", async () => {
      try {
        await navigator.serviceWorker.register("./service-worker.js");
      } catch (registrationError) {
        console.error("SW registration failed: ", registrationError);
        reject(registrationError);
      }

      // create a two-way communication channel with the service worker
      const onServiceWorkerMessage = (event: MessageEvent<any>) => {
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
      };

      {
        const channel1 = new MessageChannel();
        channel1.port1.onmessage = onServiceWorkerMessage;
        navigator.serviceWorker.controller?.postMessage(
          {
            command: "ping",
          },
          [channel1.port2]
        );
      }

      {
        const channel1 = new MessageChannel();
        channel1.port1.onmessage = onServiceWorkerMessage;
        navigator.serviceWorker.controller?.postMessage(
          {
            command: "getVersionInfo",
          },
          [channel1.port2]
        );
      }
    });
  });
}

function showKmlViewer() {
  const map = L.map("map");

  const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxZoom: 21,
    attribution:
      'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    opacity: 1,
  });
  topo.addTo(map);

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

  // make leaflet-control-layers collapsible using two tags: <detail> and <summary>
  const details = document.createElement("details");
  details.innerHTML = `<summary>Layers</summary>`;
  const child = document.querySelector(".leaflet-control-layers")!;
  details.className = child.className;
  child.className = "";
  child.parentElement!.replaceChild(details, child);
  details.appendChild(child);

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
    localStorage.setItem("drawnItems", JSON.stringify(drawnItems.toGeoJSON()));
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
  locationButton.innerHTML = "Go to current location";
  locationButton.onclick = () => {
    map.locate({ setView: true, maxZoom: 12 });
  };
  // add the button to the bottom-right of the map
  locationButton.style.position = "absolute";
  locationButton.style.bottom = "30px";
  locationButton.style.right = "10px";
  locationButton.style.zIndex = "1000";
  map.getContainer().appendChild(locationButton);
}
