import type * as LType from "leaflet";
import { html } from "./html.js";
import { onLocation } from "./getCurrentLocation.js";
import type { Location } from "./getCurrentLocation.js";
import { EventManager } from "./EventManager.js";
declare var L: typeof LType;

export { Breadcrumbs };

const default_options = {
    minDistance: 10,
    state: {
        priorLocation: null as Location | null,
        breadCrumbs: [] as Array<Location>,
    }
}

type Options = typeof default_options;

class Breadcrumbs {
    private readonly map: L.Map;
    private options: Options;
    private launchButton: HTMLElement;
    private markers = [] as Array<L.Marker>;
    private active = false;
    private off = [] as Array<() => void>;
    private events = new EventManager();

    private state = {} as Options["state"]

    constructor(map: L.Map, options: Partial<Options>) {
        this.map = map;
        this.options = Object.freeze(Object.assign({ ...default_options }, options));
        this.state = this.options.state;

        this.launchButton = html`<button class="breadcrumb-tool" title="Breadcrumbs">B</button>`;
        // add the button to the map
        document.body.appendChild(this.launchButton);
        this.launchButton.addEventListener("click", () => {
            if (!this.active) {
                this.active = true;
                this.start();
            } else {
                this.active = false;
                this.stop();
            }
            this.launchButton.classList.toggle("active", this.active);
        });

        if (this.state.breadCrumbs.length) {
            this.active = true;
            this.start();
            this.launchButton.classList.toggle("active", this.active);
        }
    }

    trigger(event: string, data: any) {
        this.events.trigger(event, data);
    }

    on(event: string, cb: (e: any) => void) {
        return this.events.on(event, cb);
    }

    async start() {
        this.state.breadCrumbs?.forEach(breadCrumb => {
            this.drawBreadcrumb(breadCrumb);
        })
        let { off } = onLocation(currentLocation => {
            if (!this.state.priorLocation) {
                this.state.priorLocation = currentLocation;
                this.state.breadCrumbs.push(currentLocation);
                this.trigger("change", { location: currentLocation });
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
                    this.trigger("change", { location: currentLocation });
                    this.drawBreadcrumb(currentLocation);
                    // set the current location as the prior location
                    this.state.priorLocation = currentLocation;
                }
            }
        });
        this.off.push(off);
    }

    stop() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        this.state = {
            priorLocation: null,
            breadCrumbs: []
        }
        this.off.forEach(off => off());
        this.off = [];
        this.trigger("clear", {});
    }

    drawBreadcrumb(currentLocation: { lat: number; lng: number; }) {
        const marker = L.marker(currentLocation, {
            icon: L.divIcon({
                className: "breadcrumb",
                html: "X",
            }),
        }).addTo(this.map);
        this.markers.push(marker);
    }
}

