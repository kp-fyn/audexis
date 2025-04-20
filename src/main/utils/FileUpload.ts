import { BrowserWindow } from "electron";
import { tagManager, audioFiles, mainWindowId, folders } from "../";
import Constants from "./Constants";

// export async function FileUploads(files: string[]): Promise<void> {
//   const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);

//   files.forEach((file) => {});
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const toArray = [...audioFiles].map(([_n, value]) => ({
//     ...value,
//   }));

//   mainWindow?.webContents.send(Constants.channels.UPDATE, toArray);
// }

import fs from "node:fs/promises";
import path from "path";
import { FileNode } from "../../types";

export default async function FileUpload(
  dirPath: string,
  recursion: boolean = false
): Promise<string[]> {
  const ft = await checkFileType(dirPath);
  if (!ft) return [];
  const files: string[] = [];

  if (ft === "directory") {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    if (!recursion && !folders.find((f) => f === dirPath)) {
      folders.push(dirPath);
      const fileTree = await buildFileTree(dirPath);
      console.log({ fileTree });
    }
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await FileUpload(fullPath, true);
        files.push(...subFiles);
      } else if (isSupportedFile(fullPath)) {
        const file = path.join(entry.parentPath, entry.name);

        const release = tagManager.detectTagFormat(file);
        if (!release) continue;
        const releaseClass = tagManager.getReleaseClass(release);
        if (!releaseClass) continue;
        const tags = releaseClass.getTags(file);
        if (!tags) continue;
        audioFiles.set(file, { ...tags, release, path: file });
      }
    }
  } else if (ft === "file") {
    if (isSupportedFile(dirPath)) {
      const file = dirPath;

      const release = tagManager.detectTagFormat(file);
      if (!release) return [];
      const releaseClass = tagManager.getReleaseClass(release);
      if (!releaseClass) return [];
      const tags = releaseClass.getTags(file);
      if (!tags) return [];
      audioFiles.set(file, { ...tags, release, path: file });
    }
  }

  const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);
  const toArray = [...audioFiles].map(([_n, value]) => ({
    ...value,
  }));
  mainWindow?.webContents.send(Constants.channels.UPDATE, toArray);

  return files;
}

function isSupportedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".mp3", ".m4a", ".flac", ".ogg", ".wav"].includes(ext); // Customize as needed
}

export async function buildFileTree(dirPath: string): Promise<FileNode> {
  const name = path.basename(dirPath);
  const item: FileNode = {
    name,
    path: dirPath,
    type: "directory",
    children: new Map<string, FileNode>(),
  };

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const child = await buildFileTree(fullPath);
        if (!item.children) continue;
        item.children.set(fullPath, child);
      } else if (entry.isFile()) {
        if (!isSupportedFile(fullPath)) continue;
        if (!item.children) continue;
        item.children.set(fullPath, {
          name: entry.name,
          path: fullPath,
          type: "file",
        });
      }
    }
  } catch (err) {
    console.error(`Error reading ${dirPath}:`, err);
  }

  return item;
}

async function checkFileType(filePath: string): Promise<"directory" | "file" | null> {
  try {
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) return "directory";
    if (stat.isFile()) return "file";
    return null;
  } catch {
    return null;
  }
}
