import { clsx, type ClassValue } from "clsx";
import { path } from "@tauri-apps/api";

import { twMerge } from "tailwind-merge";
import { FileNode } from "../types";

export function parseShortcut(shortcut: string) {
  shortcut = shortcut.replace(
    "mod",
    navigator.platform.includes("Mac") ? "⌘" : "Ctrl",
  );
  shortcut = shortcut.replace("cmd", "⌘");
  shortcut = shortcut.replace("ctrl", "Ctrl");
  shortcut = shortcut.replace("alt", "Alt");
  shortcut = shortcut.replace("shift", "Shift");
  return shortcut;
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const illegalCharacters = /[\\/:*?"<>|]/;
const reservedFileNames = [
  "CON",
  "PRN",
  "AUX",
  "NUL",
  ...Array.from({ length: 9 }, (_, i) => `COM${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `LPT${i + 1}`),
];

export function isValidFileName(
  name: string,
  ignoreMaxChar: boolean,
): { err: boolean; message?: string } {
  if (!name || name.trim().length === 0) {
    return { err: true, message: "File name cannot be empty." };
  }

  if (illegalCharacters.test(name)) {
    return { err: true, message: "File name contains illegal characters." };
  }

  if (name.endsWith(" ") || name.endsWith(".")) {
    return {
      err: true,
      message: "File name cannot end with a space or period.",
    };
  }

  const baseName = name.split(".")[0].toUpperCase();
  if (reservedFileNames.includes(baseName)) {
    return {
      err: true,
      message: `File name '${baseName}' is reserved by the system.`,
    };
  }

  if (name.length > 255 && !ignoreMaxChar) {
    return {
      err: true,
      message: "File name is too long (max 255 characters).",
    };
  }

  return { err: false };
}

export async function buildFileTree(files: string[]): Promise<FileNode[]> {
  const tree: FileNode[] = [];
  const pathMap: Record<string, FileNode> = {};
  for (const filePath of files) {
    const segments = filePath.split(path.sep());
    let currentLevel = tree;
    let currentPath = "";
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath = currentPath
        ? await path.join(currentPath, segment)
        : segment;

      let node = pathMap[currentPath];
      if (!node) {
        node = {
          name: segment,
          type: "directory",
          children: [],
          path: currentPath,
        };
        pathMap[currentPath] = node;
        currentLevel.push(node);
      }

      if (i < segments.length - 1) {
        if (!node.children) {
          node.children = [];
        }
        currentLevel = node.children;
      }
    }
  }

  return tree;
}
interface FileTreeNode {
  name: string;
  children?: FileTreeNode[];
}
