import { app, shell, BrowserWindow, ipcMain, Menu } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { AudioFile } from "../types";
import getMenu from "./utils/Menu";
import TagManager from "./classes/TagManager";
import FileUpload from "./utils/FileUpload";
import { handleEvents } from "./utils/Events";

let mainWindowId: number = 0;
const tagManager = new TagManager();
const audioFiles = new Map<string, AudioFile>();
const menu = getMenu();

// This method will be called when Electron has finished
function createWindow(): void {
  if (BrowserWindow.getAllWindows().length > 0) return;
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    trafficLightPosition: { x: 10, y: 15 },
    titleBarStyle: "hidden",
    backgroundColor: "#0a0a0a",

    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });

  mainWindowId = mainWindow.id;

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    Menu.setApplicationMenu(menu);
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/t ree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));

  createWindow();
  handleEvents();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("open-file", (event, filePath) => {
  event.preventDefault();
  if (filePath) {
    FileUpload([filePath]);
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
export { mainWindowId, audioFiles, tagManager };
