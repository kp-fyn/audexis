import TagFormatRelease from "./TagFormatRelease";

export default abstract class TagFormatMajor {
  abstract getReleaseClass(version: string): TagFormatRelease | null;
}
