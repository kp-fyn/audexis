import type {
  RootFileTree,
  FileNode,
  Watcher,
  WorkspaceAction,
  Tags,
  Changes,
  UpdatedPath,
} from "../../../types";
import { subscribe, Event } from "@parcel/watcher";
import { tagManager, mainWindowId, windows } from "../..";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { BrowserWindow } from "electron";
import Constants from "../../../shared/Constants";

import { findFileNodeByPath } from "../../utils/findNodeByPath";
import { isDescendant } from "../../utils/isDescendant";
import { Album, loadConfig, saveConfig, UserConfig } from "../../db/config";
import { isValidFileName } from "../../utils/isValidFileName";

export default class Workspace {
  public fileTree: RootFileTree;
  private lastUpdated: number = 0;
  private cachedDb: UserConfig;

  private watchers: Map<string, Watcher>;
  private updatedPathsArray: UpdatedPath[] = [];

  constructor(initConfig: UserConfig) {
    this.fileTree = {
      organized: new Map<string, FileNode>(),
      disorgainzed: new Map<string, FileNode>(),
    };
    this.cachedDb = initConfig;

    this.watchers = new Map<string, Watcher>();
    this.updatedPathsArray = [];
  }
  private async getCachedDb(): Promise<UserConfig> {
    if (this.cachedDb && Date.now() - this.lastUpdated < 5000) return this.cachedDb;
    this.cachedDb = await loadConfig();
    this.lastUpdated = Date.now();
    return this.cachedDb;
  }
  public async resetTree(): Promise<void> {
    this.fileTree = {
      organized: new Map<string, FileNode>(),
      disorgainzed: new Map<string, FileNode>(),
    };
    await this.stopWatching();
  }
  public async editAlbum({
    albumId,
    changes,
  }: {
    albumId: string;
    changes: Partial<Album>;
  }): Promise<void> {
    if (!albumId || !changes) return;
    const db = await loadConfig();
    const albums = db.albums || [];
    const album = albums.find((a) => a.id === albumId);
    if (!album) return;
    const newAlbum: Album = {
      ...album,
      id: album.id,
      album: changes.album ?? album.album,
      albumArtist: changes.albumArtist ?? album.albumArtist,
      copyright: changes.copyright ?? album.copyright,
      genre: changes.genre ?? album.genre,
      year: changes.year ?? album.year,
      fileFormatPath: changes.fileFormatPath ?? album.fileFormatPath,
      fileFormatPathEnabled: changes.fileFormatPathEnabled ?? album.fileFormatPathEnabled,
      attachedPicture:
        changes.attachedPicture && changes.attachedPicture.buffer
          ? {
              buffer: Buffer.from(changes.attachedPicture.buffer).toString("base64"),
              mime: changes.attachedPicture.mime,
            }
          : album.attachedPicture
            ? album.attachedPicture
            : undefined,
    };

    const fya = albums.filter((a) => a.id !== albumId);
    fya.push(newAlbum);

    await saveConfig(
      {
        albums: fya,
      },
      windows
    );

    if (changes.fileFormatPath && newAlbum.fileFormatPathEnabled) {
      this.albumRenameFiles(newAlbum);
    }
  }
  public async addToAlbum({
    albumId,
    filePath,
  }: {
    albumId: string;
    filePath: string;
  }): Promise<void> {
    if (!albumId || !filePath) return;
    const db = await loadConfig();
    const albums = db.albums || [];
    const album = albums.find((a) => a.id === albumId);
    if (!album) return;

    const fileNode = findFileNodeByPath(this.fileTree, filePath);
    if (!fileNode) return;
    const file = fileNode.audioFile;
    if (!file) return;
    const release = tagManager.detectTagFormat(file.path);
    if (!release) return;
    const releaseClass = tagManager.getReleaseClass(release);
    if (!releaseClass) return;
    const tags = releaseClass.getTags(file.path);
    if (!tags) return;

    let hash: string | null | undefined = fileNode.hash;

    if (!hash) {
      hash = releaseClass.hashAudioStream(file.path);
    }
    if (!hash) return;
    const newAlbum = {
      ...album,
      hashes: [...album.hashes],
    };
    if (!newAlbum.hashes.includes(hash)) {
      newAlbum.hashes.push(hash);
    }
    const newAlb: UserConfig["albums"] = [];
    db.albums.forEach((a) => {
      const copy = { ...a };
      if (copy.hashes.includes(hash)) {
        copy.hashes = copy.hashes.filter((h) => h !== hash);
      }
      newAlb.push(copy);
    });
    releaseClass.writeTags(
      {
        ...tags,
        attachedPicture: album.attachedPicture && {
          buffer: Buffer.from(album.attachedPicture.buffer, "base64"),
          mime: album.attachedPicture.mime,
        },
        album: album.album,
        albumArtist: album.albumArtist,
        year: album.year,
        genre: album.genre,
        copyright: album.copyright,
      },
      file.path
    );
    const newAlbums = newAlb.map((a) => (a.id === albumId ? newAlbum : a));
    await saveConfig(
      {
        albums: newAlbums,
      },
      windows
    );
    this.sendUpdate(true);
  }
  public async removeFromAlbum({
    albumId,
    fileHash,
  }: {
    albumId: string;
    fileHash: string;
  }): Promise<void> {
    if (!albumId || !fileHash) return;
    const db = await loadConfig();
    const albums = db.albums || [];
    const album = albums.find((a) => a.id === albumId);
    if (!album) return;

    const newAlbum = {
      ...album,
      hashes: [...album.hashes],
    };
    newAlbum.hashes = newAlbum.hashes.filter((h) => h !== fileHash);

    const newAlbums = albums.filter((a) => a.id !== albumId);
    newAlbums.push(newAlbum);
    await saveConfig(
      {
        albums: newAlbums,
      },
      windows
    );
  }
  public async addFolderToAlbum({
    albumId,
    folderPath,
  }: {
    albumId: string;
    folderPath: string;
  }): Promise<void> {
    if (!albumId || !folderPath) return;
    const db = await loadConfig();
    const albums = db.albums || [];
    const album = albums.find((a) => a.id === albumId);
    if (!album) return;

    const fileNode = findFileNodeByPath(this.fileTree, folderPath);
    if (!fileNode) return;
    if (fileNode.type !== "directory") return;

    const newAlbum = {
      ...album,
      folder: folderPath,
    };

    const newAlb: UserConfig["albums"] = [];
    db.albums.forEach((a) => {
      const copy = { ...a };
      if (copy.folder && copy.folder === folderPath) {
        copy.folder = undefined;
      }

      newAlb.push(copy);
    });
    const newAlbums = newAlb.map((a) => (a.id === albumId ? newAlbum : a));
    await saveConfig(
      {
        albums: newAlbums,
      },
      windows
    );

    fileNode.children?.forEach((child) => {
      if (child.type === "file") {
        const release = tagManager.detectTagFormat(child.path);
        if (!release) return;
        const releaseClass = tagManager.getReleaseClass(release);
        if (!releaseClass) return;
        const tags = releaseClass.getTags(child.path);
        if (!tags) return;

        let hash: string | null | undefined = child.hash;

        if (!hash) {
          hash = releaseClass.hashAudioStream(child.path);
        }
        if (!hash) return;
        releaseClass.writeTags(
          {
            ...tags,
            attachedPicture: album.attachedPicture && {
              buffer: Buffer.from(album.attachedPicture.buffer, "base64"),
              mime: album.attachedPicture.mime,
            },
            album: album.album,
            albumArtist: album.albumArtist,
            year: album.year,
            genre: album.genre,
          },
          child.path
        );
      }
    });
  }
  public async removeFolderFromAlbum({
    albumId,
    folderPath,
  }: {
    albumId: string;
    folderPath: string;
  }): Promise<void> {
    if (!albumId || !folderPath) return;
    const db = await loadConfig();
    const albums = db.albums || [];
    const album = albums.find((a) => a.id === albumId);
    if (!album) return;

    const newAlbum = {
      ...album,
      folder: undefined,
    };

    const newAlbums = albums.filter((a) => a.id !== albumId);
    newAlbums.push(newAlbum);
    await saveConfig(
      {
        albums: newAlbums,
      },
      windows
    );
  }
  public async deleteAlbum({ albumId }: { albumId: string }): Promise<void> {
    if (!albumId) return;
    const db = await loadConfig();
    const albums = db.albums || [];
    const album = albums.find((a) => a.id === albumId);
    if (!album) return;

    const newAlbums = albums.filter((a) => a.id !== albumId);
    await saveConfig(
      {
        albums: newAlbums,
      },
      windows
    );
  }
  public async saveAlbum(album: Partial<Album>): Promise<void> {
    if (!album.album) return;
    const db = await loadConfig();
    const albums: Album[] = db.albums || [];
    let imgBuffer: Buffer | undefined = undefined;
    if (album.attachedPicture) {
      imgBuffer = Buffer.from(album.attachedPicture.buffer);
    }
    albums.push({
      album: album.album,
      albumArtist: album.albumArtist ?? "",
      hashes: [],
      fileFormatPathEnabled: album.fileFormatPathEnabled ?? false,
      fileFormatPath: album.fileFormatPath ?? "",
      copyright: album.copyright ?? "",
      year: album.year ?? "",
      genre: album.genre ?? "",
      id: uuidv4(),
      attachedPicture:
        album.attachedPicture && imgBuffer
          ? {
              buffer: imgBuffer.toString("base64"),
              mime: album.attachedPicture.mime,
            }
          : undefined,
    });
    await saveConfig(
      {
        albums: albums,
      },
      windows
    );
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
        }
      }
    } else if (ft === "file") {
      if (this.isSupportedFile(importPath)) {
        const file = importPath;
        const config = await this.getCachedDb();

        const release = tagManager.detectTagFormat(file);
        if (!release) return [];
        const releaseClass = tagManager.getReleaseClass(release);
        if (!releaseClass) return [];
        let tags = releaseClass.getTags(file);

        const hash = releaseClass.hashAudioStream(file);
        if (!hash) return [];
        if (!tags) return [];
        let newPath = file;

        for (const album of config.albums) {
          if (album.hashes.includes(hash)) {
            releaseClass.writeTags(
              {
                ...tags,
                attachedPicture: album.attachedPicture && {
                  buffer: Buffer.from(album.attachedPicture.buffer, "base64"),
                  mime: album.attachedPicture.mime,
                },
                album: album.album,
                albumArtist: album.albumArtist,
                year: album.year,
                genre: album.genre,
                copyright: album.copyright,
              },
              file
            );
            const newTags = releaseClass.getTags(file);
            if (!newTags) return [];
            tags = newTags;

            newPath = await this.renameAlbumFile(album, file, newTags);
          }
        }
        if (!recursion)
          this.fileTree.disorgainzed.set(importPath, {
            name: path.basename(importPath),
            path: newPath,
            type: "file",
            hash,
            audioFile: {
              ...tags,
              release,
              path: newPath,
              fileName: path.basename(importPath),
            },
          });
      }
    }
    if (!recursion) {
      this.startWatching();
      this.sendUpdate();
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
          const file = path.join(entry.parentPath, entry.name);

          const release = tagManager.detectTagFormat(file);
          if (!release) continue;
          const releaseClass = tagManager.getReleaseClass(release);
          if (!releaseClass) continue;
          let tags = releaseClass.getTags(file);
          const hash = releaseClass.hashAudioStream(file);
          if (!hash) continue;
          if (!tags) continue;
          let newPath = file;
          const config = await this.getCachedDb();
          for (const album of config.albums) {
            if (album.hashes.includes(hash) || album.folder === dirPath) {
              releaseClass.writeTags(
                {
                  ...tags,
                  attachedPicture: album.attachedPicture && {
                    buffer: Buffer.from(album.attachedPicture.buffer, "base64"),
                    mime: album.attachedPicture.mime,
                  },
                  album: album.album,
                  albumArtist: album.albumArtist,
                  year: album.year,
                  genre: album.genre,
                  copyright: album.copyright,
                },
                file
              );
              const newTags = releaseClass.getTags(file);
              if (!newTags) break;
              tags = newTags;
            }
          }

          item.children.set(fullPath, {
            name: entry.name,
            path: newPath,
            hash,
            type: "file",
            audioFile: { ...tags, release, path: newPath, fileName: entry.name },
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

  public async sendUpdate(reloadFiles: boolean = false): Promise<void> {
    if (reloadFiles) {
      const treeCopy = {
        organized: new Map(this.fileTree.organized),
        disorgainzed: new Map(this.fileTree.disorgainzed),
      };
      this.resetTree();
      for (const tree of [treeCopy.organized, treeCopy.disorgainzed]) {
        const fileNodes = Array.from(tree.values());
        for (const fileNode of fileNodes) {
          await this.import(fileNode.path);
        }
      }
    }
    const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);

    mainWindow?.webContents.send(Constants.channels.UPDATE, this.fileTree, this.updatedPathsArray);
    this.updatedPathsArray = [];
  }
  public async startWatching(opts?: { path: string; isDir: boolean }): Promise<void> {
    if (!opts) {
      for (const [pathName] of this.fileTree.organized) {
        if (!this.watchers.get(pathName) && !this.watchers.has(path.dirname(pathName))) {
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
        if (!this.watchers.get(filePath) && !this.watchers.has(path.dirname(filePath))) {
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
      if (!this.watchers.get(opts.path) && !this.watchers.has(path.dirname(str))) {
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
  private parseVariables(str: string, tags: Tags): string {
    return str.replace(/\{(\w+)\}/g, (_, key) => {
      if (key === "attachedPicture") return `{${key}}`;
      return tags[key] ?? `{${key}}`;
    });
  }
  private async getAvailabeFileName(filePath: string): Promise<string> {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);

    let attempt = 0;
    let candidate = filePath;

    while (await fs.pathExists(candidate)) {
      attempt += 1;
      candidate = path.join(dir, `${baseName} (${attempt})${ext}`);
    }

    return candidate;
  }
  private async renameAlbumFile(album: Album, filePath: string, tags: Tags): Promise<string> {
    try {
      if (!album.fileFormatPathEnabled || !album.fileFormatPath) return filePath;

      const fileExtension = path.extname(filePath);

      if (!tags) return filePath;

      const newFileName = this.parseVariables(album.fileFormatPath, tags);
      const newFP = path.join(path.dirname(filePath), `${newFileName}${fileExtension}`);

      if (newFP === filePath) return filePath;
      let newFilePath = await this.getAvailabeFileName(newFP);
      if (!isValidFileName(path.basename(newFilePath))) {
        newFilePath = await this.getAvailabeFileName(
          path.join(path.dirname(newFilePath), `invalid_config${fileExtension}`)
        );
        if (!isValidFileName(path.basename(newFilePath))) return filePath;
      }

      if (!(await fs.pathExists(filePath))) {
        return filePath;
      }

      await fs.rename(filePath, newFilePath);

      return newFilePath;
    } catch (error) {
      console.error("Error renaming file:", error);
      return filePath;
    }
  }
  private async albumRenameFiles(album: Album): Promise<void> {
    if (!album.fileFormatPathEnabled || !album.fileFormatPath) return;

    if (album.folder) {
      const folderNode = findFileNodeByPath(this.fileTree, album.folder);
      if (!folderNode || folderNode.type !== "directory") return;
      if (!folderNode.children) return;
      for (const child of folderNode.children.values()) {
        if (child.type !== "file") continue;
        await this.renameAlbumFile(album, child.path, child.audioFile!);
      }
    }
    for (const hash of album.hashes) {
      const fileNode = findFileNodeByPath(this.fileTree, hash);
      if (!fileNode || fileNode.type !== "file") continue;
      if (path.dirname(fileNode.path) === album.folder) continue;
      await this.renameAlbumFile(album, fileNode.path, fileNode.audioFile!);
    }
    this.sendUpdate(true);
  }
  public async rename(conf: WorkspaceAction): Promise<void> {
    try {
      const oldPath = conf.path;
      const newPath = path.join(path.dirname(oldPath), conf.str);
      if (!isValidFileName(newPath)) return;
      await fs.rename(oldPath, newPath);

      const isDir = (await this.checkFileType(newPath)) === "directory";

      const updatePathsRecursive = (node: FileNode, oldBase: string, newBase: string): FileNode => {
        const relative = path.relative(oldBase, node.path);
        const updatedPath = path.join(newBase, relative);
        const updatedName = path.basename(updatedPath);

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

  private updateFileTreeNode(oldPath: string, newPath: string, updatedNode: FileNode): void {
    const updateInTree = (tree: Map<string, FileNode>): boolean => {
      if (tree.has(oldPath)) {
        tree.delete(oldPath);
        tree.set(newPath, updatedNode);
        return true;
      }

      for (const node of tree.values()) {
        if (node.type === "directory" && node.children) {
          if (updateInTree(node.children)) {
            return true;
          }
        }
      }
      return false;
    };

    const hasUpdated = updateInTree(this.fileTree.disorgainzed);
    if (hasUpdated) return;

    updateInTree(this.fileTree.organized);
  }
  public async saveChanges(ch: Partial<Changes>): Promise<void> {
    if (!ch.paths || ch.paths.length === 0) return;

    const updatedPaths = new Map<string, { node: FileNode; newPath: string }>();

    for (const targetPath of ch.paths) {
      const node = findFileNodeByPath(this.fileTree, targetPath);

      if (!node || node.type !== "file" || !node.audioFile || !node.hash) continue;
      const hash = node.hash;

      const releaseClass = tagManager.getReleaseClass(node.audioFile.release);
      if (!releaseClass) continue;

      let tags = releaseClass.getTags(targetPath);
      if (!tags) continue;

      tags = {
        ...tags,
        ...ch,
      };

      let currentPath = targetPath;
      let isInAlbum = false;

      const config = await this.getCachedDb();
      for (const album of config.albums) {
        if (album.hashes.includes(hash) || album.folder === path.dirname(targetPath)) {
          isInAlbum = true;

          releaseClass.writeTags(
            {
              ...tags,
              attachedPicture: album.attachedPicture && {
                buffer: Buffer.from(album.attachedPicture.buffer, "base64"),
                mime: album.attachedPicture.mime,
              },
              album: album.album,
              albumArtist: album.albumArtist,
              year: album.year,
              genre: album.genre,
              copyright: album.copyright,
            },
            currentPath
          );

          const newTags = releaseClass.getTags(currentPath);
          if (!newTags) break;

          const newPath = await this.renameAlbumFile(album, currentPath, newTags);
          tags = newTags;
          if (newPath !== currentPath) {
            currentPath = newPath;
          }
          break;
        }
      }

      if (!isInAlbum) {
        releaseClass.writeTags({ ...tags }, currentPath);
      }

      updatedPaths.set(targetPath, {
        node,
        newPath: currentPath,
      });
    }

    for (const [oldPath, update] of updatedPaths.entries()) {
      this.updatedPathsArray.push({ oldPath, newPath: update.newPath });
      await this.stopWatching(oldPath);

      this.updateFileTreeNode(oldPath, update.newPath, {
        ...update.node,
        path: update.newPath,
        name: path.basename(update.newPath),
        audioFile: {
          ...update.node.audioFile!,
          path: update.newPath,
          fileName: path.basename(update.newPath),
        },
      });

      await this.startWatching();
    }

    await this.sendUpdate();
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
    return [".mp3", ".m4a", "mp4"].includes(ext);
  }
}
