import { Tags, ImgData, Frames } from "../../../../../types";
import fs from "node:fs";
import Id3V2 from "../../abstractions/Id3v2";
import { id3v24ReverseMapping, id3v24Tags } from "../../../../utils/Id3v2";

export default class v4 extends Id3V2 {
  picFrame = "APIC";
  id3ReverseMapping: Record<string, string>;
  id3Tags: Frames;
  constructor() {
    super();
    this.picFrame = "APIC";
    this.id3ReverseMapping = id3v24ReverseMapping;
    this.id3Tags = id3v24Tags;
  }

  isID3Corrupted(filePath: string): boolean {
    try {
      const fd = fs.openSync(filePath, "r");
      const header = Buffer.alloc(10);
      fs.readSync(fd, header, 0, 10, 0);
      fs.closeSync(fd);

      if (header.toString("utf8", 0, 3) !== "ID3") return true;

      const version = header[3];
      if (version !== 4) return true;

      const tagSize =
        ((header[6] & 0x7f) << 21) |
        ((header[7] & 0x7f) << 14) |
        ((header[8] & 0x7f) << 7) |
        (header[9] & 0x7f);

      return tagSize <= 0 || tagSize > fs.statSync(filePath).size - 10;
    } catch (error) {
      console.error("Error checking ID3 tag:", error);
      return true;
    }
  }

  encodeSyncSafeInt(size: number): Buffer | null {
    if (size < 0 || size > 268435455) {
      return null;
    }
    return Buffer.from([(size >> 21) & 0x7f, (size >> 14) & 0x7f, (size >> 7) & 0x7f, size & 0x7f]);
  }

  writeTags(tgs: Partial<Tags>, filePath: string): void {
    const newFrames: Buffer[] = [];
    const tags = this.tagsToRaw(tgs);

    for (const frameID in tags) {
      if (frameID === "APIC") {
        const imgData = tags[frameID] as ImgData;
        if (!imgData) continue;
        if (!imgData.buffer) continue;
        const supportedMimes: Record<string, string> = {
          "image/jpeg": "image/jpeg",
          "image/jpg": "image/jpeg",
          "image/png": "image/png",
          "image/gif": "image/gif",
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
          imageDataBuffer,
        ]);

        const apicFrameSize = apicData.length;
        const frameSizeSyncSafe = this.encodeSyncSafeInt(apicFrameSize);
        if (!frameSizeSyncSafe) continue;

        const apicFrameHeader = Buffer.concat([
          Buffer.from("APIC"),
          frameSizeSyncSafe,
          Buffer.from([0x00, 0x00]),
        ]);

        const apicFrame = Buffer.concat([apicFrameHeader, apicData]);
        newFrames.push(apicFrame);
        continue;
      }
      if (!/^[A-Z0-9]{4}$/.test(frameID)) continue;

      const tagValue = tags[frameID];
      if (tagValue === null || tagValue === undefined || tagValue === "") continue;

      const textBuffer = Buffer.from("\x03" + tagValue.toString(), "utf8");

      const frameSizeSyncSafe = this.encodeSyncSafeInt(textBuffer.length);
      if (!frameSizeSyncSafe) continue;

      const frameHeader = Buffer.concat([
        Buffer.from(frameID),
        frameSizeSyncSafe,
        Buffer.from([0x00, 0x00]),
      ]);

      newFrames.push(Buffer.concat([frameHeader, textBuffer]));
    }

    const newTagSize = newFrames.reduce((sum, frame) => sum + frame.length, 0);
    const newSizeBuffer = this.encodeSyncSafeInt(newTagSize);
    if (!newSizeBuffer) return;

    const newHeader = Buffer.concat([
      Buffer.from("ID3"),
      Buffer.from([0x04, 0x00]),
      Buffer.from([0x00]),
      newSizeBuffer,
    ]);

    let audioData: Buffer = fs.readFileSync(filePath);
    if (audioData.toString("utf8", 0, 3) === "ID3") {
      const existingSize =
        ((audioData[6] & 0x7f) << 21) |
        ((audioData[7] & 0x7f) << 14) |
        ((audioData[8] & 0x7f) << 7) |
        (audioData[9] & 0x7f);
      audioData = audioData.subarray(10 + existingSize);
    }

    const newBuffer = Buffer.concat([newHeader, ...newFrames, audioData]);
    fs.writeFileSync(filePath, newBuffer);
  }
}

export { v4 };
