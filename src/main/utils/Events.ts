import { ipcMain, dialog, BrowserWindow, shell } from "electron";

import Constants from "./Constants";
import { mainWindowId, audioFiles, tagManager } from "../index";
import { Changes } from "../../types";
import fs from "node:fs";
import mime from "mime";
import handleFiles from "./FileUpload";

export function handleEvents(): void {
  const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);
  ipcMain.on(Constants.channels.SET_WINDOW_POSITION, (_event, { x, y }) => {
    if (mainWindow) mainWindow.setPosition(x, y);
  });

  ipcMain.handle(Constants.channels.GET_WINDOW_POSITION, (): { x: number; y: number } => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      return { x, y };
    }
    return { x: 0, y: 0 };
  });

  ipcMain.on(Constants.channels.WINDOW_MINIMIZE, () => {
    if (!wndowReady()) return;
    if (mainWindow) mainWindow.minimize();
  });
  ipcMain.on(Constants.channels.WINDOW_MAXIMIZE, () => {
    if (!wndowReady()) return;
    if (mainWindow && mainWindow.maximizable && !mainWindow.isMaximized()) {
      mainWindow.maximize();
    }
  });
  ipcMain.on(Constants.channels.WINDOW_UNMAXIMIZE, () => {
    if (!wndowReady()) return;
    if (mainWindow && mainWindow.isMaximized()) mainWindow.unmaximize();
  });
  ipcMain.handle(Constants.channels.WINDOW_IS_MAXIMIZED, (): boolean => {
    if (mainWindow) {
      return mainWindow.isMaximized();
    }
    return false;
  });
  ipcMain.handle(Constants.channels.OPEN_DIALOG, async (): Promise<Array<void>> => {
    if (!wndowReady()) return [];
    if (mainWindow) {
      const files = await dialog.showOpenDialog(mainWindow, {
        properties: ["openFile", "multiSelections", "openDirectory"],
        filters: [{ name: "Audio", extensions: ["mp3", "m4a", "mp4"] }],
      });
      if (files.canceled) return [];

      handleFiles(files.filePaths);
      return [];
    }
    return [];
  });
  ipcMain.handle(
    Constants.channels.IMAGE_UPLOAD,
    async (): Promise<null | { mime: string; buffer: Buffer }> => {
      if (!wndowReady()) return null;
      if (mainWindow) {
        const files = await dialog.showOpenDialog(mainWindow, {
          properties: ["openFile"],
          filters: [{ name: "Image Files", extensions: ["jpg", "png"] }],
        });
        if (files.canceled) return null;
        if (files.filePaths.length > 0) {
          const parsedFiles = files.filePaths.filter(
            (file) =>
              file.toLowerCase().endsWith(".png") ||
              file.toLocaleLowerCase().endsWith(".jpg") ||
              file.toLocaleLowerCase().endsWith(".jpeg")
          );
          if (parsedFiles.length === 0) return null;
          const file = parsedFiles[0];
          const buffer = fs.readFileSync(file);
          if (!buffer) return null;
          const mimeType = mime.getType(file);
          if (!mimeType) return null;
          if (!mimeType.startsWith("image/")) return null;
          console.log({ buffer, mimeType });
          return {
            mime: mimeType,
            buffer,
          };
        } else {
          return null;
        }
      }
      return null;
    }
  );
  ipcMain.on(Constants.channels.RELOAD_FILES, () => {
    if (!wndowReady()) return;
    audioFiles.forEach((file) => {
      const release = tagManager.detectTagFormat(file.path);
      if (!release) return;
      const releaseClass = tagManager.getReleaseClass(release);
      if (!releaseClass) return;
      const tags = releaseClass.getTags(file.path);
      if (!tags) return;
      audioFiles.set(file.path, { ...tags, release, path: file.path });
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const toArray = [...audioFiles].map(([_fp, value]) => ({
      ...value,
    }));
    mainWindow?.webContents.send(Constants.channels.UPDATE, toArray);
  });
  ipcMain.handle(Constants.channels.SAVE, (_e, ch: Partial<Changes>) => {
    if (!ch.paths) return;
    if (ch.paths.length === 0) return;
    ch.paths.forEach((path) => {
      const file = audioFiles.get(path);
      if (!file) return;
      const release = tagManager.getReleaseClass(file.release);
      if (!release) return;
      release.writeTags(ch, path);
      audioFiles.set(path, { ...file, ...ch });
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const toArray = [...audioFiles].map(([_n, value]) => ({
      ...value,
    }));

    mainWindow?.webContents.send(Constants.channels.UPDATE, toArray);
  });
  ipcMain.on(Constants.channels.SHOW_IN_FINDER, (_e, path): void => {
    if (!wndowReady()) return;
    if (mainWindow) {
      shell.showItemInFolder(path);
    }
  });
}

function wndowReady(): boolean {
  const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  return true;
}
