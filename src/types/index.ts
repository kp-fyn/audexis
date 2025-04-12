export interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  reloadFiles: () => void;
  close: () => void;
  save: (changes: Partial<Changes>) => void;
  isMaximized: () => Promise<boolean>;
  setWindowPosition: (x: number, y: number) => void;
  openDialog: () => Promise<AudioFile[]>;
  onBlur: (listener: () => void) => void;
  onUpdate: (listener: (_event: unknown, files: AudioFile[]) => void) => void;
  onOpenDialog: (listener: () => void) => void;
  onFocus: (listener: () => void) => void;
  getWindowPosition: () => Promise<{ x: number; y: number }>;
  uploadImage: () => Promise<UploadedImage>;
  onUndo: (listener: () => void) => void;
  onRedo: (listener: () => void) => void;
  offUndo: (listener: () => void) => void;
  offRedo: (listener: () => void) => void;
  onSelectAll: (listener: () => void) => void;
  showInFinder(path: string): void;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
export interface UploadedImage {
  mime: string;
  type?: { id: number; name?: string };
  description?: string;
  buffer: Buffer;
}
export interface ImgData {
  mime: string;
  type?: { id: number; name?: string };
  description?: string;
  buffer: Buffer;
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
