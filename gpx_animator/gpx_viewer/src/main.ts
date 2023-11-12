import '@maptiler/sdk/dist/maptiler-sdk.css';
import './style.css';
import { config, Map } from '@maptiler/sdk';

export interface Root {
  "@attributes": Attributes
  "#text": string[]
  trk: Trk[]
}

export interface Attributes {
  version: string
  creator: string
}

export interface Attributes {
  lat: string
  lon: string
}

export interface Trk {
  "@attributes": Attributes
  "#text": string[]
  name: Name
  desc: Desc
  trkseg: Trkseg
}

export interface Name {
  "@attributes": Attributes
  "#text": string
}

export interface Desc {
  "@attributes": Attributes
  "#text": string
}

export interface Trkseg {
  "@attributes": Attributes
  "#text": string[]
  trkpt: Trkpt[]
}

export interface Trkpt {
  "@attributes": Attributes
  "#text": string[]
  ele: Ele
  time: Time
  desc: Desc2
}

export interface Ele {
  "@attributes": Attributes
  "#text": string
}

export interface Time {
  "@attributes": Attributes
  "#text": string
}

export interface Desc2 {
  "@attributes": Attributes
  "#text": string
}


function readLocalStorage(name: string) {
  const value = localStorage.getItem(name);
  return value ? JSON.parse(value) : null;
}

function writeLocalStorage(name: string, value: any) {
  localStorage.setItem(name, JSON.stringify(value));
}

// if user presses "I", create an drag-and-drop zone that allows user to drop a file
// if user drops a file, read the file and display it on the map
// if user presses "I" again, remove the drag-and-drop zone
function setupRequestToImportFileHandler(map: Map) {
  let hasDropZone = false;

  const onDrop = (e:DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    console.log('File dropped', file);
    // read the file and display it on the map
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target?.result;
      if (!fileContent) return;
      console.log('File content', fileContent);
      const gpxContent = fileContent.toString();

      const geoJsonContent = gpx_to_geojson(gpxContent);
      // display the GPX file on the map
      map.addSource("gpx",{
        type: "geojson",
        data: geoJsonContent,
      });

    };
    reader.readAsText(file);
  };

  document.onkeydown = (e) => {
    if (e.key === 'i') {
      if (hasDropZone) {
        const dropZone = document.querySelector<HTMLDivElement>('.drop-zone');
        if (!dropZone) throw new Error('Drop zone not found');
        dropZone.removeEventListener('drop', onDrop);
        dropZone.remove();
        hasDropZone = false;
        return;
      }
      // create a drag-and-drop zone
      const dropZone = document.createElement('div');
      dropZone.classList.add('drop-zone');
      document.body.appendChild(dropZone);

      // initialize to allow user to drop files on this div
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      dropZone.addEventListener('drop', onDrop);

      hasDropZone = true;
    }
  }
}

async function init() {
  const container = document.getElementById('app');

  if (!container) throw new Error('There is no div with the id: "map" ');

  let apiKey = readLocalStorage('maptiler_api_key');
  if (!apiKey) {
    apiKey = prompt('Please enter your MapTiler API key');
    if (!apiKey) throw new Error('No API key provided');
    writeLocalStorage('maptiler_api_key', apiKey);
  }

  config.apiKey = apiKey;
  const map = new Map({ container });

  map.on("load", async () => {
    setupRequestToImportFileHandler(map);
    await loadTrackPoints(map)  
  });

}

async function loadTrackPoints(map: Map) {
  // read the track points from ../data/explore/track_points.geojson
  const track_points = await fetch('../data/explore/track_points.geojson');
  const track_points_json = await track_points.json();

  console.log({track_points, track_points_json});

  map.addSource("track_points",{
    type: "geojson",
    data: track_points_json,
  });

  // render the source on the map
  map.addLayer({
    id: "track_points",
    type: "circle",
    source: "track_points",
    paint: {
      "circle-radius": 5,
      "circle-color": "#007cbf",
    },
  });

}

init();

function gpx_to_geojson(gpxContent: string) {
  // convert the xml to json
  const parser = new DOMParser();
  const xml = parser.parseFromString(gpxContent, "text/xml");
  const geoJsonContent = xmlToJson(xml.documentElement) as Root;
  console.log('geoJsonContent', JSON.stringify(geoJsonContent));
  
  return geoJsonContent;
}

function xmlToJson(xml: Element) {
  // Create the return object
  var obj: any = {};

  if (xml.nodeType == 1) {
    // element
    // do attributes
    if (xml.attributes) {
      obj['@attributes'] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        if (attribute) {
          obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
        }
      }
    }
  } else if (xml.nodeType == 3) {
    // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for (var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      if (item) {
        var nodeName = item.nodeName;
        if (typeof obj[nodeName] == 'undefined') {
          obj[nodeName] = xmlToJson(item as Element);
        } else {
          if (typeof obj[nodeName].push == 'undefined') {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item as Element));
        }
      }
    }
  }
  return obj;
}
