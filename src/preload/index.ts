import { electronAPI } from "@electron-toolkit/preload";
import { ipcRenderer, contextBridge } from "electron";
import Constants from "./Constants";

import { Changes, Base, SetWindowPosition, UserConfig, WorkspaceAction } from "../types";
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
    },
  });
  contextBridge.exposeInMainWorld("app", {
    minimize: (props: Base) => ipcRenderer.send(Constants.channels.WINDOW_MINIMIZE, props),
    maximize: (props: Base) => ipcRenderer.send(Constants.channels.WINDOW_MAXIMIZE, props),
    workspaceAction: (workspaceAction: WorkspaceAction) =>
      ipcRenderer.send(Constants.channels.WORKSPACE_ACTION, workspaceAction),
    reloadFiles: () => ipcRenderer.send(Constants.channels.RELOAD_FILES),
    save: (changes: Partial<Changes>): void => {
      ipcRenderer.invoke(Constants.channels.SAVE, changes);
      return;
    },
    updateConfig: (config: Partial<UserConfig>): void => {
      ipcRenderer.invoke(Constants.channels.UPDATE_CONFIG, config);
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
    onUserConfigUpdate(listener: () => void) {
      return ipcRenderer.on(Constants.channels.USER_CONFIG_UPDATE, listener);
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
    openSettings: () => ipcRenderer.send(Constants.channels.OPEN_SETTINGS),
    openOnboarding: () => ipcRenderer.send(Constants.channels.OPEN_ONBOARDING),
    closeOnboarding: () => ipcRenderer.send(Constants.channels.CLOSE_ONBOARDING),
    test: () => ipcRenderer.invoke(Constants.channels.TEST),

    unmaximize: (props: Base) => ipcRenderer.send(Constants.channels.WINDOW_UNMAXIMIZE, props),
    close: (props: Base) => ipcRenderer.send(Constants.channels.WINDOW_CLOSE, props),
    isMaximized: (props: Base) => ipcRenderer.invoke(Constants.channels.WINDOW_IS_MAXIMIZED, props),
    setWindowPosition: ({ x, y, windowName }: SetWindowPosition) =>
      ipcRenderer.send(Constants.channels.SET_WINDOW_POSITION, { x, y, windowName }),
    getWindowPosition: (props: Base) =>
      ipcRenderer.invoke(Constants.channels.GET_WINDOW_POSITION, props),
    openDialog: () => ipcRenderer.invoke(Constants.channels.OPEN_DIALOG),

    uploadImage: () => ipcRenderer.invoke(Constants.channels.IMAGE_UPLOAD),
  });
} catch (error) {
  console.error(error);
}
