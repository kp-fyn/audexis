/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

// Used in Renderer process, expose in `preload.ts`

export interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  close: () => void;
  save: (changes: Partial<Changes>) => void;
  isMaximized: () => Promise<boolean>;
  setWindowPosition: (x: number, y: number) => void;
  openDialog: () => Promise<MusicMetadataFile[]>;
  onBlur: (listener: () => void) => void;
  onUpdate: (
    listener: (_event: unknown, files: MusicMetadataFile[]) => void
  ) => void;
  onFocus: (listener: () => void) => void;
  getWindowPosition: () => Promise<{ x: number; y: number }>; // Add this
}

export interface MusicMetadata {
  image?: ImageBuffer | string;

  performerInfo: string;
  trackNumber: string;
  artist: string;
  year: string;
  album: string;
  composer: string;
  genre: string;
  comment: { language: string; text: string } | undefined;
  title: string;
}
export interface MusicMetadataFile extends MusicMetadata {
  path: string;
}

interface ImageBuffer {
  mime: string;
  type: { id: number; name?: string };
  description: string;
  imageBuffer: Buffer;
}
export interface Image extends ImageBuffer {
  image: string;
}
export interface Changes extends MusicMetadataFile {
  paths: string[];
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    ipcRenderer: import("electron").IpcRenderer;
  }
}
