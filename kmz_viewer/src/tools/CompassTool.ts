import { html } from "./html.js";
import { onOrientation } from "./orientation.js";

// ↑

const default_options = {};

export class CompassTool {
    private readonly map: L.Map;
    private options: {};
    private compass: HTMLElement;

    constructor(map: L.Map, options: {}) {
        this.map = map;
        this.options = Object.freeze(Object.assign({ ...default_options }, options));
        this.compass = html`<div class="north_arrow">⇑</div>`;
        // add the button to the map
        this.map.getContainer().appendChild(this.compass);
        this.start();
    }

    start() {
        // listen for a DeviceMotionEvent
        const orientationArrow = this.compass;
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


}