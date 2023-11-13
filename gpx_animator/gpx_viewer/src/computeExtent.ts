import { GeoJson } from "./geojson";

export function computeExtent(points: GeoJson) {
    let [minLng, minLat, maxLng, maxLat] = [180, 90, -180, -90];
    points.features.forEach((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        minLng = Math.min(minLng, lng);
        minLat = Math.min(minLat, lat);
        maxLng = Math.max(maxLng, lng);
        maxLat = Math.max(maxLat, lat);
    });
    const extent = [
        { lon: minLng, lat: minLat },
        { lon: maxLng, lat: maxLat },
    ];
    return extent;
}
