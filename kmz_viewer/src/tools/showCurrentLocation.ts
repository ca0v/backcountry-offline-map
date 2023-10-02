import type * as LType from "leaflet";
import { onLocation } from "./getCurrentLocation.js";
import { html } from "./html.js";
import { EventManager } from "./EventManager.js";
import type { Location } from "./getCurrentLocation.js";

// 📍
declare var L: typeof LType;

const default_options = {
    location: null as null | Location,
}
type Options = typeof default_options;

export class ShowCurrentLocation {
    private readonly map: L.Map;
    private launchButton: HTMLElement;
    private marker: null | L.Marker = null;
    private off = [] as Array<() => void>;
    private active = false;
    private events = new EventManager();

    constructor(map: L.Map, options: Partial<Options>) {
        this.map = map;
        this.launchButton = html`<button class="current-location-tool" title="Show current location">X</button>`;
        this.map.getContainer().appendChild(this.launchButton);

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
                                iconSize: [24, 24],
                                html: "X",
                            }),
                        }).addTo(map);
                        this.off.push(() => {
                            this.marker?.remove();
                            this.marker = null;
                        });
                    } else {
                        this.marker.setLatLng(currentLocation);
                        // if the current location is off the map, pan to it
                        if (!map.getBounds().contains(currentLocation)) {
                            map.panTo(currentLocation);
                        }
                    }
                    this.trigger("change", { location: currentLocation });
                });
                this.off.push(off);
            } else {
                this.active = false;
                this.off.forEach(off => off());
                this.off = [];
                this.trigger("clear", {});
            }
        };

        if (options.location) {
            this.launchButton.click();
        }
    }

    trigger(event: string, data: any) {
        this.events.trigger(event, data);
    }

    on(event: string, cb: (e: any) => void) {
        return this.events.on(event, cb);
    }

}