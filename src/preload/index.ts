import { electronAPI } from "@electron-toolkit/preload";
import { ipcRenderer, contextBridge, webUtils } from "electron";
import Constants from "../shared/Constants";
import { Changes, UserConfig, WorkspaceAction, Tags } from "../types";

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
    //  File / Workspace
    workspaceAction: (wa: WorkspaceAction) =>
      ipcRenderer.send(Constants.channels.WORKSPACE_ACTION, wa),
    reloadFiles: () => ipcRenderer.send(Constants.channels.RELOAD_FILES),
    save: (changes: Partial<Changes>) => ipcRenderer.send(Constants.channels.SAVE, changes),
    showInFinder: (path: string) => ipcRenderer.send(Constants.channels.SHOW_IN_FINDER, path),
    uploadImage: () => ipcRenderer.invoke(Constants.channels.IMAGE_UPLOAD),
    saveAlbum: (changes: Partial<Tags>) => ipcRenderer.send(Constants.channels.SAVE_ALBUM, changes),
    addToAlbum: (conf: { albumId: string; filePath: string }) =>
      ipcRenderer.send(Constants.channels.ADD_TO_ALBUM, conf),
    removeFromAlbum: (conf: { albumId: string; fileHash: string }) =>
      ipcRenderer.send(Constants.channels.REMOVE_FROM_ALBUM, conf),
    deleteAlbum: (conf: { albumId: string }) =>
      ipcRenderer.send(Constants.channels.DELETE_ALBUM, conf),
    addFolderToAlbum: (conf: { albumId: string; folderPath: string }) =>
      ipcRenderer.send(Constants.channels.ADD_FOLDER_TO_ALBUM, conf),
    removeFolderFromAlbum: (conf: { albumId: string; folderPath: string }) =>
      ipcRenderer.send(Constants.channels.REMOVE_FOLDER_FROM_ALBUM, conf),
    editAlbum: (conf: { albumId: string; changes: Partial<Changes> }) =>
      ipcRenderer.send(Constants.channels.EDIT_ALBUM, conf),
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
    getFilePath: (file) => console.log(webUtils.getPathForFile(file)),
  });
} catch (error) {
  console.error(error);
}
