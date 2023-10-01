import type * as LType from "leaflet";
import { toast } from "../toast.js";
import { onLocation } from "./getCurrentLocation.js";
import type { Location } from "./getCurrentLocation.js";
import { onOrientation } from "./orientation.js";
import { html } from "./html.js";
import { EventManager } from "./EventManager.js";
declare var L: typeof LType;

const default_options = {
    location: null as Location | null,
    isExpanded: false,
}

type Options = typeof default_options;

export class NavigateToPoint {
    private map: L.Map;
    private options: Options;
    private compass: HTMLElement;
    private launchButton: HTMLElement;
    private active = false;
    private off = [] as Array<() => void>;
    private events = new EventManager();

    constructor(map: L.Map, options: Partial<Options>) {
        this.map = map;
        this.options = Object.freeze(Object.assign({ ...default_options }, options));
        this.compass = html`<div class="navigator-compass">⇧</div>`
        this.launchButton = html`<button class="navigate-to-point" title="Navigate to point">N</button>`;
        // add the button to the map
        document.body.appendChild(this.launchButton);
        // when user clicks the button, listen for a map click and start navigating to that point
        this.launchButton.addEventListener("click", () => {
            if (this.active) {
                {
                    this.off.forEach(off => off());
                    this.off = [];
                }
                this.active = false;
                this.trigger("clear", {});
                return;
            }
            this.launchButton.textContent = "Click the map...";

            this.map.once("click", (event) => {
                this.active = true;
                const { lat, lng } = event.latlng;
                this.options = {
                    location: { lat, lng },
                    isExpanded: this.options.isExpanded
                };
                this.render();
                this.trigger("change", { ...this.options })
            });
        });

        if (this.options.location) {
            this.active = true;
            this.render();
        }

        this.compass.classList.toggle("expanded", this.options.isExpanded);

        this.compass.addEventListener("click", () => {
            this.compass.classList.toggle("expanded");
            this.options.isExpanded = this.compass.classList.contains("expanded");
            this.trigger("change", { ...this.options });
        });
    }

    async render() {
        document.body.appendChild(this.compass);

        // place a marker on the map
        const [lat, lng] = [this.options.location!.lat, this.options.location!.lng];
        const marker = L.marker([lat, lng]).addTo(this.map);
        this.off.push(() => {
            marker.remove();
            this.compass.remove();
            this.launchButton.textContent = "N";
        });
        let currentLocation = { lat: 0, lng: 0 };
        let { off } = onLocation(location => {
            currentLocation = location;
            const distance = this.map.distance([location.lat, location.lng], [this.options.location!.lat, this.options.location!.lng]);
            this.launchButton.textContent = asDistance(distance);
        });
        this.off.push(off);

        ({ off } = onOrientation(async orientation => {
            const dx = currentLocation.lng - this.options.location!.lng;
            const dy = currentLocation.lat - this.options.location!.lat;
            // what is the angle between the two points?  North should be 0
            const { alpha } = orientation;
            const angle = alpha + Math.atan2(-dy, dx) * 180 / Math.PI - 90;
            console.log(angle);
            this.compass.style.setProperty("--orientation", `${angle}deg`);
        }));
        this.off.push(off);
    }

    trigger(event: string, data: any) {
        this.events.trigger(event, data);
    }

    on(event: string, callback: (e: any) => void) {
        return this.events.on(event, callback);
    }

}

function asDistance(distanceInMeters: number) {
    if (distanceInMeters < 100) {
        return `Arrived!`
    }
    if (distanceInMeters < 1000) {
        return `${Math.round(distanceInMeters)} m`;
    } else {
        return `${Math.round(distanceInMeters / 1000)} km`;
    }
}
