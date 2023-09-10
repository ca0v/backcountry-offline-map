export function run() {
    console.log("run");
    showKmzViewer();
    installServiceWorker();
}
function installServiceWorker() {
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker
                .register("./service-worker.js")
                .then((registration) => {
                console.log("SW registered: ", registration);
            })
                .catch((registrationError) => {
                console.log("SW registration failed: ", registrationError);
            });
        });
    }
}
function showKmzViewer() {
    const map = L.map("map");
    // location of jay,vt: 44.476,-73.212
    map.setView([44.875, -72.5], 13);
    const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        maxZoom: 17,
        attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        opacity: 0.9,
    });
    topo.addTo(map);
    const control = L.control.layers({}, {}, { collapsed: false }).addTo(map);
    var kmz = L.kmzLayer().addTo(map);
    kmz.on("load", (e) => {
        control.addOverlay(e.layer, e.name);
    });
    kmz.load("./data/VT_Jay_Peak_20210414_TM.kmz");
    kmz.load("./data/VT_North_Troy_20210414_TM.kmz");
    kmz.load("./data/VT_Lowell_20210415_TM.kmz");
    kmz.load("./data/VT_Hazens_Notch_20210414_TM.kmz");
    // show the coordinates when the mouse is clicked
    map.on("click", (e) => {
        document.getElementById("coordinates").innerHTML = e.latlng.toString();
    });
    // make leaflet-control-layers collapsible using two tags: <detail> and <summary>
    const details = document.createElement("details");
    details.innerHTML = `<summary>Layers</summary>`;
    const child = document.querySelector(".leaflet-control-layers");
    details.className = child.className;
    child.className = "";
    child.parentElement.replaceChild(details, child);
    details.appendChild(child);
}
//# sourceMappingURL=index.js.map