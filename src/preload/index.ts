import { electronAPI } from "@electron-toolkit/preload";
import { ipcRenderer, contextBridge } from "electron";
import Constants from "./Constants";
import { Changes, Base, SetWindowPosition, UserConfig, WorkspaceAction } from "../types";

const registeredListeners: Record<string, () => void> = {};

function setIpcListener(channel: string, listener: (...args: unknown[]) => void): void {
  if (registeredListeners[channel]) {
    ipcRenderer.removeListener(channel, registeredListeners[channel]);
  }
  registeredListeners[channel] = listener;
  ipcRenderer.on(channel, listener);
}

function removeIpcListener(channel: string): void {
  if (registeredListeners[channel]) {
    ipcRenderer.removeListener(channel, registeredListeners[channel]);
    delete registeredListeners[channel];
  }
}

try {
  contextBridge.exposeInMainWorld("electron", electronAPI);

  contextBridge.exposeInMainWorld("ipcRenderer", {
    on(...args: Parameters<typeof ipcRenderer.on>) {
      const [channel, listener] = args;
      return ipcRenderer.on(channel, (event, ...rest) => listener(event, ...rest));
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
      const [channel, ...rest] = args;
      return ipcRenderer.off(channel, ...rest);
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
      return ipcRenderer.send(...args);
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
      return ipcRenderer.invoke(...args);
    },
  });

  contextBridge.exposeInMainWorld("app", {
    //  Window Controls
    minimize: (props: Base) => ipcRenderer.send(Constants.channels.WINDOW_MINIMIZE, props),
    maximize: (props: Base) => ipcRenderer.send(Constants.channels.WINDOW_MAXIMIZE, props),
    unmaximize: (props: Base) => ipcRenderer.send(Constants.channels.WINDOW_UNMAXIMIZE, props),
    close: (props: Base) => ipcRenderer.send(Constants.channels.WINDOW_CLOSE, props),
    isMaximized: (props: Base) => ipcRenderer.invoke(Constants.channels.WINDOW_IS_MAXIMIZED, props),
    setWindowPosition: (pos: SetWindowPosition) =>
      ipcRenderer.send(Constants.channels.SET_WINDOW_POSITION, pos),
    getWindowPosition: (props: Base) =>
      ipcRenderer.invoke(Constants.channels.GET_WINDOW_POSITION, props),

    //  File / Workspace
    workspaceAction: (wa: WorkspaceAction) =>
      ipcRenderer.send(Constants.channels.WORKSPACE_ACTION, wa),
    reloadFiles: () => ipcRenderer.send(Constants.channels.RELOAD_FILES),
    save: (changes: Partial<Changes>) => ipcRenderer.send(Constants.channels.SAVE, changes),
    showInFinder: (path: string) => ipcRenderer.send(Constants.channels.SHOW_IN_FINDER, path),
    uploadImage: () => ipcRenderer.invoke(Constants.channels.IMAGE_UPLOAD),

    //  Configuration
    updateConfig: (config: Partial<UserConfig>) =>
      ipcRenderer.send(Constants.channels.UPDATE_CONFIG, config),

    //  Settings / Onboarding
    openSettings: () => ipcRenderer.send(Constants.channels.OPEN_SETTINGS),
    openOnboarding: () => ipcRenderer.send(Constants.channels.OPEN_ONBOARDING),
    closeOnboarding: () => ipcRenderer.send(Constants.channels.CLOSE_ONBOARDING),
    openDialog: () => ipcRenderer.send(Constants.channels.OPEN_DIALOG),

    //  Test
    test: () => ipcRenderer.send(Constants.channels.TEST),

    //   Event Listeners (one per channel)
    // Todoactually add the off functions to useEffect
    onBlur: (listener: () => void) => setIpcListener(Constants.channels.WINDOW_BLUR, listener),
    offBlur: () => removeIpcListener(Constants.channels.WINDOW_BLUR),

    onUpdate: (listener: () => void) => setIpcListener(Constants.channels.UPDATE, listener),
    offUpdate: () => removeIpcListener(Constants.channels.UPDATE),

    onUserConfigUpdate: (listener: () => void) =>
      setIpcListener(Constants.channels.USER_CONFIG_UPDATE, listener),
    offUserConfigUpdate: () => removeIpcListener(Constants.channels.USER_CONFIG_UPDATE),

    onUndo: (listener: () => void) => setIpcListener(Constants.channels.UNDO, listener),
    offUndo: () => removeIpcListener(Constants.channels.UNDO),

    onRedo: (listener: () => void) => setIpcListener(Constants.channels.REDO, listener),
    offRedo: () => removeIpcListener(Constants.channels.REDO),

    onOpenDialog: (listener: () => void) =>
      setIpcListener(Constants.channels.OPEN_DIALOG, listener),
    offOpenDialog: () => removeIpcListener(Constants.channels.OPEN_DIALOG),

    onSelectAll: (listener: () => void) => setIpcListener(Constants.channels.SELECT_ALL, listener),
    offSelectAll: () => removeIpcListener(Constants.channels.SELECT_ALL),
  });
} catch (error) {
  console.error(error);
}
