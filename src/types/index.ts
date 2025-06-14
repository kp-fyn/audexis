import { UserConfig as UCon, Album as Alb } from "../main/db/config";
import path from "path-browserify";

export interface UserConfig extends UCon {
  __typename?: "UserConfig";
}
export interface UpdatedPath {
  newPath: string;
  oldPath: string;
}
export interface FileIdentifier {
  hash: string;
  path: string;
}
export interface Album extends Alb {
  attachedPicture: ImgData | null;
}
export interface Watcher {
  unsubscribe: () => Promise<void>;
  isFile: boolean;
}
export interface TagOption {
  label: string;
  value: string;
}
export interface WorkspaceAction {
  action: "rename" | "new-directory" | "move";
  str: string;
  path: string;
}
export interface Extended extends AudioFile {
  hash: string;
}

export interface ElectronAPI {
  reloadFiles: () => void;
  close: (props: Base) => void;
  save: (changes: Partial<Changes>) => void;
  test: () => Promise<void>;
  workspaceAction: (action: WorkspaceAction) => void;
  getFilePath: (file: any) => string;
  setWindowPosition: ({ x, y, windowName }: SetWindowPosition) => void;
  openDialog: () => Promise<AudioFile[]>;
  onBlur: (listener: () => void) => void;
  onUserConfigUpdate: (listener: (_event: unknown, updatedConfig: UserConfig) => void) => void;
  onUpdate: (
    listener: (_event: unknown, fileTree: RootFileTree, updatedFiles?: UpdatedPath[]) => void
  ) => void;
  onOpenDialog: (listener: () => void) => void;
  onFocus: (listener: () => void) => void;
  getWindowPosition: (props: Base) => Promise<{ x: number; y: number }>;
  uploadImage: () => Promise<UploadedImage>;
  onUndo: (listener: () => void) => void;
  onRedo: (listener: () => void) => void;
  offUndo: (listener: () => void) => void;
  offRedo: (listener: () => void) => void;
  saveAlbum: (changes: Partial<Tags>) => void;
  editAlbum: ({ albumId, changes }: { albumId: string; changes: Partial<Changes> }) => void;
  removeFromAlbum: (conf: { albumId: string; fileHash: string }) => void;
  deleteAlbum: (conf: { albumId: string }) => void;
  addFolderToAlbum: (conf: { albumId: string; folderPath: string }) => void;
  removeFolderFromAlbum: (conf: { albumId: string; folderPath: string }) => void;
  showInFinder(path: string): void;
  openSettings(): void;
  openOnboarding(): void;
  updateConfig(config: Partial<UserConfig>): void;
  addToAlbum(conf: { albumId: string; filePath: string }): void;
  closeOnboarding(): void;
}
export interface SetWindowPosition extends Base {
  x: number;
  y: number;
  windowName: string;
}
export interface Base {
  windowName: string;
}
export interface FullImage extends UploadedImage {
  url: string;
}

export interface Changes extends Tags {
  paths: string[];
}

declare global {
  interface Window {
    app: ElectronAPI;
  }
}
export interface AudioFile extends Tags {
  path: string;
  release: string;
  fileName: string;
  parentPath?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
export interface UploadedImage {
  mime: string;
  type?: { id: number; name?: string };
  description?: string;
  buffer: Buffer;
}
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: Map<string, FileNode>;
  audioFile?: AudioFile;
  hash?: string;
}
export interface RootFileTree {
  organized: Map<string, FileNode>;
  disorgainzed: Map<string, FileNode>;
}
export interface ImgData {
  mime: string;
  type?: { id: number; name?: string };
  description?: string;
  buffer: Buffer;
  url?: string;
}
export type Frames = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};
export interface Tags {
  corrupted: boolean;
  title: string; // TIT2
  artist: string; // TPE1
  album: string; // TALB
  year: string; // TYER
  trackNumber: string; // TRCK
  genre: string; // TCON
  albumArtist: string; // TPE2
  contentGroup: string; // TIT1
  composer: string; // TCOM
  encodedBy: string; // TENC
  unsyncedLyrics: string; // USLT
  length: string; // TLEN
  conductor: string; // TPE3
  attachedPicture: ImgData | null; // APIC
  userDefinedURL: string; // WXXX
  comments: string; // COMM
  private: string; // PRIV
  relativeVolumeAdjustment: string; // RVA2
  encryptionMethod: string; // ENCR
  groupIdRegistration: string; // GRID
  generalObject: string; // GEOB
  commercialURL: string; // WCOM
  copyrightURL: string; // WCOP
  audioFileURL: string; // WOAF
  artistURL: string; // WOAR
  radioStationURL: string; // WORS
  paymentURL: string; // WPAY
  bitmapImageURL: string; // WBMP
  userDefinedText: string; // TXXX
  synchronizedLyrics: string; // SYLT
  tempoCodes: string; // SYTC
  copyright: string; // TCOP
  musicCDIdentifier: string; // MCDI
  eventTimingCodes: string; // ETCO
  sequence: string; // SEQU
  playCount: string; // PCNT
  audioSeekPointIndex: string; // ASPI
  mediaType: string; // STIK
  commercialFrame: string; // COMR
  audioEncryption: string; // AENC
  signatureFrame: string; // SIGN
  softwareEncoder: string; // TSSE
  audioEncodingMethod: string; // CART
  recommendedBufferSize: string; // RBUF
  beatsPerMinute: string; // TBPM
  language: string; // TLAN
  fileType: string; // TFLT
  time: string; // TIME
  recordingDate: string; // TDRC
  releaseDate: string; // TDOR
}
