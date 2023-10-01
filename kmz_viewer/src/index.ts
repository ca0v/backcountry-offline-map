export { run as runTests } from "./tests/test1.js";
import { AppController } from "./AppController.js";

export async function run() {
  const appController = new AppController({});
  appController.loadState();
  window.addEventListener("beforeunload", () => {
    appController.saveState();
  });
  return appController.run();
}
