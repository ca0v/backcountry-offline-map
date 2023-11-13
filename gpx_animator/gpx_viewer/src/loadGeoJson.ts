import { Map } from "@maptiler/sdk";
import { GeoJson } from "./geojson";
import { playbackRoute } from "./playbackRoute";
import { sleep } from "./sleep";
import { computeExtent } from "./computeExtent";

export async function loadGeoJson(map: Map, points: GeoJson) {
    // read the track points from ../data/explore/track_points.geojson
    map.addSource("track_points", {
        type: "geojson",
        data: points,
    });

    // render the source on the map
    map.addLayer({
        id: "track_points",
        type: "circle",
        source: "track_points",
        paint: {
            "circle-radius": 3,
            "circle-color": "white",
            "circle-stroke-color": "black",
            "circle-stroke-width": 1,
        },
    });

    // get extent of the track points
    {
        const extent = computeExtent(points);
        console.log("extent", extent);
        // set the map view to the extent of the track points
        map.fitBounds(extent as any, {
            padding: 20,
        });
    }

    await sleep(5000);
    await playbackRoute(map, points);
}