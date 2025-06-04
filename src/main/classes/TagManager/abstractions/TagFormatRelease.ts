import { Tags } from "../../../../types";

export default abstract class TagFormatRelease {
  abstract getTags(filePath: string): Tags | null;
  abstract writeTags(tags: Partial<Tags>, filePath: string): void;
  abstract clearTags(filePath: string): void;
  abstract hashAudioStream(filePath: string): string | null;
}
