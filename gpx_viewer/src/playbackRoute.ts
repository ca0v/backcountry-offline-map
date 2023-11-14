import { Map, Marker } from "@maptiler/sdk";
import { Feature, GeoJson, Geometry } from "./geojson";

export async function playbackRoute(map: Map, points: GeoJson) {
    if (!points?.features?.length) throw new Error("No points found");

    const start = (points.features[0].geometry as Geometry).coordinates as [number, number];

    // put a green marker at the start of the route
    new Marker({
        color: "green",
        scale: 0.5,
    })
        .setLngLat(start)
        .addTo(map);

    // draw a line between corey and tony
    const leash = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': [[0, 0]]
                }
            }
        ]
    };

    map.addSource('line', {
        'type': 'geojson',
        'data': leash
    });

    const corey = new Marker({
        color: "red",
        scale: 0.8,
    }).setLngLat(start)
        .addTo(map);

    const tony = new Marker({
        color: "#ccc",
        scale: 0.5,
        offset: [0, -3],
    }).setLngLat(start)
        .addTo(map);

    map.addLayer({
        'id': 'line-animation',
        'type': 'line',
        'source': 'line',
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': 'orange',
            'line-width': 3,
            'line-opacity': 1
        }
    });


    return new Promise<void>((resolve) => {
        let currentTick = 0;
        let stop = false;
        const totalPoints = points.features.length;
        const totalTicks = 1000;
        const interpolate = (a: number, b: number, t: number) => a + (b - a) * t;
        const getLocation = (feature: Feature) => {
            const geometry = feature.geometry as Geometry;
            const [lng, lat] = geometry.coordinates;
            return [lng, lat];
        }

        {
            let timeToNextCourseChange = Date.now() + 100 * Math.random();
            let randomLngLat = [1, 1].map(i => i * (Math.random() - 0.5) * 0.005);
            let tonyTargetLngLat = tony.getLngLat().toArray().map((v, i) => v + randomLngLat[i]);
            const followCorey = () => {
                if (stop) return;
                // place tony where this marker was
                const coreyLngLat = corey.getLngLat().toArray();
                const tonyLngLat = tony.getLngLat().toArray();
                // between corey and tony with some random offset
                if (Date.now() > timeToNextCourseChange) {
                    randomLngLat = [1, 1].map(i => i * (Math.random() - 0.5) * 0.0003);
                    tonyTargetLngLat = [0, 1].map(i => coreyLngLat[i] + randomLngLat[i]);
                    timeToNextCourseChange = Date.now() + 300 * Math.random();
                }
                const tonyNextPosition = [0, 1].map(i => 0.9 * tonyLngLat[i] + 0.1 * tonyTargetLngLat[i]);
                tony.setLngLat(tonyNextPosition as [number, number]);
                requestAnimationFrame(followCorey);
            }
            followCorey();
        }
        const moveCorey = () => {
            if (stop) return;
            currentTick++;
            const idealIndex = currentTick / totalTicks * totalPoints;
            const pointIndex = Math.floor(idealIndex);
            if (stop || pointIndex + 1 >= totalPoints) {
                stop = true;
                return resolve();
            }
            const currentPoint = getLocation(points.features[pointIndex]);
            const nextPoint = getLocation(points.features[pointIndex + 1]);
            const coreyNextPosition = [0, 1].map(i => interpolate(currentPoint[i], nextPoint[i], (idealIndex - pointIndex)));
            corey.setLngLat(coreyNextPosition as [number, number]);
            requestAnimationFrame(moveCorey);
        }
        moveCorey();

        const moveLeash = () => {
            // move line from tony to corey
            if (stop) return;
            const tonyLngLat = tony.getLngLat().toArray();
            const coreyLngLat = corey.getLngLat().toArray();
            leash.features[0].geometry.coordinates = [tonyLngLat, coreyLngLat];
            // @ts-ignore
            map.getSource('line').setData(leash);
            requestAnimationFrame(moveLeash);
        }
        moveLeash();
    });
}
