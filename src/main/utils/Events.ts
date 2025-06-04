import { ipcMain, dialog, BrowserWindow, shell } from "electron";

import Constants from "../../shared/Constants";
import {
  mainWindowId,
  createSettingsWindow,
  windows,
  createOnboardingWindow,
  workspace,
} from "../index";
import { Changes, WorkspaceAction } from "../../types";
import fs from "node:fs";
import mime from "mime";

import { Album, loadConfig, saveConfig, UserConfig } from "../db/config";

let cachedDb: UserConfig;
ipcMain.on(Constants.channels.WORKSPACE_ACTION, async (_event, conf: WorkspaceAction) => {
  switch (conf.action) {
    case "rename": {
      workspace.rename(conf);
      break;
    }
    case "move": {
      workspace.move(conf);
    }
  }
});
ipcMain.on(Constants.channels.UPDATE_CONFIG, async (_event, config) => {
  saveConfig(config, windows);
});

ipcMain.on(Constants.channels.TEST, async () => {
  cachedDb = await loadConfig();
  const base64 = cachedDb.albums[0].attachedPicture?.buffer;
  if (!base64) return;
  const buffer = Buffer.from(base64, "base64");
  fs.writeFileSync("test.jpg", buffer);
  windows.forEach(async (window) => {
    const win = BrowserWindow.fromId(window);
    if (win) {
      win.webContents.send(Constants.channels.USER_CONFIG_UPDATE, cachedDb);
    }
  });
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

ipcMain.on(Constants.channels.OPEN_DIALOG, async (): Promise<void> => {
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
ipcMain.on(
  Constants.channels.EDIT_ALBUM,
  async (_event, conf: { albumId: string; changes: Partial<Album> }) => {
    workspace.editAlbum(conf);
  }
);
ipcMain.on(Constants.channels.SAVE_ALBUM, async (_event, album: Partial<Album>) => {
  if (!album) return;
  if (!album.album) return;

  workspace.saveAlbum(album);
});
ipcMain.on(
  Constants.channels.ADD_TO_ALBUM,
  async (_event, conf: { albumId: string; filePath: string }) => {
    workspace.addToAlbum(conf);
  }
);
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
  workspace.sendUpdate();
});
ipcMain.on(
  Constants.channels.REMOVE_FROM_ALBUM,
  (_event, conf: { albumId: string; fileHash: string }) => {
    workspace.removeFromAlbum(conf);
  }
);
ipcMain.on(Constants.channels.DELETE_ALBUM, (_event, conf: { albumId: string }) => {
  workspace.deleteAlbum(conf);
});
ipcMain.on(
  Constants.channels.ADD_FOLDER_TO_ALBUM,
  (_event, conf: { albumId: string; folderPath: string }) => {
    workspace.addFolderToAlbum(conf);
  }
);
ipcMain.on(
  Constants.channels.REMOVE_FOLDER_FROM_ALBUM,
  (_event, conf: { albumId: string; folderPath: string }) => {
    workspace.removeFolderFromAlbum(conf);
  }
);

ipcMain.on(Constants.channels.SAVE, (_e, ch: Partial<Changes>) => {
  workspace.saveChanges(ch);
});
ipcMain.on(Constants.channels.SHOW_IN_FINDER, (_e, path): void => {
  shell.showItemInFolder(path);
});
