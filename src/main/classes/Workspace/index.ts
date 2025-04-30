import { AudioFile, RootFileTree, FileNode, Watcher, WorkspaceAction } from "../../../types";
import { subscribe, Event } from "@parcel/watcher";
import { tagManager, mainWindowId } from "../..";
import fs from "fs-extra";
import path from "path";
import { BrowserWindow } from "electron";
import Constants from "../../utils/Constants";
import { loadConfig } from "../../db/config";
import { findFileNodeByPath } from "../../utils/findNodeByPath";
import { isDescendant } from "../../utils/isDescendant";

export default class Workspace {
  public fileTree: RootFileTree;
  public audioFiles: Map<string, AudioFile>;
  private watchers: Map<string, Watcher>;

  constructor() {
    this.fileTree = {
      organized: new Map<string, FileNode>(),
      disorgainzed: new Map<string, FileNode>(),
    };
    this.audioFiles = new Map<string, AudioFile>();
    this.watchers = new Map<string, Watcher>();
  }
  public resetTree(): void {
    this.fileTree = {
      organized: new Map<string, FileNode>(),
      disorgainzed: new Map<string, FileNode>(),
    };
  }
  public async move(conf: WorkspaceAction): Promise<void> {
    try {
      if (conf.action !== "move") return;

      const fileToMove = findFileNodeByPath(this.fileTree, conf.str);
      const targetFolder = findFileNodeByPath(this.fileTree, conf.path);
      if (!fileToMove || !targetFolder || targetFolder.type !== "directory") return;

      const oldPath = fileToMove.path;
      const newPath = path.join(targetFolder.path, fileToMove.name);

      if (oldPath === newPath || isDescendant(fileToMove, targetFolder)) return;
      if (await fs.pathExists(newPath)) return;

      await fs.move(oldPath, newPath);

      const updatePathsRecursive = (node: FileNode, oldBase: string, newBase: string): FileNode => {
        const relative = path.relative(oldBase, node.path);
        const updatedPath = path.join(newBase, relative);
        const updatedName = path.basename(updatedPath);

        if (node.type === "file") {
          if (this.audioFiles.has(node.path)) {
            const oldMeta = this.audioFiles.get(node.path)!;
            this.audioFiles.delete(node.path);
            this.audioFiles.set(updatedPath, {
              ...oldMeta,
              path: updatedPath,
              fileName: updatedName,
            });
          }
        }

        let updatedChildren: Map<string, FileNode> | undefined = undefined;

        if (node.children) {
          updatedChildren = new Map();
          for (const child of node.children.values()) {
            const updatedChild = updatePathsRecursive(child, oldBase, newBase);
            updatedChildren.set(updatedChild.path, updatedChild);
          }
        }

        return {
          ...node,
          path: updatedPath,
          name: updatedName,
          children: updatedChildren,
        };
      };

      const treeTypes: ("organized" | "disorgainzed")[] = ["organized", "disorgainzed"];

      for (const treeType of treeTypes) {
        const tree = this.fileTree[treeType];
        if (tree.has(oldPath)) {
          this.stopWatching(oldPath);

          const node = tree.get(oldPath)!;

          const updatedNode =
            node.type === "directory"
              ? updatePathsRecursive(node, oldPath, newPath)
              : {
                  ...node,
                  path: newPath,
                  name: path.basename(newPath),
                };

          if (node.type === "file" && this.audioFiles.has(oldPath)) {
            const oldMeta = this.audioFiles.get(oldPath)!;
            this.audioFiles.delete(oldPath);
            this.audioFiles.set(newPath, {
              ...oldMeta,
              path: newPath,
              fileName: path.basename(newPath),
            });
          }

          tree.delete(oldPath);
          tree.set(newPath, updatedNode);

          this.startWatching({ path: newPath, isDir: node.type === "directory" });
        }
      }

      this.sendUpdate();
    } catch (err) {
      console.error("Error moving file:", err);
      this.sendUpdate();
    }
  }
  public async import(importPath: string, recursion: boolean = false): Promise<string[]> {
    const ft = await this.checkFileType(importPath);
    if (this.audioFiles.get(importPath)) return [];
    if (!ft) return [];
    const files: string[] = [];

    if (ft === "directory") {
      const entries = await fs.readdir(importPath, { withFileTypes: true });
      this.fileTree.disorgainzed.forEach((f) => {
        if (f.path.startsWith(importPath)) {
          this.fileTree.disorgainzed.delete(f.path);
          this.stopWatching(f.path);
        }
      });
      this.fileTree.organized.forEach((f) => {
        if (f.path.startsWith(importPath)) {
          this.fileTree.organized.delete(f.path);
          this.stopWatching(f.path);
        }
      });
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

          this.audioFiles.set(file, { ...tags, release, path: file, fileName: entry.name });
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
        this.audioFiles.set(file, {
          ...tags,
          release,
          path: file,
          fileName: path.basename(importPath),
        });
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
      const toArray = [...this.audioFiles].map(([, value]) => ({
        ...value,
      }));
      const db = await loadConfig();

      if (db.data.view === "folder") this.startWatching();
      mainWindow?.webContents.send(Constants.channels.UPDATE, toArray, this.fileTree);
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
  private async handleWatcherEvents(
    err: Error | null,
    events: Event[],
    parentDir: string
  ): Promise<void> {
    if (err) {
      console.error("Watcher error:", err);
      return;
    }

    const deleted = new Set<string>();
    const created = new Set<string>();
    let shouldRebuild = false;

    for (const event of events) {
      const { type, path: changedPath } = event;

      if (type === "delete") {
        deleted.add(changedPath);
        this.audioFiles.delete(changedPath);
        const oldWatcher = this.watchers.get(changedPath);
        if (oldWatcher) {
          oldWatcher.unsubscribe();
          this.watchers.delete(changedPath);
        }
      } else if (type === "create" || type === "update") {
        created.add(changedPath);

        if (this.isSupportedFile(changedPath)) {
          const release = tagManager.detectTagFormat(changedPath);
          if (!release) continue;
          const releaseClass = tagManager.getReleaseClass(release);
          if (!releaseClass) continue;
          const tags = releaseClass.getTags(changedPath);
          if (!tags) continue;

          const possibleOldPath = [...deleted].find(
            (d) => path.dirname(d) === path.dirname(changedPath)
          );

          if (possibleOldPath && this.audioFiles.has(possibleOldPath)) {
            const oldMeta = this.audioFiles.get(possibleOldPath)!;
            this.audioFiles.delete(possibleOldPath);
            this.audioFiles.set(changedPath, {
              ...oldMeta,
              path: changedPath,
              fileName: path.basename(changedPath),
            });
          } else {
            this.audioFiles.set(changedPath, {
              ...tags,
              release,
              path: changedPath,
              fileName: path.basename(changedPath),
            });
          }
        }
      }

      if (["create", "delete", "rename"].includes(type)) {
        shouldRebuild = true;
      }
    }

    if (shouldRebuild) {
      const allWatchers = this.watchers.keys();
      const parentWatcher = [...allWatchers].find((e) => parentDir.startsWith(e));
      if (!parentWatcher) return;

      const fn = await this.buildFileTree(parentWatcher);
      this.fileTree.organized.set(parentWatcher, fn);

      this.sendUpdate();
    }
  }
  public sendUpdate(): void {
    const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);
    const toArray = [...this.audioFiles].map(([, value]) => ({
      ...value,
    }));

    mainWindow?.webContents.send(Constants.channels.UPDATE, toArray, this.fileTree);
  }
  public async startWatching(opts?: { path: string; isDir: boolean }): Promise<void> {
    if (!opts) {
      for (const [pathName] of this.fileTree.organized) {
        if (!this.watchers.get(pathName)) {
          const subscription = await subscribe(pathName, (err, events) => {
            this.handleWatcherEvents(err, events, pathName);
          });
          this.watchers.set(pathName, {
            unsubscribe: subscription.unsubscribe,
            isFile: false,
          });
        }
      }
      for (const [filePath] of this.fileTree.disorgainzed) {
        if (!this.watchers.get(filePath)) {
          const subscription = await subscribe(path.dirname(filePath), (err, events) => {
            const matching = events.filter((e) => e.path === filePath);
            if (matching.length > 0) {
              this.handleWatcherEvents(err, matching, filePath);
            }
          });

          this.watchers.set(filePath, {
            unsubscribe: subscription.unsubscribe,
            isFile: true,
          });
        }
      }
    } else {
      const str = opts.path;
      if (!this.watchers.get(opts.path)) {
        const subscription = await subscribe(path.dirname(str), (err, events) => {
          const matching = events.filter((e) => e.path === str);
          if (matching.length > 0) {
            this.handleWatcherEvents(err, matching, str);
          }
        });

        this.watchers.set(str, {
          unsubscribe: subscription.unsubscribe,
          isFile: !opts.isDir,
        });
      }
    }
  }
  public async stopWatching(str?: string): Promise<void> {
    if (str) {
      const watcher = this.watchers.get(str);
      if (!watcher) return;
      await watcher.unsubscribe();
      this.watchers.delete(str);
    } else {
      for (const [, watcher] of this.watchers) {
        await watcher.unsubscribe();
      }
      this.watchers.clear();
    }
  }
  public async rename(conf: WorkspaceAction): Promise<void> {
    try {
      const oldPath = conf.path;
      const newPath = path.join(path.dirname(oldPath), conf.str);

      await fs.rename(oldPath, newPath);

      const isDir = (await this.checkFileType(newPath)) === "directory";

      const updatePathsRecursive = (node: FileNode, oldBase: string, newBase: string): FileNode => {
        const relative = path.relative(oldBase, node.path);
        const updatedPath = path.join(newBase, relative);
        const updatedName = path.basename(updatedPath);

        if (node.type === "file") {
          if (this.audioFiles.has(node.path)) {
            const oldMeta = this.audioFiles.get(node.path)!;
            this.audioFiles.delete(node.path);
            this.audioFiles.set(updatedPath, {
              ...oldMeta,
              path: updatedPath,
              fileName: updatedName,
            });
          }
        }

        let updatedChildren: Map<string, FileNode> | undefined = undefined;

        if (node.children) {
          updatedChildren = new Map();
          for (const child of node.children.values()) {
            const updatedChild = updatePathsRecursive(child, oldBase, newBase);
            updatedChildren.set(updatedChild.path, updatedChild);
          }
        }

        return {
          ...node,
          path: updatedPath,
          name: updatedName,
          children: updatedChildren,
        };
      };

      const treeTypes: ("organized" | "disorgainzed")[] = ["organized", "disorgainzed"];

      for (const treeType of treeTypes) {
        const tree = this.fileTree[treeType];
        if (tree.has(oldPath)) {
          this.stopWatching(oldPath);

          const node = tree.get(oldPath)!;

          const updatedNode =
            isDir && node.type === "directory"
              ? updatePathsRecursive(node, oldPath, newPath)
              : {
                  ...node,
                  path: newPath,
                  name: path.basename(newPath),
                };

          if (node.type === "file" && this.audioFiles.has(oldPath)) {
            const oldMeta = this.audioFiles.get(oldPath)!;
            this.audioFiles.delete(oldPath);
            this.audioFiles.set(newPath, {
              ...oldMeta,
              path: newPath,
              fileName: path.basename(newPath),
            });
          }

          tree.delete(oldPath);
          tree.set(newPath, updatedNode);

          this.startWatching({ path: newPath, isDir });
        }
      }

      this.sendUpdate();
    } catch (err) {
      console.error("Failed to rename file:", err);
      this.sendUpdate();
    }
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
    return [".mp3", ".m4a"].includes(ext);
  }
}
