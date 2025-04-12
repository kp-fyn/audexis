import { electronAPI } from "@electron-toolkit/preload";
import { ipcRenderer, contextBridge } from "electron";
import Constants from "./Constants";

import { Changes } from "../types";
// Custom APIs for renderer
const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.

try {
  contextBridge.exposeInMainWorld("electron", electronAPI);
  contextBridge.exposeInMainWorld("api", api);

  contextBridge.exposeInMainWorld("ipcRenderer", {
    on(...args: Parameters<typeof ipcRenderer.on>) {
      const [channel, listener] = args;
      return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
      const [channel, ...omit] = args;
      return ipcRenderer.off(channel, ...omit);
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
      const [channel, ...omit] = args;
      return ipcRenderer.send(channel, ...omit);
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
      const [channel, ...omit] = args;
      return ipcRenderer.invoke(channel, ...omit);
    }
  });
  contextBridge.exposeInMainWorld("app", {
    minimize: () => ipcRenderer.send(Constants.channels.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.send(Constants.channels.WINDOW_MAXIMIZE),
    reloadFiles: () => ipcRenderer.send(Constants.channels.RELOAD_FILES),
    save: (changes: Partial<Changes>): void => {
      ipcRenderer.invoke(Constants.channels.SAVE, changes);
      return;
    },
    showInFinder: (path: string): void => {
      ipcRenderer.send(Constants.channels.SHOW_IN_FINDER, path);
    },
    onBlur(listener: () => void) {
      return ipcRenderer.on(Constants.channels.WINDOW_BLUR, listener);
    },
    onUpdate(listener: () => void) {
      return ipcRenderer.on(Constants.channels.UPDATE, listener);
    },
    onUndo(listener: () => void) {
      return ipcRenderer.on(Constants.channels.UNDO, listener);
    },
    offUndo(listener: () => void) {
      return ipcRenderer.off(Constants.channels.UNDO, listener);
    },
    offRedo(listener: () => void) {
      return ipcRenderer.off(Constants.channels.REDO, listener);
    },
    onRedo(listener: () => void) {
      return ipcRenderer.on(Constants.channels.REDO, listener);
    },
    onOpenDialog(listener: () => void) {
      return ipcRenderer.on(Constants.channels.OPEN_DIALOG, listener);
    },
    onSelectAll(listener: () => void) {
      return ipcRenderer.on(Constants.channels.SELECT_ALL, listener);
    },

    unmaximize: () => ipcRenderer.send(Constants.channels.WINDOW_UNMAXIMIZE),
    close: () => ipcRenderer.send(Constants.channels.WINDOW_CLOSE),
    isMaximized: () => ipcRenderer.invoke(Constants.channels.WINDOW_IS_MAXIMIZED),
    setWindowPosition: (x: number, y: number) =>
      ipcRenderer.send(Constants.channels.SET_WINDOW_POSITION, { x, y }),
    getWindowPosition: () => ipcRenderer.invoke(Constants.channels.GET_WINDOW_POSITION),
    openDialog: () => ipcRenderer.invoke(Constants.channels.OPEN_DIALOG),

    uploadImage: () => ipcRenderer.invoke(Constants.channels.IMAGE_UPLOAD)
  });
} catch (error) {
  console.error(error);
}
