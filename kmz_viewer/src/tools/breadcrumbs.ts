import type * as LType from "leaflet";
import { toast } from "../toast.js";
import { getCurrentLocation } from "./getCurrentLocation.js";
declare var L: typeof LType;

export { Breadcrumbs };

const default_options = {
    minDistance: 10
}

type Options = typeof default_options;

class Breadcrumbs {
    readonly map: L.Map;
    options: Options;

    state = {
        isPaused: false,
        priorLocation: null as { lat: number; lng: number; } | null,
        breadCrumbs: [] as Array<{ lat: number; lng: number; }>
    }

    constructor(map: L.Map, options: Partial<Options>) {
        this.map = map;
        this.options = Object.freeze(Object.assign({ ...default_options }, options));
        this.restoreState();
        if (!this.state.isPaused) {
            this.state.isPaused = true; // prevent start from aborting
            this.start();
        }
    }

    restoreState() {
        const state = localStorage.getItem("breadcrumbs");
        if (state) {
            this.state = JSON.parse(state);
            this.state.breadCrumbs.forEach(breadCrumb => {
                this.drawBreadcrumb(breadCrumb);
            })
        }
    }

    saveState() {
        localStorage.setItem("breadcrumbs", JSON.stringify(this.state));
    }

    async start() {
        if (!this.state.isPaused) return;
        this.state.isPaused = false;
        const doit = async () => {
            if (this.state.isPaused) return;
            await this.poll()
            setTimeout(async () => {
                await doit();
            }, 1000 * 5);
        }
        doit();
    }


    async poll() {
        // get the current location
        const currentLocation = await getCurrentLocation();
        if (!this.state.priorLocation) {
            this.state.priorLocation = currentLocation;
            this.state.breadCrumbs.push(currentLocation);
            this.saveState();
            this.drawBreadcrumb(currentLocation);
        } else {
            // calculate the distance between the current location and the prior location
            const distance = this.map.distance(
                [currentLocation.lat, currentLocation.lng],
                [this.state.priorLocation.lat, this.state.priorLocation.lng]
            );
            // if the distance is greater than the minimum distance
            if (distance > this.options.minDistance) {
                // add the current location to the breadcrumbs
                this.state.breadCrumbs.push(currentLocation);
                this.saveState();
                this.drawBreadcrumb(currentLocation);
                // set the current location as the prior location
                this.state.priorLocation = currentLocation;
            } else {
                toast(`distance ${distance} is less than ${this.options.minDistance}`)
            }
        }
    }

    drawBreadcrumb(currentLocation: { lat: number; lng: number; }) {
        L.marker(currentLocation, {
            icon: L.divIcon({
                className: "current_location",
                html: "X",
            }),
        }).addTo(this.map);
    }
}

