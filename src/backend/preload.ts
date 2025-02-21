import { ipcRenderer, contextBridge } from "electron";
import Constants from "@/backend/utils/Constants";

import { Changes } from "@/types/index";

contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
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
  minimize: () => ipcRenderer.send(Constants.channels.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(Constants.channels.WINDOW_MAXIMIZE),
  reloadFiles: () => ipcRenderer.send(Constants.channels.RELOAD_FILES),
  save: (changes: Partial<Changes>): void => {
    ipcRenderer.invoke(Constants.channels.SAVE, changes);
    return;
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
  onRedo(listener: () => void) {
    return ipcRenderer.on(Constants.channels.REDO, listener);
  },
  onOpenDialog(listener: () => void) {
    return ipcRenderer.on(Constants.channels.OPEN_DIALOG, listener);
  },

  unmaximize: () => ipcRenderer.send(Constants.channels.WINDOW_UNMAXIMIZE),
  close: () => ipcRenderer.send(Constants.channels.WINDOW_CLOSE),
  isMaximized: () => ipcRenderer.invoke(Constants.channels.WINDOW_IS_MAXIMIZED),
  setWindowPosition: (x: number, y: number) =>
    ipcRenderer.send(Constants.channels.SET_WINDOW_POSITION, { x, y }),
  getWindowPosition: () =>
    ipcRenderer.invoke(Constants.channels.GET_WINDOW_POSITION),
  openDialog: () => ipcRenderer.invoke(Constants.channels.OPEN_DIALOG),

  uploadImage: () => ipcRenderer.invoke(Constants.channels.IMAGE_UPLOAD),
});
