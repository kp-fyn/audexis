import { app, BrowserWindow, Menu, protocol } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import MainWindow from "./classes/mainWindow";
import { handleEvents } from "./utils/Events";
import { AudioFile } from "@/types";
import TagManager from "./classes/TagManager";
import getMenu from "./utils/Shortcuts";
import { updateElectronApp } from "update-electron-app";
updateElectronApp();

if (started) {
  app.quit();
}
const tagManager = new TagManager();
let mainWindow: MainWindow | null = null;
const audioFiles = new Map<string, AudioFile>();
handleEvents();
const menu = getMenu();
Menu.setApplicationMenu(menu);

const createWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) mainWindow = new MainWindow();

  protocol.registerFileProtocol("static", (request, callback) => {
    const url = request.url.replace("static://", "");

    const basePath = app.isPackaged
      ? path.join(process.resourcesPath, "resources")
      : path.join(__dirname, "..", "..", "resources");

    const filePath = path.join(basePath, decodeURIComponent(url));

    callback({ path: filePath });
  });
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  mainWindow.maximize();
  mainWindow.show();
  if (!app.isPackaged) mainWindow.webContents.openDevTools();
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
