import { Gpx } from "./gpx";
import { GeoJson } from "./geojson";
import { xmlToJson } from "./xmlToJson";


export function gpx_to_geojson(gpxContent: string) {
    // convert the xml to json
    const parser = new DOMParser();
    const xml = parser.parseFromString(gpxContent, "text/xml");
    const geoJsonContent = xmlToJson(xml.documentElement) as Gpx;

    const result = {} as GeoJson;
    result.features = [];
    result.type = "FeatureCollection";
    result.name = "track_points";
    result.crs = {
        type: "name",
        properties: {
            name: "urn:ogc:def:crs:OGC:1.3:CRS84",
        },
    };

    if (!Array.isArray(geoJsonContent.trk)) {
        geoJsonContent.trk = [geoJsonContent.trk];
    }

    geoJsonContent.trk.forEach((trk) => {
        trk.trkseg.trkpt.forEach((trkpt) => {
            const feature = {} as any;
            feature.type = "Feature";
            feature.properties = {
                track_fid: trk["@attributes"].id,
                track_seg_id: trk.trkseg["@attributes"].id,
                track_seg_point_id: trkpt["@attributes"].id,
                ele: trkpt.ele,
                time: trkpt.time,
                desc: trkpt.desc,
            };
            feature.geometry = {
                type: "Point",
                coordinates: [
                    parseFloat(trkpt["@attributes"].lon),
                    parseFloat(trkpt["@attributes"].lat),
                ],
            };
            result.features.push(feature);
        });
    });

    return result;
}
