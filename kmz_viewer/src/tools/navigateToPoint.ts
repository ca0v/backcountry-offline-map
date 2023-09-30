import type * as LType from "leaflet";
import { toast } from "../toast.js";
import { getCurrentLocation } from "./getCurrentLocation.js";
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
    launchButton: HTMLElement;

    constructor(map: L.Map, options: Partial<Options>) {
        this.map = map;
        this.options = Object.freeze(Object.assign({ ...default_options }, options));
        this.compass = html`<div class="navigator-compass">⇧</div>`
        this.launchButton = html`<button class="navigate-to-point">Navigate to point</button>`;
        // add the button to the map
        document.body.appendChild(this.launchButton);
        // when user clicks the button, listen for a map click and start navigating to that point
        this.launchButton.addEventListener("click", () => {
            this.map.once("click", (event) => {
                const { lat, lng } = event.latlng;
                this.options = { lat, lng };
                this.render();
                toast(`Navigating to point ${lat}, ${lng}`);
                document.body.appendChild(this.compass);
            });
        });
    }

    async render() {
        const currentLocation = await getCurrentLocation();
        const dx = currentLocation.lng - this.options.lng;
        const dy = currentLocation.lat - this.options.lat;
        onOrientation(orientation => {
            // what is the angle between the two points?  North should be 0
            const { alpha } = orientation;
            const angle = alpha + Math.atan2(-dy, dx) * 180 / Math.PI - 90;
            console.log(angle);
            this.compass.style.setProperty("--orientation", `${angle}deg`);
        });
    }
}

function html(strings: TemplateStringsArray, ...values: any[]) {
    const template = document.createElement("template");
    template.innerHTML = strings.join("");
    // 34°50.29'N, 82°14.48'W
    return template.content.firstElementChild as HTMLElement;
}