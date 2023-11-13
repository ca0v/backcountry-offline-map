import { Map, Marker } from "@maptiler/sdk";
import { GeoJson, Geometry } from "./geojson";
import { animationDelay } from "./sleep";

export async function playbackRoute(map: Map, points: GeoJson) {
    const pointFeaturesQueue = [] as Marker[];

    if (!points?.features?.length) throw new Error("No points found");

    // put a green marker at the start of the route
    new Marker({
        color: "green",
    })
        .setLngLat((points.features[0].geometry as Geometry).coordinates as any)
        .addTo(map);

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

        await animationDelay(5);
    }

    while (pointFeaturesQueue.length > 1) {
        const marker = pointFeaturesQueue.shift();
        marker?.remove();
        await animationDelay(25);
    }

}
