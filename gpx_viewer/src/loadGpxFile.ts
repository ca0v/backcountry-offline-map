import { gpx_to_geojson } from "./gpx_to_geojson";

export async function loadGpxFile(fileName: string) {
    const response = await fetch(fileName);
    const gpxContent = await response.text();
    return gpx_to_geojson(gpxContent);
}
