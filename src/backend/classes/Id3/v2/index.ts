import { TagFormatMajor, TagFormatRelease } from "@/backend/classes/abstractions";
import Id3v2v3 from "./v3";

export default class Id3v2 extends TagFormatMajor {
  v3: TagFormatRelease;
  constructor() {
    super();
    this.v3 = new Id3v2v3();
  }
  getReleaseClass(version: string) {
    if (!version) return null;
    if (version === ".3") return this.v3;
    return null;
  }
}
