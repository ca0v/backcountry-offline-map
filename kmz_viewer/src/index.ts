import { readQueryFlags } from "./readQueryFlags.js";
export { run as runTests } from "./tests/test1.js";
import { AppController } from "./AppController.js";
import type { State } from "./AppController.js";

// is there a debug query string?

function postMessageToServiceWorker(message: { command: string; }) {
  const channel1 = new MessageChannel();
  channel1.port1.onmessage = (event: MessageEvent<any>) => { };
  navigator.serviceWorker.controller?.postMessage(message, [channel1.port2]);
}

async function installServiceWorker() {
  try {
    await navigator.serviceWorker.register("/service-worker.js");
  } catch (registrationError) {
    console.error("SW registration failed: ", registrationError);
    throw registrationError;
  }
  postMessageToServiceWorker({ command: "ping" });
  postMessageToServiceWorker({ command: "getVersionInfo" });
}

async function init() {

  console.log('installing service worker');
  //await installServiceWorker();

  // this seems to be the best way to deal with versioning...
  // it will force the app to re-install
  console.log('checking query flags');
  const queryFlags = readQueryFlags();
  if (queryFlags.reinstall) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.unregister();
      console.log("service worker unregistered");
      const mapDiv = document.querySelector("#map")!;
      mapDiv.innerHTML = "Service worker unregistered";
      return;
    }
  }

  if (queryFlags.clear_cache) {
    postMessageToServiceWorker({ command: "clearCache" });
  }

  if (queryFlags.clear_tile_cache) {
    postMessageToServiceWorker({ command: "clearCacheTiles" });
  }

  if (queryFlags.clear_code_cache) {
    postMessageToServiceWorker({ command: "clearCacheCode" });
  }


}

function round(value: number, precision = 3) {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
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
  await init();
  const state = loadState();
  console.log("state", state);

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
