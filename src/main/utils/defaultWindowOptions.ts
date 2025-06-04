import { BrowserWindowConstructorOptions } from "electron";
import { join } from "path";
export const defaultWindowOptions: BrowserWindowConstructorOptions = {
  show: true,
  autoHideMenuBar: false,
  trafficLightPosition: { x: 10, y: 15 },
  titleBarStyle: "hidden",
  webPreferences: {
    preload: join(__dirname, "../preload/index.js"),
    sandbox: false,
    backgroundThrottling: false,
    contextIsolation: true,
    nodeIntegration: false,
  },
};
