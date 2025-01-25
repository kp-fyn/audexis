import { ipcRenderer, contextBridge } from "electron";
import Constants from "./Constants";
import { Changes } from "./electron-env";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
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

  // You can expose other APTs you need here.
  // ...
});
contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send(Constants.channels.WINDOW_MINIMIZE),
  maximize: () => ipcRenderer.send(Constants.channels.WINDOW_MAXIMIZE),
  save: (changes: Partial<Changes>): void =>
    ipcRenderer.send(Constants.channels.SAVE, changes),
  onBlur(listener: () => void) {
    return ipcRenderer.on(Constants.channels.WINDOW_BLUR, listener);
  },
  onUpdate(listener: () => void) {
    return ipcRenderer.on(Constants.channels.UPDATE, listener);
  },

  unmaximize: () => ipcRenderer.send(Constants.channels.WINDOW_UNMAXIMIZE),
  close: () => ipcRenderer.send(Constants.channels.WINDOW_CLOSE),
  isMaximized: () => ipcRenderer.invoke(Constants.channels.WINDOW_IS_MAXIMIZED),
  setWindowPosition: (x: number, y: number) =>
    ipcRenderer.send(Constants.channels.SET_WINDOW_POSITION, { x, y }),
  getWindowPosition: () =>
    ipcRenderer.invoke(Constants.channels.GET_WINDOW_POSITION),
  openDialog: () => ipcRenderer.invoke(Constants.channels.OPEN_DIALOG),
});
