import { TagFormat, TagFormatMajor } from "@/backend/classes/abstractions";
import Id3v2 from "./v2";
export default class Id3 extends TagFormat {
  v2: TagFormatMajor;
  constructor() {
    super();
    this.v2 = new Id3v2();
  }
  getReleaseClass(version: string) {
    if (!version) return null;

    if (version.startsWith("v2")) {
      return this.v2.getReleaseClass(version.substring(2));
    }
    return null;
  }
}
