import TagFormatRelease from "./TagFormatRelease";
import fs from "node:fs";
import crypto from "crypto";
import { Frames, ImgData, Tags } from "../../../../types";
type ID3V2Frames = {
  [key: string]: string | Buffer<ArrayBufferLike> | ImgData | null;
};
export default abstract class Id3V2 extends TagFormatRelease {
  abstract picFrame: string;
  abstract id3ReverseMapping: Record<string, string>;
  abstract id3Tags: Frames;
  clearTags(filePath: string): void {
    const fileBuffer = fs.readFileSync(filePath);

    if (fileBuffer.toString("utf8", 0, 3) === "ID3") {
      const header = fileBuffer.subarray(0, 10);
      const version = header[3];
      let tagSize = 0;

      if (version === 2) {
        tagSize = fileBuffer.readUIntBE(6, 3);
      } else {
        tagSize =
          ((header[6] & 0x7f) << 21) |
          ((header[7] & 0x7f) << 14) |
          ((header[8] & 0x7f) << 7) |
          (header[9] & 0x7f);
      }

      const newBuffer = fileBuffer.subarray(10 + tagSize);
      fs.writeFileSync(filePath, newBuffer);
    }
  }

  rawToTags(rawMetadata: ID3V2Frames): Tags {
    const readableTags: Record<string, string> = {};

    for (const key in rawMetadata) {
      const readableKey = this.id3ReverseMapping[key];
      if (readableKey) {
        readableTags[readableKey] = rawMetadata[key] as string;
      }
    }
    return readableTags as unknown as Tags;
  }
  tagsToRaw(tags: Partial<Tags>): Frames {
    const rawMetadata: Record<string, string> = {};
    for (const key in tags) {
      if (Object.prototype.hasOwnProperty.call(tags, key)) {
        const rawKey = Object.keys(this.id3ReverseMapping).find(
          (k) => this.id3ReverseMapping[k] === key
        );
        if (rawKey) {
          rawMetadata[rawKey] = tags[key as keyof Tags] as string;
        }
      }
    }
    return rawMetadata as Frames;
  }

  getImage(filePath: string): ImgData | null {
    const buffer = fs.readFileSync(filePath);

    let offset = 10;

    while (offset < buffer.length) {
      const frameID = buffer.toString("utf8", offset, offset + 4);
      if (frameID === this.picFrame) {
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
          description = buffer.toString("utf8", descriptionStart, descriptionEnd);
        } else if (encoding === 1) {
          descriptionEnd = buffer.indexOf("\x00\x00", descriptionStart);
          description = buffer.toString("utf16le", descriptionStart, descriptionEnd);
        }

        const imageStart = descriptionEnd + (encoding === 1 ? 2 : 1);
        const imageBuffer = buffer.subarray(imageStart, offset + 10 + frameSize);

        return {
          mime: mime.toString(),
          type: { id: pictureType },
          description,
          buffer: imageBuffer,
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

    return buffer.subarray(0, 3).toString() === "ID3" ? buffer : null;
  }
  public hashAudioStream(filePath: string): string | null {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(10);

    fs.readSync(fd, buffer, 0, 10, 0);
    fs.closeSync(fd);

    if (buffer.toString("utf8", 0, 3) !== "ID3") {
      return null;
    }

    const size =
      ((buffer[6] & 0x7f) << 21) |
      ((buffer[7] & 0x7f) << 14) |
      ((buffer[8] & 0x7f) << 7) |
      (buffer[9] & 0x7f);
    const audioStream = buffer.subarray(10 + size);
    const hash = crypto.createHash("sha256");
    hash.update(audioStream);
    const hashBuffer = hash.digest("hex");
    return hashBuffer;
  }
  getTags(filePath: string): Tags {
    const buffer = fs.readFileSync(filePath);

    const version = buffer[3];
    const isID3v22 = version === 2;
    // const isID3v23 = version === 3;
    const isID3v24 = version === 4;

    let offset = 10;
    const frames: Record<string, string | Buffer | ImgData> = {};

    while (offset < buffer.length) {
      const frameID = buffer
        .toString("utf8", offset, offset + (isID3v22 ? 3 : 4))
        .replace(/\0/g, "");

      offset += isID3v22 ? 3 : 4;

      if (!frameID.match(/^[A-Z0-9]{3,4}$/)) break;

      let frameSize;
      if (isID3v22) {
        frameSize = buffer.readUIntBE(offset, 3);
        offset += 3;
      } else if (isID3v24) {
        frameSize =
          (buffer[offset] & 0x7f) * 0x200000 +
          (buffer[offset + 1] & 0x7f) * 0x4000 +
          (buffer[offset + 2] & 0x7f) * 0x80 +
          (buffer[offset + 3] & 0x7f);
        offset += 4 + 2;
      } else {
        frameSize = buffer.readUInt32BE(offset);
        offset += 4 + 2;
      }

      const frameData = buffer.subarray(offset, offset + frameSize);
      offset += frameSize;

      if (frameID.startsWith("T") || ["TT2", "TP1", "TP2", "TAL", "TYE"].includes(frameID)) {
        const encoding = frameData[0];
        let text = "";
        if (encoding === 0) {
          text = frameData.toString("latin1", 1).replace(/\0/g, "");
        } else if (encoding === 1 || encoding === 2) {
          text = frameData.toString("utf16le", 1).replace(/\0/g, "");
        } else if (encoding === 3) {
          text = frameData.toString("utf8", 1).replace(/\0/g, "");
        }
        frames[frameID] = text;
      } else if (frameID === "APIC" || frameID === "PIC") {
        let mimeType = "";
        let pictureType: number;

        let imageOffset = 0;

        if (isID3v22) {
          const format = frameData.toString("utf8", 1, 4).replace(/\0/g, "");
          mimeType =
            format === "JPG"
              ? "image/jpeg"
              : format === "PNG"
                ? "image/png"
                : `image/${format.toLowerCase()}`;
          pictureType = frameData[4];
          imageOffset = 5;
        } else {
          const mimeEnd = frameData.indexOf(0, 1);
          mimeType = frameData.toString("utf8", 1, mimeEnd);
          pictureType = frameData[mimeEnd + 1];

          let descriptionEnd = mimeEnd + 2;
          while (frameData[descriptionEnd] !== 0 && descriptionEnd < frameData.length) {
            descriptionEnd++;
          }
          imageOffset = descriptionEnd + 1;
        }

        const imageData = frameData.subarray(imageOffset);

        frames[frameID] = {
          mime: mimeType,
          type: { id: pictureType },
          buffer: imageData,
        };
      } else {
        frames[frameID] = frameData;
      }
    }
    const fullMetadata = this.rawToTags({ ...this.id3Tags, ...frames });
    return fullMetadata;
  }
}
