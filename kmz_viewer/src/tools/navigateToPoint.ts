import type * as LType from "leaflet";
import { toast } from "../toast.js";
import { onLocation } from "./getCurrentLocation.js";
import { onOrientation } from "./orientation.js";
declare var L: typeof LType;

const default_options = {
    lng: 0,
    lat: 0
}

type Options = typeof default_options;

export class NavigateToPoint {
    private map: L.Map;
    private options: Options;
    private compass: HTMLElement;
    private launchButton: HTMLElement;
    private active = false;
    private off = [] as Array<() => void>;

    constructor(map: L.Map, options: Partial<Options>) {
        this.map = map;
        this.options = Object.freeze(Object.assign({ ...default_options }, options));
        this.compass = html`<div class="navigator-compass">⇧</div>`
        this.launchButton = html`<button class="navigate-to-point">Navigate to point</button>`;
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
                return;
            }
            this.launchButton.textContent = "Click the map...";

            this.map.once("click", (event) => {
                this.active = true;
                const { lat, lng } = event.latlng;
                this.options = { lat, lng };
                this.render();
                toast(`Navigating to point ${lat}, ${lng}`);
                document.body.appendChild(this.compass);

                // place a marker on the map
                const marker = L.marker([lat, lng]).addTo(this.map);
                this.off.push(() => {
                    marker.remove();
                    this.compass.remove();
                    this.launchButton.textContent = "Navigate to point";
                })
            });
        });
    }

    async render() {
        let currentLocation = { lat: 0, lng: 0 };
        let { off } = onLocation(location => {
            currentLocation = location;
            const distance = this.map.distance([location.lat, location.lng], [this.options.lat, this.options.lng]);
            this.launchButton.textContent = asDistance(distance);
        });
        this.off.push(off);

        ({ off } = onOrientation(async orientation => {
            const dx = currentLocation.lng - this.options.lng;
            const dy = currentLocation.lat - this.options.lat;
            // what is the angle between the two points?  North should be 0
            const { alpha } = orientation;
            const angle = alpha + Math.atan2(-dy, dx) * 180 / Math.PI - 90;
            console.log(angle);
            this.compass.style.setProperty("--orientation", `${angle}deg`);
        }));
        this.off.push(off);
    }
}

function html(strings: TemplateStringsArray, ...values: any[]) {
    const template = document.createElement("template");
    template.innerHTML = strings.join("");
    // 34°50.29'N, 82°14.48'W
    return template.content.firstElementChild as HTMLElement;
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