import TagFormatRelease from "./TagFormatRelease";

export default abstract class TagManagerMajor {
  abstract getReleaseClass(version: string): TagFormatRelease | null;
}
