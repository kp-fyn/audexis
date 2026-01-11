import Sidebar from "../components/Sidebar";
export interface UpdatedPath {
  newPath: string;
  oldPath: string;
}

export interface FileIdentifier {
  hash: string;
  path: string;
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

export type TagKey =
  | "title"
  | "artist"
  | "album"
  | "year"
  | "trackNumber"
  | "genre"
  | "albumArtist"
  | "contentGroup"
  | "composer"
  | "encodedBy"
  | "unsyncedLyrics"
  | "length"
  | "conductor"
  | "attachedPicture"
  | "userDefinedUrl"
  | "comments"
  | "private"
  | "relativeVolumeAdjustment"
  | "encryptionMethod"
  | "groupIdRegistration"
  | "generalObject"
  | "commercialUrl"
  | "copyrightUrl"
  | "audioFileUrl"
  | "artistUrl"
  | "radioStationUrl"
  | "paymentUrl"
  | "bitmapImageUrl"
  | "userDefinedText"
  | "synchronizedLyrics"
  | "tempoCodes"
  | "musicCdIdentifier"
  | "eventTimingCodes"
  | "sequence"
  | "playCount"
  | "audioSeekPointIndex"
  | "mediaType"
  | "commercialFrame"
  | "audioEncryption"
  | "signatureFrame"
  | "softwareEncoder"
  | "audioEncodingMethod"
  | "recommendedBufferSize"
  | "beatsPerMinute"
  | "language"
  | "fileType"
  | "time"
  | "recordingDate"
  | "releaseDate";

export interface StringTag {
  title: TagText;
  artist: TagText;
  album: TagText;
  year: TagText;
  trackNumber: TagText;
  genre: TagText;
  albumArtist: TagText;
  contentGroup: TagText;
  composer: TagText;
  encodedBy: TagText;
  unsyncedLyrics: TagText;
  length: TagText;
  conductor: TagText;
  userDefinedUrl: TagText;
  comments: TagText;
  private: TagText;
  relativeVolumeAdjustment: TagText;
  encryptionMethod: TagText;

  groupIdRegistration: TagText;
  generalObject: TagText;
  commercialUrl: TagText;
  copyrightUrl: TagText;
  audioFileUrl: TagText;
  artistUrl: TagText;
  radioStationUrl: TagText;
  paymentUrl: TagText;
  bitmapImageUrl: TagText;
  userDefinedText: TagText;
  synchronizedLyrics: TagText;
  tempoCodes: TagText;
  musicCdIdentifier: TagText;
  eventTimingCodes: TagText;
  sequence: TagText;
  playCount: TagText;
  audioSeekPointIndex: TagText;
  mediaType: TagText;
  commercialFrame: TagText;
  audioEncryption: TagText;
  signatureFrame: TagText;
  softwareEncoder: TagText;
  audioEncodingMethod: TagText;
  recommendedBufferSize: TagText;
  beatsPerMinute: TagText;
  fileType: TagText;
  recordingDate: TagText;
  releaseDate: TagText;
}

export interface UserConfig {
  columns: Column[];
  theme: "light" | "dark";
  albums: Album[];
  just_updated: boolean;
  onboarding: boolean;
  view: string;
  sidebar_items: SidebarItem[];
  density: "default" | "compact" | "comfort";
  show_diff_modal: boolean;
}
export interface SidebarItem {
  value: string;
  label: string;
  item_type: string;
}
export interface Column {
  value: string;
  label: string;
  size: number;
  kind: "Text" | "Image";
}

export interface Album {
  id: string;
  hashes: string[];
  album: string;
  copyright: string;
  year: string;
  genre: string;
  album_artist: string;
  folder: string;
  file_format_path: string;
  file_format_path_enabled: boolean;
  attached_picture: AttatchedPicture;
}

export interface AttatchedPicture {
  buffer: string;
  mime: string;
}

export interface AllTags extends StringTag {
  attachedPicture?: TagPicture;
}

export interface TagText {
  type: "Text";
  value: string;
}

export interface TagPicture {
  type: "Picture";
  value: {
    mime: string;
    data_base64: string;
    picture_type?: number;
    description?: string;
  };
}

export interface UserTextEntry {
  description: string;
  value: string;
}
export interface UserUrlEntry {
  description: string;
  url: string;
}

export type SerializableTagFrameValue =
  | TagText
  | TagPicture
  | { type: "UserText"; value: UserTextEntry }
  | { type: "UserUrl"; value: UserUrlEntry };

export interface SerializableTagFrame {
  key: string;
  values: SerializableTagFrameValue[];
}

export interface FrameChangesPayload {
  paths: string[];
  frames: SerializableTagFrame[];
}

export interface File {
  path: string;

  tag_format: string;
  tag_formats?: string[];
  frames: Frames;
}
export type Frames = {
  [key: string]: SerializableTagFrameValue[];
};
