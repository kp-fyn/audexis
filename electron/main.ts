import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import MenuTemplate from "./MenuTemplate.ts";
import Constants from "./Constants.ts";
import NodeId3, { Tags } from "node-id3";
import { Changes, MusicMetadata, MusicMetadataFile } from "./electron-env";

const currentFiles = new Map<string, MusicMetadata>();

createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
// export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let mainWindow: BrowserWindow | null;

app.on("browser-window-created", (_ev, win) => {
  if (mainWindow) {
    if (mainWindow.id !== win.id && win.closable) win.close();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(`${process.env.VITE_PUBLIC}`, "audexis.png"),
    title: "Audexis",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),

      zoomFactor: 1.0,
      disableHtmlFullscreenWindowResize: true,
    },

    trafficLightPosition: { x: 10, y: 15 },
    titleBarStyle: "hidden",
  });
  mainWindow.on("close", () => {
    app.quit();
  });
  Menu.setApplicationMenu(MenuTemplate);
  mainWindow.on("blur", () => {
    mainWindow?.webContents.send("window-blur");
  });

  // Test active push message to Renderer-process.
  // mainWindow.webContents.on("did-finish-load", () => {
  //   mainWindow?.webContents.send(
  //     "main-process-message",
  //     new Date().toLocaleString(),
  //   );
  // });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    mainWindow = null;
  }
});

ipcMain.on(Constants.channels.SET_WINDOW_POSITION, (_event, { x, y }) => {
  if (mainWindow) mainWindow.setPosition(x, y);
});

ipcMain.handle(Constants.channels.GET_WINDOW_POSITION, () => {
  if (mainWindow) {
    const [x, y] = mainWindow.getPosition();
    return { x, y };
  }
});
ipcMain.handle(Constants.channels.OPEN_DIALOG, async () => {
  if (mainWindow) {
    const files = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "MP3 Audio", extensions: ["mp3"] }],
    });
    if (files.canceled) return [];
    if (files.filePaths.length > 0) {
      const parsedFiles = files.filePaths.filter((file) =>
        file.endsWith(".mp3")
      );
      parsedFiles.map((file) => {
        const tags = NodeId3.read(file);
        if (!tags) return;
        currentFiles.set(file, {
          ...getTags(tags),
        });
      });
      const realFiles = parseFiles();
      mainWindow?.webContents.send(Constants.channels.UPDATE, realFiles);
      return realFiles;
    } else return [];
  }
});
ipcMain.on(Constants.channels.SAVE, (_e, changes: Partial<Changes>) => {
  if (!changes.paths) return;
  changes.paths.map((path) => {
    try {
      const prevFile = currentFiles.get(path);
      if (!prevFile) return;
      NodeId3.write(
        {
          ...prevFile,
          ...changes,
        },
        path
      );

      const tags = NodeId3.read(path);
      if (!tags) return;
      currentFiles.set(path, {
        ...getTags(tags),
      });
    } catch (err) {
      console.log(err);
    }
    mainWindow?.webContents.send(Constants.channels.UPDATE, parseFiles());
  });
});
ipcMain.handle(Constants.channels.WINDOW_IS_MAXIMIZED, () => {
  if (mainWindow) {
    return mainWindow.isMaximized();
  }
});
ipcMain.on(Constants.channels.WINDOW_MINIMIZE, () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.on(Constants.channels.WINDOW_MAXIMIZE, () => {
  if (mainWindow && mainWindow.maximizable && !mainWindow.isMaximized()) {
    mainWindow.maximize();
  }
});
ipcMain.on(Constants.channels.WINDOW_UNMAXIMIZE, () => {
  if (mainWindow && mainWindow.isMaximized()) mainWindow.unmaximize();
});
app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function parseFiles(): MusicMetadataFile[] {
  return Array.from(currentFiles).map(([path, value]) => ({
    path,
    ...value,
  }));
}

function getTags(tags: Tags): MusicMetadata {
  return {
    title: tags.title ?? "",
    artist: tags.artist ?? "",
    album: tags.album ?? "",
    year: tags.year ?? "",
    genre: tags.genre ?? "",
    composer: tags.composer ?? "",
    comment: tags.comment ?? undefined,
    image: typeof tags.image === "string" ? undefined : tags.image ?? undefined,
    trackNumber: tags.trackNumber ?? "",
    performerInfo: tags.performerInfo ?? "",
  };
}

app.whenReady().then(createWindow);
