import { app, BrowserWindow } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import MainWindow from "./classes/mainWindow";
import { handleEvents } from "./utils/Events";
import { AudioFile } from "@/types";
import TagManager from "./classes/TagManager";

if (started) {
  app.quit();
}
const tagManager = new TagManager();
let mainWindow: MainWindow | null = null;
const audioFiles = new Map<string, AudioFile>();

handleEvents();
const createWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) mainWindow = new MainWindow();

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  mainWindow.maximize();
  mainWindow.show();
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

export { mainWindow, audioFiles, tagManager };
