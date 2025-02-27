import { Tags, ImgData } from "@/types";

export default abstract class TagFormatRelease {

  abstract getTags(filePath: string): Tags | null;
  abstract writeTags(tags: Partial<Tags>, filePath: string): void;
  abstract clearTags(filePath: string): void;
  abstract getImage(filePath: string): ImgData | null;

}
