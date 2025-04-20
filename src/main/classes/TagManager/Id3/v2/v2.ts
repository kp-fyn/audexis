import { Tags, ImgData, Frames } from "../../../../../types";
import fs from "node:fs";
import { id3v22ReverseMapping, id3v22Tags } from "../../../../utils/Id3v2";
import Id3V2 from "../../abstractions/Id3v2";

export default class v2 extends Id3V2 {
  picFrame = "PIC";
  id3ReverseMapping: Record<string, string>;
  id3Tags: Frames;
  constructor() {
    super();
    this.picFrame = "PIC";
    this.id3ReverseMapping = id3v22ReverseMapping;
    this.id3Tags = id3v22Tags;
  }

  writeTags(tgs: Partial<Tags>, filePath: string): void {
    const newFrames: Buffer[] = [];
    const tags = this.tagsToRaw(tgs);

    const audioData = fs.readFileSync(filePath).subarray(10);

    for (const frameID in tags) {
      if (frameID === "PIC") {
        const imgData = tags[frameID] as ImgData;
        if (!imgData || !imgData.buffer) continue;

        const mimeBuffer = Buffer.from(imgData.mime.slice(0, 3), "utf8");
        const typeBuffer = Buffer.from([imgData.type?.id ?? 0x03]);
        const descBuffer = imgData.description
          ? Buffer.concat([Buffer.from(imgData.description, "utf8"), Buffer.from([0x00])])
          : Buffer.from([0x00]);
        const imageDataBuffer = imgData.buffer;

        const picData = Buffer.concat([
          Buffer.from([0x00]),
          mimeBuffer,
          typeBuffer,
          descBuffer,
          imageDataBuffer,
        ]);

        const picFrameHeader = Buffer.alloc(6);
        picFrameHeader.write("PIC", 0, 3, "utf8");
        picFrameHeader.writeUIntBE(picData.length, 3, 3);

        newFrames.push(Buffer.concat([picFrameHeader, picData]));
        continue;
      }

      const textBuffer = Buffer.from(tags[frameID] + "\x00", "utf8");
      const frameSize = textBuffer.length;
      const frameHeader = Buffer.alloc(6);
      frameHeader.write(frameID, 0, 3, "utf8");
      frameHeader.writeUIntBE(frameSize, 3, 3);

      newFrames.push(Buffer.concat([frameHeader, textBuffer]));
    }

    const newTagSize = newFrames.reduce((sum, frame) => sum + frame.length, 0);
    const newSizeBuffer = Buffer.from([
      (newTagSize >> 21) & 0x7f,
      (newTagSize >> 14) & 0x7f,
      (newTagSize >> 7) & 0x7f,
      newTagSize & 0x7f,
    ]);

    const newHeader = Buffer.concat([Buffer.from("ID3\x02\x00\x00"), newSizeBuffer]);

    const newBuffer = Buffer.concat([newHeader, ...newFrames, audioData]);
    fs.writeFileSync(filePath, newBuffer);
  }
}
