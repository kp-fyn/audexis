import { ipcMain, dialog } from "electron";

import Constants from "@/backend/utils/Constants";
import { mainWindow, audioFiles, tagManager } from "@/backend/main";
import { Changes } from "@/types";
import fs from "node:fs";
import mime from "mime";
export function handleEvents() {
  ipcMain.on(Constants.channels.SET_WINDOW_POSITION, (_event, { x, y }) => {
    if (mainWindow) mainWindow.setPosition(x, y);
  });

  ipcMain.handle(Constants.channels.GET_WINDOW_POSITION, () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      return { x, y };
    }
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
  ipcMain.handle(Constants.channels.WINDOW_IS_MAXIMIZED, () => {
    if (mainWindow) {
      return mainWindow.isMaximized();
    }
  });
  ipcMain.handle(Constants.channels.OPEN_DIALOG, async () => {
    console.log("e");
    if (!wndowReady()) return null;
    if (mainWindow) {
      const files = await dialog.showOpenDialog(mainWindow, {
        properties: ["openFile", "multiSelections"],
        filters: [{ name: "MP3 Audio", extensions: ["mp3"] }],
      });
      if (files.canceled) return null;
      if (files.filePaths.length > 0) {
        const parsedFiles = files.filePaths.filter((file) =>
          file.endsWith(".mp3")
        );
        parsedFiles.forEach((file) => {
          const release = tagManager.detectTagFormat(file);
          if (!release) return;
          const releaseClass = tagManager.getReleaseClass(release);
          if (!releaseClass) return;
          const tags = releaseClass.getTags(file);
          if (!tags) return;
          audioFiles.set(file, { ...tags, release, path: file });
        });
        const toArray = [...audioFiles].map(([_n, value]) => ({
          ...value,
        }));

        mainWindow?.webContents.send(Constants.channels.UPDATE, toArray);

        return [];
      } else {
        return [];
      }
    }
  });
  ipcMain.handle(Constants.channels.IMAGE_UPLOAD, async () => {
    if (!wndowReady()) return;
    if (mainWindow) {
      const files = await dialog.showOpenDialog(mainWindow, {
        properties: ["openFile"],
        filters: [{ name: "Image Files", extensions: ["jpg", "png"] }],
      });
      if (files.canceled) return [];
      if (files.filePaths.length > 0) {
        const parsedFiles = files.filePaths.filter(
          (file) =>
            file.toLowerCase().endsWith(".png") ||
            file.toLocaleLowerCase().endsWith(".jpg")
        );
        if (parsedFiles.length === 0) return null;
        const file = parsedFiles[0];
        const buffer = fs.readFileSync(file);
        if (!buffer) return null;
        const mimeType = mime.getType(file);
        console.log({ mimeType });
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
  });
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
    const toArray = [...audioFiles].map(([_fp, value]) => ({
      ...value,
    }));
    mainWindow?.webContents.send(Constants.channels.UPDATE, toArray);
  });
  ipcMain.handle(Constants.channels.SAVE, (_e, ch: Partial<Changes>) => {
    if (!ch.paths) return;
    console.log(ch);
    if (ch.paths.length === 0) return;
    ch.paths.forEach((path) => {
      const file = audioFiles.get(path);
      if (!file) return;
      const release = tagManager.getReleaseClass(file.release);
      if (!release) return;
      release.writeTags(ch, path);
      audioFiles.set(path, { ...file, ...ch });
    });
    const toArray = [...audioFiles].map(([_n, value]) => ({
      ...value,
    }));

    mainWindow?.webContents.send(Constants.channels.UPDATE, toArray);
  });
}

function wndowReady(): boolean {
  if (!mainWindow || mainWindow.isDestroyed()) return false;
  return true;
}
