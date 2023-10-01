import type * as LType from "leaflet";
import { onLocation } from "./getCurrentLocation.js";
import { html } from "./html.js";
declare var L: typeof LType;

const default_options = {}
type Options = typeof default_options;

export class ShowCurrentLocation {
    private readonly map: L.Map;
    private options: Options;
    private launchButton: HTMLElement;
    private marker?: L.Marker;
    private off = [] as Array<() => void>;
    private active = false;

    constructor(map: L.Map, options: Partial<Options>) {
        this.map = map;
        this.options = Object.freeze(Object.assign({ ...default_options }, options));
        this.launchButton = html`<button class="current-location-tool" title="Show current location">📍</button>`;
        map.getContainer().appendChild(this.launchButton);
        this.launchButton.onclick = async () => {
            if (!this.active) {
                this.active = true;
                // get the current location using web api
                const { off } = onLocation(currentLocation => {
                    if (!this.marker) {
                        map.setView(currentLocation, 16);
                        this.marker = L.marker(currentLocation, {
                            icon: L.divIcon({
                                className: "current_location",
                                html: "&#x1F4CD;",
                            }),
                        }).addTo(map);
                    } else {
                        this.marker.setLatLng(currentLocation);
                    }
                });
                this.off.push(off);
            } else {
                this.active = false;
                this.off.forEach(off => off());
                this.marker?.remove();
this.marker=null
            }
        };
    }
}