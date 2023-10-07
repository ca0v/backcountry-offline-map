export { run as runTests } from "./tests/test1.js";
import { AppController } from "./AppController.js";
import type { GeoLocation } from "./tools/getCurrentLocation.js";
import { getCurrentLocation } from "./tools/getCurrentLocation.js";
import type { State } from "./AppController.js";

// is there a debug query string?
const isDebug = window.location.search.includes("debug");

function round(value: number, precision = 3) {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

function generateBreadcrumbs(center = { "lat": 34.89497908539442, "lng": -82.32116793001722 }, count = 10) {
  return [...Array(count).keys()].map((_) => {
    const x = center.lng + (Math.random() - 0.5) * 0.01;
    const y = center.lat + (Math.random() - 0.5) * 0.01;
    return { lat: round(y, 3), lng: round(x, 3) };
  }).sort((a, b) => a.lat - b.lat);
}

function saveState(state: Partial<State>) {
  const data = JSON.stringify(state);
  localStorage.setItem("state", data);
}

function load<T>(key: string): T | null {
  const result = localStorage.getItem(key);
  if (!result) return null;
  return JSON.parse(result) as T;
}

function loadState() {
  const state = load<State>("state");
  return {
    breadcrumbs: state?.breadcrumbs || [],
    navigatingTo: {
      location: state?.navigatingTo?.location || null,
    },
    priorLocation: state?.priorLocation || null,
  } satisfies State;
}


export async function run() {
  const state = loadState();
  console.log("state", state);

  if (isDebug) {
    if (!state.breadcrumbs.length) {
      const currentLocation = await getCurrentLocation();
      const breadcrumbs = generateBreadcrumbs(currentLocation, 12).map((location) => ({
        location: location as GeoLocation,
        timestamp: Date.now(),
      }));
      state.breadcrumbs.push(...breadcrumbs);
    }
  }

  const appController = new AppController({}, state);

  appController.on("StateChange", (state: State) => {
    saveState(state);
    console.log("StateChange", state);
  });

  window.addEventListener("beforeunload", () => {
    appController.off();
  });

  return appController.run();
}
