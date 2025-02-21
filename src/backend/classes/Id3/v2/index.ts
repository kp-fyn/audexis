import {
  TagFormatMajor,
  TagFormatRelease,
} from "@/backend/classes/abstractions";
import Id3v2v2 from "./v2";
import Id3v2v3 from "./v3";
import Id3v2v4 from "./v4";

export default class Id3v2 extends TagFormatMajor {
  v2: TagFormatRelease;
  v3: TagFormatRelease;
  v4: TagFormatRelease;

  constructor() {
    super();
    this.v3 = new Id3v2v3();
    this.v4 = new Id3v2v4();
    this.v2 = new Id3v2v2();
  }
  getReleaseClass(version: string) {
    if (!version) return null;

    if (version === ".2") return this.v2;
    if (version === ".3") return this.v3;
    if (version === ".4") return this.v4;

    return null;
  }
}
