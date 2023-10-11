import type * as LType from "leaflet";
import { html } from "./html.js";
import { onLocation } from "./getCurrentLocation.js";
import type { GeoLocation } from "./getCurrentLocation.js";
import { EventManager } from "./EventManager.js";
declare var L: typeof LType;

export { Breadcrumbs };
export type { Breadcrumb };

interface Breadcrumb {
    location: GeoLocation;
    timestamp: number;
};

const default_options = {
    minDistance: 10,
    state: {
        priorLocation: null as GeoLocation | null,
        breadcrumbs: [] as Array<Breadcrumb>,
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

        if (this.state.breadcrumbs.length) {
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
        if (this.state.breadcrumbs?.length) {
            const recentBreadcrumb = this.state.breadcrumbs.filter(c => c.timestamp > Date.now() - 1000 * 60 * 60 * 24 * 0.5);
            console.log(`adding breadcrumbs: ${recentBreadcrumb.length}`)
            recentBreadcrumb.forEach(breadCrumb => this.drawBreadcrumb(breadCrumb.location));
        }

        let { off } = onLocation(currentLocation => {
            if (!this.state.priorLocation) {
                this.state.priorLocation = currentLocation;
                this.state.breadcrumbs.push({
                    location: currentLocation,
                    timestamp: Date.now(),
                });
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
                    // is it near any existing breadcrumbs?  If so, ignore
                    const near = this.state.breadcrumbs.some(breadcrumb => {
                        if (!breadcrumb.location) {
                            return;
                        }
                        const distance = this.map.distance(
                            [currentLocation.lat, currentLocation.lng],
                            [breadcrumb.location.lat, breadcrumb.location.lng]
                        );
                        return distance < this.options.minDistance;
                    });
                    if (near) {
                        return;
                    }
                    // add the current location to the breadcrumbs
                    this.state.breadcrumbs.push({ location: currentLocation, timestamp: Date.now() });
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
        this.off.forEach(off => off());
        this.off = [];
        this.trigger("stop", {});
    }

    clear() {
        this.trigger("clear", {});
    }

    drawBreadcrumb(currentLocation: { lat: number; lng: number; }) {
        const marker = L.marker(currentLocation, {
            icon: L.divIcon({
                iconSize: [12, 12],
                className: "breadcrumb",
                html: "●",
            }),
        }).addTo(this.map);
        this.markers.push(marker);
    }
}

