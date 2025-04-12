import { TagFormatMajor, TagFormatRelease } from "../abstractions";
import v0 from "./v0";

export default class Itunes extends TagFormatMajor {
  itunes: v0;
  constructor() {
    super();
    this.itunes = new v0();
  }
  getReleaseClass(version: string): TagFormatRelease | null {
    if (!version) return null;
    return this.itunes;
  }
}
