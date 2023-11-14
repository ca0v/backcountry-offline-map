import { Map, Marker } from "@maptiler/sdk";
import { Feature, GeoJson, Geometry } from "./geojson";

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
        scale: 1,
    }).setLngLat(start)
        .addTo(map);

    const tony = new Marker({
        color: "orange",
        scale: 0.3,
    }).setLngLat(start)
        .addTo(map);


    {
        let timeToNextCourseChange = Date.now() + 1000 * Math.random();
        let randomLngLat = [1, 1].map(i => i * (Math.random() - 0.5) * 0.001);
        let tonyTargetLngLat = tony.getLngLat().toArray().map((v, i) => v + randomLngLat[i]);
        const followCorey = () => {
            // place tony where this marker was
            const coreyLngLat = corey.getLngLat().toArray();
            const tonyLngLat = tony.getLngLat().toArray();
            // between corey and tony with some random offset
            if (Date.now() > timeToNextCourseChange) {
                randomLngLat = [1, 1].map(i => i * (Math.random() - 0.5) * 0.0003);
                tonyTargetLngLat = [0, 1].map(i => coreyLngLat[i] + randomLngLat[i]);
                timeToNextCourseChange = Date.now() + 300 * Math.random();
            }
            const tonyNextPosition = [0, 1].map(i => 0.95 * tonyLngLat[i] + 0.05 * tonyTargetLngLat[i]);
            tony.setLngLat(tonyNextPosition as [number, number]);
            requestAnimationFrame(followCorey);
        }
        followCorey();
    }

    return new Promise<void>((resolve) => {
        let currentTick = 0;
        const totalPoints = points.features.length;
        const totalTicks = 1000;
        const interpolate = (a: number, b: number, t: number) => a + (b - a) * t;
        const getLocation = (feature: Feature) => {
            const geometry = feature.geometry as Geometry;
            const [lng, lat] = geometry.coordinates;
            return [lng, lat];
        }

        const moveCorey = () => {
            currentTick++;
            const idealIndex = currentTick / totalTicks * totalPoints;
            const pointIndex = Math.floor(idealIndex);
            if (pointIndex + 1 >= totalPoints) return resolve();
            const currentPoint = getLocation(points.features[pointIndex]);
            const nextPoint = getLocation(points.features[pointIndex + 1]);
            const coreyNextPosition = [0, 1].map(i => interpolate(currentPoint[i], nextPoint[i], (idealIndex - pointIndex)));
            corey.setLngLat(coreyNextPosition as [number, number]);
            requestAnimationFrame(moveCorey);
        }
        moveCorey();
    });
}
