import { Tags, ImgData, Frames } from "../../../../types";
import fs from "node:fs";
import Id3V2 from "../../abstractions/Id3v2";
import { id3v23ReverseMapping, id3v23Tags } from "../../../utils/Id3v2";

export default class v3 extends Id3V2 {
  picFrame: string;
  id3ReverseMapping: Record<string, string>;
  id3Tags: Frames;
  constructor() {
    super();
    this.picFrame = "APIC";
    this.id3ReverseMapping = id3v23ReverseMapping;
    this.id3Tags = id3v23Tags;
  }

  isID3Corrupted(filePath: string): boolean {
    try {
      const fd = fs.openSync(filePath, "r");
      const header = Buffer.alloc(10);
      fs.readSync(fd, header, 0, 10, 0);
      fs.closeSync(fd);

      if (header.toString("utf8", 0, 3) !== "ID3") {
        return true;
      }

      const version = header[3];
      if (version < 2 || version > 4) {
        return true;
      }
      // const flags = header[5];
      const tagSize =
        ((header[6] & 0x7f) << 21) |
        ((header[7] & 0x7f) << 14) |
        ((header[8] & 0x7f) << 7) |
        (header[9] & 0x7f);

      if (tagSize <= 0 || tagSize > fs.statSync(filePath).size - 10) {
        return true;
      }

      const buffer = fs.readFileSync(filePath).subarray(10, 10 + tagSize);
      let offset = 0;

      while (offset < buffer.length) {
        if (offset + 10 > buffer.length) {
          return true;
        }

        const frameID = buffer.toString("utf8", offset, offset + 4);
        const frameSize = buffer.readUInt32BE(offset + 4);

        if (!/^[A-Z0-9]{3,4}$/.test(frameID) || frameSize < 0) {
          return true;
        }

        if (offset + 10 + frameSize > buffer.length) {
          return true;
        }

        offset += 10 + frameSize;
      }

      return false;
    } catch (error) {
      console.error("Error checking ID3 tag:", error);
      return true;
    }
  }

  readId3Header(filePath: string): Buffer | null {
    const buffer = Buffer.alloc(10);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 10, 0);
    fs.closeSync(fd);

    if (buffer.subarray(0, 3).toString() !== "ID3") return null;

    return buffer;
  }

  writeTags(tgs: Partial<Tags>, filePath: string): void {
    const isCorrupted = this.isID3Corrupted(filePath);

    const newFrames: Buffer[] = [];
    const tags = this.tagsToRaw(tgs);

    let audioData: Buffer;

    if (isCorrupted) {
      audioData = fs.readFileSync(filePath).subarray(10);
    } else {
      const fd = fs.openSync(filePath, "r+");
      const header = Buffer.alloc(10);
      fs.readSync(fd, header, 0, 10, 0);
      const existingSize =
        ((header[6] & 0x7f) << 21) |
        ((header[7] & 0x7f) << 14) |
        ((header[8] & 0x7f) << 7) |
        (header[9] & 0x7f);

      const buffer = Buffer.alloc(existingSize);
      fs.readSync(fd, buffer, 0, existingSize, 10);
      fs.closeSync(fd);

      let offset = 0;
      while (offset < buffer.length) {
        if (offset + 10 > buffer.length) break;

        const frameID = buffer.toString("utf8", offset, offset + 4);
        const frameSize = buffer.readUInt32BE(offset + 4);
        // const frameFlags = buffer.subarray(offset + 8, offset + 10);

        if (frameSize === 0 || !/^[A-Z0-9]{3,4}$/.test(frameID)) break;
        if (offset + 10 + frameSize > buffer.length) break;

        if (!tags[frameID]) {
          newFrames.push(buffer.subarray(offset, offset + 10 + frameSize));
        }

        offset += 10 + frameSize;
      }

      audioData = fs.readFileSync(filePath).subarray(10 + existingSize);
    }

    for (const frameID in tags) {
      if (frameID === "APIC") {
        const imgData = tags[frameID] as ImgData;
        if (!imgData) continue;
        if (!imgData.buffer) continue;
        const supportedMimes: Record<string, string> = {
          "image/jpeg": "image/jpeg",
          "image/jpg": "image/jpeg",
          "image/png": "image/png",
          "image/gif": "image/gif"
        };
        const cleanMime = supportedMimes[imgData.mime.toLowerCase()] || "image/jpeg";

        const encodingByte = Buffer.from([0x00]);
        const mimeBuffer = Buffer.from(cleanMime + "\x00", "utf8");
        const typeBuffer = Buffer.from([imgData.type?.id ?? 0x03]);
        const descBuffer = imgData.description
          ? Buffer.concat([Buffer.from(imgData.description, "utf8"), Buffer.from([0x00])])
          : Buffer.from([0x00]);
        const imageDataBuffer = imgData.buffer;

        const apicData = Buffer.concat([
          encodingByte,
          mimeBuffer,
          typeBuffer,
          descBuffer,
          imageDataBuffer
        ]);
        const apicFrameSize = apicData.length;

        const apicFrameHeader = Buffer.alloc(10);
        apicFrameHeader.write("APIC", 0, 4, "utf8");
        apicFrameHeader.writeUInt32BE(apicFrameSize, 4);

        const apicFrame = Buffer.concat([apicFrameHeader, apicData]);
        newFrames.push(apicFrame);
        continue;
      }

      if (!/^[A-Z0-9]{3,4}$/.test(frameID)) continue;

      const textBuffer = Buffer.from("\x00" + tags[frameID], "utf8");
      const frameSize = textBuffer.length;
      const frameHeader = Buffer.alloc(10);
      frameHeader.write(frameID, 0, 4, "utf8");
      frameHeader.writeUInt32BE(frameSize, 4);

      const frameBuffer = Buffer.concat([frameHeader, textBuffer]);
      newFrames.push(frameBuffer);
    }

    const newTagSize = newFrames.reduce((sum, frame) => sum + frame.length, 0);
    const newSizeBuffer = Buffer.from([
      (newTagSize >> 21) & 0x7f,
      (newTagSize >> 14) & 0x7f,
      (newTagSize >> 7) & 0x7f,
      newTagSize & 0x7f
    ]);

    const newHeader = Buffer.concat([Buffer.from("ID3\x03\x00\x00"), newSizeBuffer]);

    const padding = Buffer.alloc(10);
    const newBuffer = Buffer.concat([newHeader, ...newFrames, padding, audioData]);
    fs.writeFileSync(filePath, newBuffer);
  }

  clearTags(filePath: string): void {
    const fd = fs.openSync(filePath, "r+");
    const header = Buffer.alloc(10);
    fs.readSync(fd, header, 0, 10, 0);

    if (header.toString("utf8", 0, 3) !== "ID3") {
      fs.closeSync(fd);
      return;
    }

    const existingSize =
      ((header[6] & 0x7f) << 21) |
      ((header[7] & 0x7f) << 14) |
      ((header[8] & 0x7f) << 7) |
      (header[9] & 0x7f);

    fs.closeSync(fd);

    const audioData = fs.readFileSync(filePath).subarray(10 + existingSize);

    fs.writeFileSync(filePath, audioData);
  }
}
