
async function loadJsonFile(fileName: string) {
    const track_points = await fetch(fileName);
    const track_points_json = await track_points.json();
    return track_points_json;
}
