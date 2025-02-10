import { TagFormatRelease } from "@/backend/classes/abstractions";
import { Tags } from "@/types";
import fs from "node:fs";

export default class v3 extends TagFormatRelease {
  constructor() {
    super();
  }

  getTags(filePath: string): Tags | null {
    const header = this.readId3Header(filePath);
    if (!header) return null;

    const size =
      ((header[6] & 0x7f) << 21) |
      ((header[7] & 0x7f) << 14) |
      ((header[8] & 0x7f) << 7) |
      (header[9] & 0x7f);

    const buffer = Buffer.alloc(size);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, size, 10);
    fs.closeSync(fd);

    const frames: Record<string, string | Buffer> = {};
    let offset = 0;

    while (offset < buffer.length) {
      if (offset + 10 > buffer.length) break;

      const frameId = buffer.toString("utf8", offset, offset + 4);
      const frameSize = buffer.readUInt32BE(offset + 4);
      if (!/^[A-Z0-9]{3,4}$/.test(frameId) || frameSize === 0) break;
      const encoding = buffer[offset + 10];
      const frameData = buffer.slice(offset + 11, offset + 10 + frameSize);

      let textValue = "";

      switch (encoding) {
        case 0x00: // ISO-8859-1
          textValue = frameData.toString("latin1").replace(/\x00/g, "").trim();
          break;
        case 0x01: // UTF-16 with BOM
          textValue = frameData.toString("utf16le").replace(/\x00/g, "").trim();
          break;
        case 0x02: // UTF-16BE without BOM
          textValue = frameData
            .toString("utf16be" as BufferEncoding)
            .replace(/\x00/g, "")
            .trim();
          break;
        case 0x03: // UTF-8
          textValue = frameData.toString("utf8").replace(/\x00/g, "").trim();
          break;
        default:
          textValue = frameData.toString("utf8").replace(/\x00/g, "").trim();
      }

      if (frameId === "APIC") {
        const frameSize = buffer.readUInt32BE(offset + 4);

        const mimeTypeStart = offset + 11;
        const mimeTypeEnd = buffer.indexOf(0, mimeTypeStart);
        const mime = buffer.toString("utf8", mimeTypeStart, mimeTypeEnd);

        const pictureType = buffer[mimeTypeEnd + 1];

        const descriptionStart = mimeTypeEnd + 2;
        let descriptionEnd = 0;
        let description = "";

        if (encoding === 0 || encoding === 3) {
          descriptionEnd = buffer.indexOf(0, descriptionStart);
          description = buffer.toString(
            "utf8",
            descriptionStart,
            descriptionEnd
          );
        } else if (encoding === 1) {
          descriptionEnd = buffer.indexOf("\x00\x00", descriptionStart);
          description = buffer.toString(
            "utf16le",
            descriptionStart,
            descriptionEnd
          );
        }

        const imageStart = descriptionEnd + (encoding === 1 ? 2 : 1);
        const imageBuffer = buffer.subarray(
          imageStart,
          offset + 10 + frameSize
        );

        frames[frameId] = {
          mime,
          type: { id: pictureType },
          description,
          imageBuffer,
        };
      } else {
        if (!/^[A-Z0-9]{3,4}$/.test(frameId) || frameSize === 0) break;

        // const frameData = buffer.slice(offset + 10, offset + 10 + frameSize);

        frames[frameId] = textValue;
      }
      offset += 10 + frameSize;
    }

    const rawMetadata = { ...id3v2Tags, ...frames };

    return this.rawToTags(rawMetadata);
  }
  getImage(filePath: string): {
    mime: string;
    type: { id: number; name?: string };
    description: string;
    imageBuffer: Buffer;
  } | null {
    const buffer = fs.readFileSync(filePath);

    let offset = 10;

    while (offset < buffer.length) {
      const frameID = buffer.toString("utf8", offset, offset + 4);
      if (frameID === "APIC") {
        const frameSize = buffer.readUInt32BE(offset + 4);

        const encoding = buffer[offset + 10];

        const mimeTypeStart = offset + 11;
        const mimeTypeEnd = buffer.indexOf(0, mimeTypeStart);
        const mime = buffer.toString("utf8", mimeTypeStart, mimeTypeEnd);

        const pictureType = buffer[mimeTypeEnd + 1];

        const descriptionStart = mimeTypeEnd + 2;
        let descriptionEnd = 0;
        let description = "";

        if (encoding === 0 || encoding === 3) {
          descriptionEnd = buffer.indexOf(0, descriptionStart);
          description = buffer.toString(
            "utf8",
            descriptionStart,
            descriptionEnd
          );
        } else if (encoding === 1) {
          descriptionEnd = buffer.indexOf("\x00\x00", descriptionStart);
          description = buffer.toString(
            "utf16le",
            descriptionStart,
            descriptionEnd
          );
        }

        const imageStart = descriptionEnd + (encoding === 1 ? 2 : 1);
        const imageBuffer = buffer.subarray(
          imageStart,
          offset + 10 + frameSize
        );

        return {
          mime,
          type: { id: pictureType },
          description,
          imageBuffer,
        };
      }

      offset += 10 + buffer.readUInt32BE(offset + 4);
    }

    return null;
  }
  readId3Header(filePath: string): Buffer | null {
    const buffer = Buffer.alloc(10);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 10, 0);
    fs.closeSync(fd);

    if (buffer.subarray(0, 3).toString() !== "ID3") return null;

    return buffer;
  }
  rawToTags(rawMetadata: ID3v23Frames): Tags {
    const readableTags: Record<string, string> = {};
    for (const key in rawMetadata) {
      if (Object.prototype.hasOwnProperty.call(rawMetadata, key)) {
        const readableKey = id3ReverseMapping[key];
        if (readableKey) {
          readableTags[readableKey] = rawMetadata[key];
        }
      }
    }
    return readableTags as unknown as Tags;
  }
  tagsToRaw(tags: Partial<Tags>): ID3v23Frames {
    const rawMetadata: Record<string, string> = {};
    for (const key in tags) {
      if (Object.prototype.hasOwnProperty.call(tags, key)) {
        const rawKey = Object.keys(id3ReverseMapping).find(
          (k) => id3ReverseMapping[k] === key
        );
        if (rawKey) {
          rawMetadata[rawKey] = tags[key];
        }
      }
    }
    return rawMetadata as ID3v23Frames;
  }

  writeTags(tgs: Partial<Tags>, filePath: string): void {
    let fd = fs.openSync(filePath, "r+");
    let header = Buffer.alloc(10);
    fs.readSync(fd, header, 0, 10, 0);

    if (header.toString("utf8", 0, 3) !== "ID3") {
      fs.closeSync(fd);
      return;
    }

    let existingSize =
      ((header[6] & 0x7f) << 21) |
      ((header[7] & 0x7f) << 14) |
      ((header[8] & 0x7f) << 7) |
      (header[9] & 0x7f);

    let buffer = Buffer.alloc(existingSize);
    fs.readSync(fd, buffer, 0, existingSize, 10);
    fs.closeSync(fd);

    let newFrames: Buffer[] = [];
    let tags = this.tagsToRaw(tgs);

    let offset = 0;

    while (offset < buffer.length) {
      let frameID = buffer.toString("utf8", offset, offset + 4);
      let frameSize = buffer.readUInt32BE(offset + 4);
      let frameFlags = buffer.subarray(offset + 8, offset + 10);

      if (frameSize === 0 || !/^[A-Z0-9]{3,4}$/.test(frameID)) break;

      if (frameID === "APIC") {
        let apicFrame = buffer.subarray(offset, offset + 10 + frameSize);
        newFrames.push(apicFrame);
      } else if (tags[frameID]) {
        let textBuffer = Buffer.from("\x00" + tags[frameID], "utf8");
        let newFrameSize = textBuffer.length;
        let newFrameBuffer = Buffer.concat([
          Buffer.from(frameID, "utf8"),
          Buffer.alloc(4),
          frameFlags,
          textBuffer,
        ]);

        newFrameBuffer.writeUInt32BE(newFrameSize, 4);
        newFrames.push(newFrameBuffer);
      }

      offset += 10 + frameSize;
    }

    for (const frameID in tags) {
      if (frameID === "APIC") continue;
      if (!/^[A-Z0-9]{3,4}$/.test(frameID)) continue;

      let textBuffer = Buffer.from("\x00" + tags[frameID], "utf8");
      let frameSize = textBuffer.length;
      let frameBuffer = Buffer.concat([
        Buffer.from(frameID, "utf8"),
        Buffer.alloc(4),
        Buffer.alloc(2),
        textBuffer,
      ]);

      frameBuffer.writeUInt32BE(frameSize, 4);
      newFrames.push(frameBuffer);
    }

    let newTagSize = newFrames.reduce((sum, frame) => sum + frame.length, 0);
    let newSizeBuffer = Buffer.from([
      (newTagSize >> 21) & 0x7f,
      (newTagSize >> 14) & 0x7f,
      (newTagSize >> 7) & 0x7f,
      newTagSize & 0x7f,
    ]);

    let audioData = fs.readFileSync(filePath).subarray(10 + existingSize);

    let newBuffer = Buffer.concat([
      header.subarray(0, 6),
      newSizeBuffer,
      ...newFrames,
      Buffer.alloc(10),
      audioData,
    ]);

    fs.writeFileSync(filePath, newBuffer);
  }
  clearTags(_filePath: string): void {
    return;
  }
}
type ID3v23Frames = {
  [key: string]: any;
};
const id3v2Tags: ID3v23Frames = {
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
const id3Mapping: Record<string, string> = {
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
const id3ReverseMapping: Record<string, string> = Object.fromEntries(
  Object.entries(id3Mapping).map(([readable, original]) => [original, readable])
);
