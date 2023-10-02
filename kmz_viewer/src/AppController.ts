import type * as LType from "leaflet";
declare var L: typeof LType;

import { readQueryFlags } from "./readQueryFlags.js";
import { toast } from "./toast.js";
import { Breadcrumbs } from "./tools/breadcrumbs.js";
import { onOrientation } from "./tools/orientation.js";
import { NavigateToPoint } from "./tools/navigateToPoint.js"
import { ShowCurrentLocation } from "./tools/showCurrentLocation.js";
import { ShowCoordinatesTool } from "./tools/ShowCoordinates.js";
import type { Location } from "./tools/getCurrentLocation.js";
import { EventManager } from "./tools/EventManager.js";

const default_state = {
    priorLocation: null as Location | null,
    breadCrumbs: [] as Array<Location>,
    navigatingTo: {
        location: null as Location | null,
        isExpanded: false
    }
}

const default_options = {
    state: default_state
}

type State = typeof default_state;
type Options = typeof default_options;

export class AppController {
    private options: Options;
    private state: State;

    constructor(options: Partial<Options>) {
        this.options = Object.freeze(Object.assign({ ...default_options }, options));
        this.state = this.options.state;
    }

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

    postMessageToServiceWorker(message: { command: string; }) {
        const channel1 = new MessageChannel();
        channel1.port1.onmessage = (event: MessageEvent<any>) => { };
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
        const map = L.map("map", {
            zoomControl: false,
            attributionControl: false,
        });

        const topo = L.tileLayer(
            "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 15,
                opacity: 1,
            }
        );
        topo.addTo(map);



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

        map.on(L.Draw.Event.CREATED, (e: { layer: L.Layer; }) => {
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

        const currentLocationTool = new ShowCurrentLocation(map, {
            location: this.state.priorLocation
        });
        currentLocationTool.on("change", (e) => {
            this.state.priorLocation = e.location;
            this.saveState();
        })

        currentLocationTool.on("clear", (e) => {
            this.state.priorLocation = null;
            this.saveState();
        });

        const navigateToPointTool = new NavigateToPoint(map, { ...this.state.navigatingTo });

        navigateToPointTool.on("change", (e) => {
            this.state.navigatingTo.location = e.location;
            this.state.navigatingTo.isExpanded = e.isExpanded;
            this.saveState();
        })

        navigateToPointTool.on("clear", (e) => {
            this.state.navigatingTo.location = null;
            this.state.navigatingTo.isExpanded = false;
            this.saveState();
        })

        const breadcrumbTool = new Breadcrumbs(map, {
            minDistance: 10, state: {
                priorLocation: this.state.priorLocation,
                breadCrumbs: this.state.breadCrumbs
            }
        });

        breadcrumbTool.on("change", (e) => {
            this.state.breadCrumbs.push(e.location);
            this.saveState();
        })

        breadcrumbTool.on("clear", (e) => {
            this.state.breadCrumbs = [];
            this.saveState();
        })

        new ShowCoordinatesTool(map, {});

        // add a button to go to current location
        if (document.querySelector(".north_arrow")) {
            const northArrow = document.querySelector(".north_arrow")!;
            // set the text to an up arrow
            northArrow.innerHTML = "&#8593;";
        }
    }

    listenForChangesToDeviceOrientation() {
        // listen for a DeviceMotionEvent
        const orientationArrow = document.getElementById("north_arrow")!;
        onOrientation(orientation => {
            const { alpha, beta, gamma } = orientation;
            if (typeof alpha === "number" && typeof beta === "number") {
                if (beta > 45) {
                    orientationArrow.style.visibility = "hidden";
                }
                if (beta < 45) {
                    orientationArrow.style.visibility = "visible";
                    orientationArrow.style.setProperty("--orientation", `${alpha}deg`);
                    orientationArrow.classList.toggle(
                        "not-north",
                        alpha < -15 || alpha > 15
                    );
                }
            }
        });
    }

    saveState() {
        const data = JSON.stringify(this.state);
        localStorage.setItem("state", data);
        console.log(`state saved: ${data}`)
    }

    loadState() {
        const state = localStorage.getItem("state");
        if (state) {
            console.log(`state loaded: ${state}`)
            this.state = JSON.parse(state);
        }
    }
}
