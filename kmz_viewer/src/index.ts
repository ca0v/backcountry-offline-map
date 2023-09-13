import type * as LType from "leaflet"
declare var L: typeof LType

export function run() {
  console.log("run")
  showKmzViewer()
  installServiceWorker()
}

function installServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then((registration) => {
          console.log("SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    })
  }
}

function showKmzViewer() {
  const map = L.map("map")

  const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxZoom: 21,
    attribution:
      'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    opacity: 1,
  })
  topo.addTo(map)

  const control = L.control.layers({}, {}, { collapsed: false }).addTo(map)

  var kmz = (<any>L).kmzLayer().addTo(map)
  const overlayGroup = new L.LayerGroup()
  control.addOverlay(overlayGroup, "Overlay")
  kmz.on("load", (e: { layer: L.Layer; name: string }) => {
    const layer = e.layer
    overlayGroup.addLayer(layer)
  })

  ;["VT_Jay_Peak_OE_N_20210413_TM", "VT_North_Troy_OE_N_20210413_TM"].forEach(
    (fileName) => {
      kmz.load(`./data/${fileName}.kmz`)
    }
  )
  kmz.load("./data/VT_Jay_Peak_20210414_TM.kmz")
  kmz.load("./data/VT_North_Troy_20210414_TM.kmz")
  kmz.load("./data/VT_Lowell_20210415_TM.kmz")
  kmz.load("./data/VT_Hazens_Notch_20210414_TM.kmz")

  // show the coordinates when the mouse is clicked
  map.on("click", (e) => {
    const { lat, lng } = e.latlng
    const minutes = {
      lat: Math.abs((lat % 1) * 60).toFixed(3),
      lng: Math.abs((lng % 1) * 60).toFixed(3),
    }
    const degrees = {
      lat: Math.floor(lat),
      lng: Math.floor(lng),
    }

    const display = `${degrees.lat}°${minutes.lat}'N, ${degrees.lng}°${minutes.lng}'W`
    document.getElementById("coordinates")!.innerHTML = display
  })

  // make leaflet-control-layers collapsible using two tags: <detail> and <summary>
  const details = document.createElement("details")
  details.innerHTML = `<summary>Layers</summary>`
  const child = document.querySelector(".leaflet-control-layers")!
  details.className = child.className
  child.className = ""
  child.parentElement!.replaceChild(details, child)
  details.appendChild(child)

  // allow user to draw lines on the map
  const drawnItems = new L.FeatureGroup()
  map.addLayer(drawnItems)
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
  })
  map.addControl(drawControl)

  map.on(L.Draw.Event.CREATED, (e: { layer: L.Layer }) => {
    drawnItems.addLayer(e.layer)
    // persist the drawn lines to local storage
    localStorage.setItem("drawnItems", JSON.stringify(drawnItems.toGeoJSON()))
  })

  // load the drawn lines from local storage
  const geojson = localStorage.getItem("drawnItems")
  if (geojson) {
    drawnItems.addLayer(L.geoJSON(JSON.parse(geojson)))
  }

  // when map extent changes, persist it to localstorage
  map.on("moveend", () => {
    const center = map.getCenter()
    const zoom = map.getZoom()
    localStorage.setItem("map", JSON.stringify({ center, zoom }))
  })

  // load the map extent from local storage
  // location of jay,vt: 44.476,-73.212
  const mapExtent = localStorage.getItem("map")
  if (mapExtent) {
    const { center, zoom } = JSON.parse(mapExtent)
    map.setView([center.lat, center.lng], zoom)
  } else {
    map.setView([44.875, -72.5], 13)
  }

  // add a button to go to current location
  const locationButton = document.createElement("button")
  locationButton.innerHTML = "Go to current location"
  locationButton.onclick = () => {
    map.locate({ setView: true, maxZoom: 12 })
  }
  // add the button to the bottom-right of the map
  locationButton.style.position = "absolute"
  locationButton.style.bottom = "30px"
  locationButton.style.right = "10px"
  locationButton.style.zIndex = "1000"
  map.getContainer().appendChild(locationButton)
}
