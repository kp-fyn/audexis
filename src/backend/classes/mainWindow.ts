import { BrowserWindow } from "electron";
import path from "node:path";
export default class MainWindow extends BrowserWindow {
  constructor() {
    super({
      width: 800,
      height: 600,
      trafficLightPosition: { x: 10, y: 15 },
      titleBarStyle: "hidden",
      backgroundColor: "#0a0a0a",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
      show: false,
    });
  }
}
