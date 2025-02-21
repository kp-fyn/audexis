import { TagFormatMajor } from "@/backend/classes/abstractions";
import Id3 from "./Id3";
import fs from "node:fs";
export default class TagManager {
  private Id3: TagFormatMajor;

  constructor() {
    this.Id3 = new Id3();
  }
  getReleaseClass(version: string) {
    if (version.startsWith("ID3"))
      return this.Id3.getReleaseClass(version.substring(3));
    return null;
  }
  detectTagFormat(filePath: string): string | null {

    const buffer = fs.readFileSync(filePath);

    if (buffer.subarray(-128, -123).toString() === "TAG") {
      const version = buffer[125] === 0 ? "ID3v1.0" : "ID3v1.1";
      return version;
    }

    if (buffer.subarray(0, 3).toString() === "ID3") {
      const versionByte = buffer[3];
      const revisionByte = buffer[4];

      if (versionByte === 2 && revisionByte === 0) {
        return "ID3v2.2";
      }
      if (versionByte === 3 && revisionByte === 0) {
        return "ID3v2.3";
      }
      if (versionByte === 4 && revisionByte === 0) {
        return "ID3v2.4";
      }
    }

    if (filePath.endsWith(".mp3")) return "ID3v2.3";
    return null;
  }
}
