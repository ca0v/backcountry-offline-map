import { toast } from "../toast.js";
import { html } from "./html.js";

export class ShowCoordinatesTool {
    constructor(map: L.Map, options: {}) {
        // show the coordinates when the mouse is clicked
        const locationElement = html`<div class="coordinates"></div>`;
        map.getContainer().appendChild(locationElement);

        // copy location to clipboard when clicked
        locationElement.onclick = (e) => {
            const text = locationElement.innerHTML;
            navigator.clipboard.writeText(text);
            // show a toast message
            const message = "Copied to clipboard";
            toast(message);
            e.stopPropagation();
        };

        map.on("click", (e) => {
            const { lat, lng } = e.latlng;
            const minutes = {
                lat: Math.abs((lat % 1) * 60).toFixed(2),
                lng: Math.abs((lng % 1) * 60).toFixed(2),
            };
            const degrees = {
                lat: Math.floor(Math.abs(lat)),
                lng: Math.floor(Math.abs(lng)),
            };

            const display = `${degrees.lat}°${minutes.lat}'N, ${degrees.lng}°${minutes.lng}'W`;
            locationElement.innerHTML = display;
        });
    }
}