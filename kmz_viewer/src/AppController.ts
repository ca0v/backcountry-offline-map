import type * as LType from "leaflet";
declare var L: typeof LType;

import type { Breadcrumb } from "./tools/breadcrumbs.js";
import type { GeoLocation } from "./tools/getCurrentLocation.js";

import { Breadcrumbs } from "./tools/breadcrumbs.js";
import { NavigateToPoint } from "./tools/navigateToPoint.js"
import { ShowCurrentLocation } from "./tools/showCurrentLocation.js";
import { ShowCoordinatesTool } from "./tools/ShowCoordinates.js";
import { CompassTool } from "./tools/CompassTool.js";
import { EventManager } from "./tools/EventManager.js";

const default_state = {
    priorLocation: null as GeoLocation | null,
    breadcrumbs: [] as Array<Breadcrumb>,
    navigatingTo: {
        location: null as GeoLocation | null,
    }
}

const default_options = {
}

export type State = typeof default_state;
type Options = typeof default_options;

export class AppController {
    private options: Options;
    private state: Partial<State>;
    private eventManager = new EventManager();

    constructor(options: Partial<Options>, state: Partial<State>) {
        this.options = Object.freeze(Object.assign({ ...default_options }, options));
        this.state = state;
    }

    off() {
        this.eventManager.off();
    }

    on(topic: string, data: any) {
        return this.eventManager.on(topic, data);
    }

    trigger(topic: string, data: any) {
        this.eventManager.trigger(topic, data);
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

    async run() {
        // await this.installServiceWorker();
        this.showKmlViewer();
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
            this.trigger("StateChange", this.state);
        })

        currentLocationTool.on("clear", (e) => {
            this.state.priorLocation = null;
            this.trigger("StateChange", this.state);
        });

        const navigateToPointTool = new NavigateToPoint(map, { ...this.state.navigatingTo });

        navigateToPointTool.on("change", (e) => {
            if (!this.state.navigatingTo) this.state.navigatingTo = { location: null };
            this.state.navigatingTo.location = e.location;
            this.trigger("StateChange", this.state);
        })

        navigateToPointTool.on("clear", (e) => {
            if (!this.state.navigatingTo) return;
            this.state.navigatingTo.location = null;
            this.trigger("StateChange", this.state);
        })

        const breadcrumbTool = new Breadcrumbs(map, {
            minDistance: 10,
            state: {
                priorLocation: this.state.priorLocation || null,
                breadcrumbs: this.state.breadcrumbs || []
            }
        });

        breadcrumbTool.on("change", (e) => {
            if (!this.state.breadcrumbs) this.state.breadcrumbs = [];
            this.state.breadcrumbs.push(e.location);
            this.trigger("StateChange", this.state);
        })

        breadcrumbTool.on("clear", (e) => {
            this.state.breadcrumbs = [];
            this.trigger("StateChange", this.state);
        })

        new ShowCoordinatesTool(map, {});
        new CompassTool(map, {});

    }

}
