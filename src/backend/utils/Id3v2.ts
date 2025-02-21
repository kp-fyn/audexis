import { Frames } from "@/types";

export const id3v22Tags: Record<string, string | null> = {
  TT2: "", // Title
  TP1: "", // Artist
  TAL: "", // Album
  TYE: "", // Year
  TRK: "", // Track Number
  TCO: "", // Genre
  TP2: "", // Band/Orchestra/Accompaniment (Closest match in ID3v2.2)
  TT1: "", // Content group description
  TCM: "", // Composer
  TEN: "", // Encoded by
  ULT: "", // Unsynchronized lyrics
  TLE: "", // Length (in milliseconds)
  TP3: "", // Conductor
  PIC: null, // Attached picture
  WXX: "", // User-defined URL link
  COM: "", // Comments
  PRV: "", // Private frame (not standard in v2.2, using PRV as placeholder)
  RVA: "", // Relative volume adjustment (Closest match)
  ENC: "", // Encryption method
  GRI: "", // Group identification registration (Approximate)
  GEO: "", // General encapsulated object
  WCM: "", // Commercial URL
  WCP: "", // Copyright URL
  WAF: "", // Official audio file URL
  WAR: "", // Official artist/performer URL
  WRS: "", // Official radio station URL
  WPY: "", // Payment URL
  WBM: "", // Bitmap image URL (not standard, keeping placeholder)
  TXX: "", // User-defined text information
  SLT: "", // Synchronized lyrics
  STC: "", // Synchronized tempo codes
  MCI: "", // Music CD Identifier
  ETC: "", // Event timing codes
  CNT: "", // Play count
  ASP: "", // Audio seek point index (not standard, placeholder)
  COMR: "", // Commercial frame (Not officially in v2.2, using same as v2.3)
  AEN: "", // Audio encryption
  SIG: "", // Signature frame
  TSS: "", // Software/Encoder
  CAR: "", // Audio encoding method
  RBF: "", // Recommended buffer size
  TBP: "", // Beats per minute
  TLA: "", // Language
  TFT: "", // File type
  TIM: "", // Time
  TDR: "", // Recording date (No exact equivalent, closest match)
  TDO: "", // Original release date (No exact equivalent, closest match)
};
const id3v22Mapping: Frames = {
  title: "TT2",
  artist: "TP1",
  album: "TAL",
  year: "TYE",
  trackNumber: "TRK",
  genre: "TCO",
  albumArtist: "TP2",
  contentGroup: "TT1",
  composer: "TCM",
  encodedBy: "TEN",
  unsyncedLyrics: "ULT",
  length: "TLE",
  conductor: "TP3",
  attachedPicture: "PIC",
  userDefinedURL: "WXX",
  comments: "COM",
  private: "PRV",
  relativeVolumeAdjustment: "RVA",
  encryptionMethod: "ENC",
  groupIdRegistration: "GRI",
  generalObject: "GEO",
  commercialURL: "WCM",
  copyrightURL: "WCP",
  audioFileURL: "WAF",
  artistURL: "WAR",
  radioStationURL: "WRS",
  paymentURL: "WPY",
  bitmapImageURL: "WBM",
  userDefinedText: "TXX",
  synchronizedLyrics: "SLT",
  tempoCodes: "STC",
  musicCDIdentifier: "MCI",
  eventTimingCodes: "ETC",
  playCount: "CNT",
  audioSeekPointIndex: "ASP",
  commercialFrame: "COMR",
  audioEncryption: "AEN",
  signatureFrame: "SIG",
  softwareEncoder: "TSS",
  audioEncodingMethod: "CAR",
  recommendedBufferSize: "RBF",
  beatsPerMinute: "TBP",
  language: "TLA",
  fileType: "TFT",
  time: "TIM",
  recordingDate: "TDR",
  releaseDate: "TDO",
};

export const id3v23Mapping: Record<string, string> = {
  title: "TIT2",
  artist: "TPE1",
  album: "TALB",
  year: "TYER",
  trackNumber: "TRCK",
  genre: "TCON",
  albumArtist: "TPE2",
  contentGroup: "TIT1",
  composer: "TCOM",
  encodedBy: "TENC",
  unsyncedLyrics: "USLT",
  length: "TLEN",
  conductor: "TPE3",
  attachedPicture: "APIC",
  userDefinedURL: "WXXX",
  comments: "COMM",
  private: "PRIV",
  relativeVolumeAdjustment: "RVA2",
  encryptionMethod: "ENCR",
  groupIdRegistration: "GRID",
  generalObject: "GEOB",
  commercialURL: "WCOM",
  copyrightURL: "WCOP",
  audioFileURL: "WOAF",
  artistURL: "WOAR",
  radioStationURL: "WORS",
  paymentURL: "WPAY",
  bitmapImageURL: "WBMP",
  userDefinedText: "TXXX",
  synchronizedLyrics: "SYLT",
  tempoCodes: "SYTC",
  musicCDIdentifier: "MCDI",
  eventTimingCodes: "ETCO",
  sequence: "SEQU",
  playCount: "PCNT",
  audioSeekPointIndex: "ASPI",
  mediaType: "STIK",
  commercialFrame: "COMR",
  audioEncryption: "AENC",
  signatureFrame: "SIGN",
  softwareEncoder: "TSSE",
  audioEncodingMethod: "CART",
  recommendedBufferSize: "RBUF",
  beatsPerMinute: "TBPM",
  language: "TLAN",
  fileType: "TFLT",
  time: "TIME",
  recordingDate: "TDRC",
  releaseDate: "TDOR",
};
export const id3v23Tags: Frames = {
  TIT2: "", // Title
  TPE1: "", // Artist
  TALB: "", // Album
  TYER: "", // Year
  TRCK: "", // Track Number
  TCON: "", // Genre
  TPE2: "", // Band/Orchestra/Accompaniment
  TIT1: "", // Content group description
  TCOM: "", // Composer
  TENC: "", // Encoded by
  USLT: "", // Unsynchronized lyrics
  TLEN: "", // Length (in milliseconds)
  TPE3: "", // Conductor
  APIC: null, // Attached picture
  WXXX: "", // User-defined URL link
  COMM: "", // Comments
  PRIV: "", // Private frame
  RVA2: "", // Relative volume adjustment
  ENCR: "", // Encryption method
  GRID: "", // Group identification registration
  GEOB: "", // General encapsulated object
  WCOM: "", // Commercial URL
  WCOP: "", // Copyright URL
  WOAF: "", // Official audio file URL
  WOAR: "", // Official artist/performer URL
  WORS: "", // Official radio station URL
  WPAY: "", // Payment URL
  WBMP: "", // Bitmap image URL
  TXXX: "", // User-defined text information
  SYLT: "", // Synchronized lyrics
  SYTC: "", // Synchronized tempo codes
  MCDI: "", // Music CD Identifier
  ETCO: "", // Event timing codes
  SEQU: "", // Sequence (Track number of set)
  PCNT: "", // Play count
  ASPI: "", // Audio seek point index
  STIK: "", // Media type (Spotify)
  COMR: "", // Commercial frame
  AENC: "", // Audio encryption
  SIGN: "", // Signature frame
  TSSE: "", // Software/Encoder
  CART: "", // Audio encoding method
  RBUF: "", // Recommended buffer size
  TBPM: "", // Beats per minute
  TLAN: "", // Language
  TFLT: "", // File type
  TIME: "", // Time
  TSOT: "", // Set to track (non-existant in 2.3 but sometimes used)
  TDRC: "", // Recording date
  TDOR: "", // Original release date
};

export const id3v24Tags: Frames = {
  TIT2: "", // Title
  TPE1: "", // Artist
  TALB: "", // Album
  TDRC: "", // Recording Date (replaces TYER, TIME, TDAT)
  TDOR: "", // Original Release Date (new in 2.4)
  TDRL: "", // Release Date (new in 2.4)
  TRCK: "", // Track Number
  TCON: "", // Genre
  TPE2: "", // Band/Orchestra/Accompaniment (Album Artist)
  TIT1: "", // Content group description
  TCOM: "", // Composer
  TENC: "", // Encoded by
  USLT: "", // Unsynchronized lyrics
  TLEN: "", // Length (in milliseconds)
  TPE3: "", // Conductor
  APIC: null, // Attached picture
  WXXX: "", // User-defined URL link
  COMM: "", // Comments
  PRIV: "", // Private frame
  RVA2: "", // Relative volume adjustment
  ENCR: "", // Encryption method
  GRID: "", // Group identification registration
  GEOB: "", // General encapsulated object
  WCOM: "", // Commercial URL
  WCOP: "", // Copyright URL
  WOAF: "", // Official audio file URL
  WOAR: "", // Official artist/performer URL
  WORS: "", // Official radio station URL
  WPAY: "", // Payment URL
  WBMP: "", // Bitmap image URL
  TXXX: "", // User-defined text information
  SYLT: "", // Synchronized lyrics
  SYTC: "", // Synchronized tempo codes
  MCDI: "", // Music CD Identifier
  ETCO: "", // Event timing codes
  SEQU: "", // Sequence (Track number of set)
  PCNT: "", // Play count
  ASPI: "", // Audio seek point index
  STIK: "", // Media type (Spotify)
  COMR: "", // Commercial frame
  AENC: "", // Audio encryption
  SIGN: "", // Signature frame
  TSSE: "", // Software/Encoder
  CART: "", // Audio encoding method
  RBUF: "", // Recommended buffer size
  TBPM: "", // Beats per minute
  TLAN: "", // Language
  TFLT: "", // File type
  EQU2: "", // Equalization (replaces EQUA)
  TIPL: "", // Involved people list (replaces IPLS)
  TMCL: "", // Musician credits list (new in 2.4)
  TSOT: "", // Title Sort Order (new in 2.4)
  TSOA: "", // Album Sort Order (new in 2.4)
  TSOP: "", // Performer Sort Order (new in 2.4)
};

const id3v24Mapping: Record<string, string> = {
  title: "TIT2",
  artist: "TPE1",
  album: "TALB",
  year: "TDRC", // Changed from TYER
  trackNumber: "TRCK",
  genre: "TCON",
  albumArtist: "TPE2",
  contentGroup: "TIT1",
  composer: "TCOM",
  encodedBy: "TENC",
  unsyncedLyrics: "USLT",
  length: "TLEN",
  conductor: "TPE3",
  attachedPicture: "APIC",
  userDefinedURL: "WXXX",
  comments: "COMM",
  private: "PRIV",
  relativeVolumeAdjustment: "RVA2",
  encryptionMethod: "ENCR",
  groupIdRegistration: "GRID",
  generalObject: "GEOB",
  commercialURL: "WCOM",
  copyrightURL: "WCOP",
  audioFileURL: "WOAF",
  artistURL: "WOAR",
  radioStationURL: "WORS",
  paymentURL: "WPAY",
  bitmapImageURL: "WBMP",
  userDefinedText: "TXXX",
  synchronizedLyrics: "SYLT",
  tempoCodes: "SYTC",
  musicCDIdentifier: "MCDI",
  eventTimingCodes: "ETCO",
  sequence: "SEQU",
  playCount: "PCNT",
  audioSeekPointIndex: "ASPI",
  mediaType: "STIK",
  commercialFrame: "COMR",
  audioEncryption: "AENC",
  signatureFrame: "SIGN",
  softwareEncoder: "TSSE",
  audioEncodingMethod: "CART",
  recommendedBufferSize: "RBUF",
  beatsPerMinute: "TBPM",
  language: "TLAN",
  fileType: "TFLT",
  recordingDate: "TDRC", // Replaces TYER, TIME, TDAT
  releaseDate: "TDRL", // New in 2.4
  originalReleaseDate: "TDOR", // New in 2.4
  equalization: "EQU2", // Changed from EQUA
  involvedPeople: "TIPL", // Replaces IPLS
  musicianCredits: "TMCL", // New in 2.4
  titleSort: "TSOT", // New in 2.4
  albumSort: "TSOA", // New in 2.4
  performerSort: "TSOP", // New in 2.4
};
export const id3v22ReverseMapping: Record<string, string> = Object.fromEntries(
  Object.entries(id3v22Mapping).map(([readable, original]) => [
    original,
    readable,
  ])
);

export const id3v23ReverseMapping: Record<string, string> = Object.fromEntries(
  Object.entries(id3v23Mapping).map(([readable, original]) => [
    original,
    readable,
  ])
);
export const id3v24ReverseMapping: Record<string, string> = Object.fromEntries(
  Object.entries(id3v24Mapping).map(([readable, original]) => [
    original,
    readable,
  ])
);
