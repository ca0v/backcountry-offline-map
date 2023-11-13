import { Map, Marker } from "@maptiler/sdk";
import { GeoJson, Geometry } from "./geojson";
import { sleep } from "./sleep";

export async function playbackRoute(map: Map, points: GeoJson) {
    const pointFeaturesQueue = [] as Marker[];

    for (let i = 0; i < points.features.length; i++) {
        const feature = points.features[i];
        const geometry = feature.geometry as Geometry;
        const [lng, lat] = geometry.coordinates;

        const marker = new Marker({
            color: "red",
        }).setLngLat([lng, lat]);
        marker.addTo(map);

        pointFeaturesQueue.push(marker);
        if (pointFeaturesQueue.length > 3) {
            const marker = pointFeaturesQueue.shift();
            marker?.remove();
        }

        await sleep(100);
    }

    while (pointFeaturesQueue.length > 0) {
        const marker = pointFeaturesQueue.shift();
        marker?.remove();
        await sleep(250);
    }
}
