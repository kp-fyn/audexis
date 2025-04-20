import { AudioFile, RootFileTree, FileNode } from "../../../types";
import { tagManager, mainWindowId } from "../..";
import fs from "node:fs/promises";
import path from "path";
import { BrowserWindow } from "electron";
export default class Workspace {
  readonly fileTree: RootFileTree;
  public audioFiles: Map<string, AudioFile>;

  constructor() {
    this.fileTree = {
      organized: new Map<string, FileNode>(),
      disorgainzed: new Map<string, FileNode>(),
    };
    this.audioFiles = new Map<string, AudioFile>();
  }

  public async import(importPath: string, recursion: boolean = false): Promise<string[]> {
    const ft = await this.checkFileType(importPath);
    if (this.audioFiles.get(importPath)) return [];
    if (!ft) return [];
    const files: string[] = [];

    if (ft === "directory") {
      const entries = await fs.readdir(importPath, { withFileTypes: true });
      if (!recursion) {
        const fileNode = await this.buildFileTree(importPath);
        this.fileTree.organized.set(fileNode.path, fileNode);
      }
      for (const entry of entries) {
        const fullPath = path.join(importPath, entry.name);
        if (entry.isDirectory()) {
          const subFiles = await this.import(fullPath, true);
          files.push(...subFiles);
        } else if (this.isSupportedFile(fullPath)) {
          const file = path.join(entry.parentPath, entry.name);

          const release = tagManager.detectTagFormat(file);
          if (!release) continue;
          const releaseClass = tagManager.getReleaseClass(release);
          if (!releaseClass) continue;
          const tags = releaseClass.getTags(file);
          if (!tags) continue;
          this.audioFiles.set(file, { ...tags, release, path: file });
        }
      }
    } else if (ft === "file") {
      if (this.isSupportedFile(importPath)) {
        const file = importPath;

        const release = tagManager.detectTagFormat(file);
        if (!release) return [];
        const releaseClass = tagManager.getReleaseClass(release);
        if (!releaseClass) return [];
        const tags = releaseClass.getTags(file);
        if (!tags) return [];
        this.audioFiles.set(file, { ...tags, release, path: file });
        if (!recursion)
          this.fileTree.disorgainzed.set(importPath, {
            name: path.basename(importPath),
            path: importPath,
            type: "file",
          });
      }
    }
    if (!recursion) {
      const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);
      const toArray = [...this.audioFiles].map(([_n, value]) => ({
        ...value,
      }));
      mainWindow?.webContents.send(Constants.channels.UPDATE, toArray);
    }

    return files;
  }
  private async buildFileTree(dirPath: string): Promise<FileNode> {
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
          const child = await this.buildFileTree(fullPath);
          if (!item.children) continue;
          item.children.set(fullPath, child);
        } else if (entry.isFile()) {
          if (!this.isSupportedFile(fullPath)) continue;
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
  private async checkFileType(filePath: string): Promise<"directory" | "file" | null> {
    try {
      const stat = await fs.stat(filePath);

      if (stat.isDirectory()) return "directory";
      if (stat.isFile()) return "file";
      return null;
    } catch {
      return null;
    }
  }
  private isSupportedFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return [".mp3", ".m4a", ".flac", ".ogg", ".wav"].includes(ext);
  }
}
