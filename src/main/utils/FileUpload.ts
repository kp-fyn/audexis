import { BrowserWindow } from "electron";
import { tagManager, audioFiles, mainWindowId } from "../";
import Constants from "./Constants";

export default function FileUpload(files: string[]): void {
  const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);
  const parsedFiles = files.filter(
    (file) => file.endsWith(".mp3") || file.endsWith(".m4a") || file.endsWith(".mp4")
  );
  parsedFiles.forEach((file) => {
    const release = tagManager.detectTagFormat(file);
    if (!release) return;
    const releaseClass = tagManager.getReleaseClass(release);
    if (!releaseClass) return;
    const tags = releaseClass.getTags(file);
    if (!tags) return;
    audioFiles.set(file, { ...tags, release, path: file });
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toArray = [...audioFiles].map(([_n, value]) => ({
    ...value,
  }));

  mainWindow?.webContents.send(Constants.channels.UPDATE, toArray);
}
