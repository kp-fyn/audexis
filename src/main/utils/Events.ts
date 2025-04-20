import { ipcMain, dialog, BrowserWindow, shell } from "electron";

import Constants from "./Constants";
import {
  mainWindowId,
  audioFiles,
  tagManager,
  createSettingsWindow,
  windows,
  createOnboardingWindow,
  workspace,
} from "../index";
import { Changes } from "../../types";
import fs from "node:fs";
import mime from "mime";

import { loadConfig, saveConfig, UserConfig } from "../db/config";
import { Low } from "lowdb/lib";
let cachedDb: Low<UserConfig>;

ipcMain.handle(Constants.channels.UPDATE_CONFIG, async (_event, config) => {
  saveConfig(config, windows);
});

ipcMain.handle(Constants.channels.TEST, async () => {
  if (!cachedDb) cachedDb = await loadConfig();

  windows.forEach(async (window) => {
    const win = BrowserWindow.fromId(window);
    if (win) {
      win.webContents.send(Constants.channels.USER_CONFIG_UPDATE, cachedDb.data);
    }
  });
});
ipcMain.on(Constants.channels.SET_WINDOW_POSITION, (_event, { x, y, windowName }) => {
  const windowId = windows.get(windowName);
  if (!windowId) return;
  const window = BrowserWindow.fromId(windowId);
  if (!window) return;
  window.setPosition(x, y);
});
ipcMain.on(Constants.channels.OPEN_SETTINGS, () => {
  createSettingsWindow();
});
ipcMain.on(Constants.channels.OPEN_ONBOARDING, () => {
  createOnboardingWindow();
});
ipcMain.on(Constants.channels.CLOSE_ONBOARDING, async () => {
  const windowId = windows.get("onboarding");
  if (!windowId) return;
  const window = BrowserWindow.fromId(windowId);

  await saveConfig({ onboarding: false }, windows);

  if (window) {
    windows.delete("onboarding");
    window.destroy();
  }
});

ipcMain.handle(
  Constants.channels.GET_WINDOW_POSITION,
  (_e, { windowName }): { x: number; y: number } => {
    const windowId = windows.get(windowName);
    if (!windowId) return { x: 0, y: 0 };
    const window = BrowserWindow.fromId(windowId);
    if (!window) return { x: 0, y: 0 };

    const [x, y] = window.getPosition();
    return { x, y };
  }
);

ipcMain.on(Constants.channels.WINDOW_MINIMIZE, (_e, { windowName }) => {
  const windowId = windows.get(windowName);
  if (!windowId) return;
  const window = BrowserWindow.fromId(windowId);
  if (window && window.isMinimizable()) {
    window.minimize();
  }
});
ipcMain.on(Constants.channels.WINDOW_MAXIMIZE, (_e, { windowName }) => {
  const windowId = windows.get(windowName);
  if (!windowId) return;
  const window = BrowserWindow.fromId(windowId);
  if (window && window.maximizable && !window.isMaximized()) {
    window.maximize();
  }
});
ipcMain.on(Constants.channels.WINDOW_UNMAXIMIZE, (_e, { windowName }) => {
  const windowId = windows.get(windowName);
  if (!windowId) return;
  const window = BrowserWindow.fromId(windowId);
  if (window && window.isMaximized()) window.unmaximize();
});
ipcMain.handle(Constants.channels.WINDOW_IS_MAXIMIZED, (_e, { windowName }): boolean => {
  const windowId = windows.get(windowName);
  if (!windowId) return false;
  const window = BrowserWindow.fromId(windowId);
  if (window) {
    return window.isMaximized();
  }
  return false;
});
ipcMain.handle(Constants.channels.OPEN_DIALOG, async (): Promise<void> => {
  const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);

  if (mainWindow) {
    const files = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "multiSelections", "openDirectory"],
      filters: [{ name: "Audio", extensions: ["mp3", "m4a", "mp4"] }],
    });
    if (files.canceled) return;

    files.filePaths.forEach((file) => workspace.import(file));

    return;
  }
  return;
});
ipcMain.handle(
  Constants.channels.IMAGE_UPLOAD,
  async (): Promise<null | { mime: string; buffer: Buffer }> => {
    const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);

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
  const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);

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
  const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);

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
  shell.showItemInFolder(path);
});
