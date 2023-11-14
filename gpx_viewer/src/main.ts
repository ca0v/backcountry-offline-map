import "@maptiler/sdk/dist/maptiler-sdk.css";
import "./style.css";
import { config, Map } from "@maptiler/sdk";
import { loadGpxFile } from "./loadGpxFile";
import { gpx_to_geojson } from "./gpx_to_geojson";
import { readLocalStorage, writeLocalStorage } from "./readLocalStorage";
import { loadGeoJson } from "./loadGeoJson";
import { sleep } from "./sleep";
import { playbackRoute } from "./playbackRoute";

// if user presses "I", create an drag-and-drop zone that allows user to drop a file
// if user drops a file, read the file and display it on the map
// if user presses "I" again, remove the drag-and-drop zone
function setupRequestToImportFileHandler(map: Map) {
  let hasDropZone = false;

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    console.log("File dropped", file);
    // read the file and display it on the map
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result;
      if (!fileContent) return;
      console.log("File content", fileContent);
      const gpxContent = fileContent.toString();

      const geoJsonContent = gpx_to_geojson(gpxContent);
      // display the GPX file on the map
      map.addSource("gpx", {
        type: "geojson",
        data: geoJsonContent,
      });
    };
    reader.readAsText(file);
  };

  document.onkeydown = (e) => {
    if (e.key === "i") {
      if (hasDropZone) {
        const dropZone = document.querySelector<HTMLDivElement>(".drop-zone");
        if (!dropZone) throw new Error("Drop zone not found");
        dropZone.removeEventListener("drop", onDrop);
        dropZone.remove();
        hasDropZone = false;
        return;
      }
      // create a drag-and-drop zone
      const dropZone = document.createElement("div");
      dropZone.classList.add("drop-zone");
      document.body.appendChild(dropZone);

      // initialize to allow user to drop files on this div
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      dropZone.addEventListener("drop", onDrop);

      hasDropZone = true;
    }
  };
}

export async function run() {
  // read the story from the URL
  const url = new URL(window.location.href);

  const container = document.getElementById("app");
  if (!container) throw new Error('There is no div with the id: "map" ');

  let apiKey = url.searchParams.get("api_key");
  if (apiKey) {
    writeLocalStorage("maptiler_api_key", apiKey);
  }
  apiKey = apiKey || readLocalStorage("maptiler_api_key");
  if (!apiKey) {
    apiKey = prompt("Please enter your MapTiler API key");
    if (!apiKey) throw new Error("No API key provided");
    writeLocalStorage("maptiler_api_key", apiKey);
  }

  config.apiKey = apiKey;

  const story = url.searchParams.get("story");
  if (story) {
    document.querySelector(".player_buttons")?.remove();
  } else {
    return;
  }


  // map without the zoom in/out buttons
  const map = new Map({
    container,
    style: "topo-v2",
    attributionControl: false,
    geolocateControl: false,
    navigationControl: false
  });

  map.on("load", async () => {
    setupRequestToImportFileHandler(map);
    await playStory(map, story);
  });
}

async function playStory(map: Map, story: string) {
  const filePath = `../data/story/${story}.gpx`;
  console.log({ story, filePath })
  const points = await loadGpxFile(filePath);
  console.log({ points, })
  const geoJsonPoints = await loadGeoJson(map, points);

  let goBack = true;
  map.on("move", () => {
    goBack = false;
  });

  await sleep(1000);
  await playbackRoute(map, geoJsonPoints);

  // if user pans on the map, restart the clock
  while (!goBack) {
    goBack = true;
    await sleep(5000);
  }
  // navigate back
  window.history.back();
}