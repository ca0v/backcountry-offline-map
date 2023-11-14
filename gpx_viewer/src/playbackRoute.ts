import { Map, Marker } from "@maptiler/sdk";
import { GeoJson, Geometry } from "./geojson";
import { animationDelay } from "./sleep";

export async function playbackRoute(map: Map, points: GeoJson) {
    if (!points?.features?.length) throw new Error("No points found");

    const start = (points.features[0].geometry as Geometry).coordinates as [number, number];

    // put a green marker at the start of the route
    new Marker({
        color: "green",
        scale: 0.3,
    })
        .setLngLat(start)
        .addTo(map);

    const corey = new Marker({
        color: "red",
        scale: 0.5,
    }).setLngLat(start)
        .addTo(map);

    const tony = new Marker({
        color: "orange",
        scale: 0.3,
    }).setLngLat(start)
        .addTo(map);


    const followCorey = () => {
        // place tony where this marker was
        const coreyLngLat = corey.getLngLat().toArray();
        const tonyLngLat = tony.getLngLat().toArray();
        const randomLngLat = [1, 1].map(i => i * (Math.random() - 0.5) * 0.003);
        // between corey and tony with some random offset
        const tonyTargetLngLat = [0, 1].map(i => coreyLngLat[i] + randomLngLat[i]);
        const tonyNextPosition = [0, 1].map(i => 0.95 * tonyLngLat[i] + 0.05 * tonyTargetLngLat[i]);
        tony.setLngLat(tonyNextPosition as [number, number]);
        requestAnimationFrame(followCorey);
    }
    followCorey();

    for (let i = 0; i < points.features.length; i++) {
        const feature = points.features[i];
        const geometry = feature.geometry as Geometry;
        const [lng, lat] = geometry.coordinates;
        corey.setLngLat([lng, lat]);

        await animationDelay(5);
    }

}
