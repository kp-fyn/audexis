import Id3v2 from "./v2";
import { TagFormatRelease, TagFormat, TagFormatMajor } from "../abstractions";
export default class Id3 extends TagFormat {
  v2: TagFormatMajor;
  constructor() {
    super();
    this.v2 = new Id3v2();
  }
  getReleaseClass(version: string): TagFormatRelease | null {
    if (!version) return null;

    if (version.startsWith("v2")) {
      return this.v2.getReleaseClass(version.substring(2));
    }
    return null;
  }
}
