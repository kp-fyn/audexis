import { clsx, type ClassValue } from "clsx";

import { twMerge } from "tailwind-merge";
import { Extended, TagOption, FileNode } from "../types/index";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getAllColumns(): { value: string; label: string }[] {
  return [
    { value: "path", label: "Path" },
    { value: "release", label: "Tag Manager" },
    { value: "fileName", label: "File Name" },
    { value: "title", label: "Title" },
    { value: "artist", label: "Artist" },
    { value: "album", label: "Album" },
    { value: "year", label: "Year" },
    { value: "trackNumber", label: "Track Number" },
    { value: "genre", label: "Genre" },
    { value: "albumArtist", label: "Album Artist" },
    { value: "contentGroup", label: "Content Group" },
    { value: "composer", label: "Composer" },
    { value: "encodedBy", label: "Encoded By" },
    { value: "unsyncedLyrics", label: "Unsynced Lyrics" },
    { value: "length", label: "Length" },
    { value: "conductor", label: "Conductor" },
    { value: "attachedPicture", label: "Attached Picture" },
    { value: "userDefinedURL", label: "User Defined URL" },
    { value: "comments", label: "Comments" },
    { value: "private", label: "Private" },
    { value: "relativeVolumeAdjustment", label: "Relative Volume Adjustment" },
    { value: "encryptionMethod", label: "Encryption Method" },
    { value: "groupIdRegistration", label: "Group Id Registration" },
    { value: "generalObject", label: "General Object" },
    { value: "commercialURL", label: "Commercial URL" },
    { value: "copyrightURL", label: "Copyright URL" },
    { value: "audioFileURL", label: "Audio File URL" },
    { value: "artistURL", label: "Artist URL" },
    { value: "radioStationURL", label: "Radio Station URL" },
    { value: "paymentURL", label: "Payment URL" },
    { value: "bitmapImageURL", label: "Bitmap Image URL" },
    { value: "userDefinedText", label: "User Defined Text" },
    { value: "synchronizedLyrics", label: "Synchronized Lyrics" },
    { value: "tempoCodes", label: "Tempo Codes" },
    { value: "musicCDIdentifier", label: "Music CD Identifier" },
    { value: "eventTimingCodes", label: "Event Timing Codes" },
    { value: "sequence", label: "Sequence" },
    { value: "playCount", label: "Play Count" },
    { value: "audioSeekPointIndex", label: "Audio Seek Point Index" },
    { value: "mediaType", label: "Media Type" },
    { value: "commercialFrame", label: "Commercial Frame" },
    { value: "audioEncryption", label: "Audio Encryption" },
    { value: "signatureFrame", label: "Signature Frame" },
    { value: "softwareEncoder", label: "Software Encoder" },
    { value: "audioEncodingMethod", label: "Audio Encoding Method" },
    { value: "recommendedBufferSize", label: "Recommended Buffer Size" },
    { value: "beatsPerMinute", label: "Beats Per Minute" },
    { value: "language", label: "Language" },
    { value: "fileType", label: "File Type" },
    { value: "time", label: "Time" },
    { value: "recordingDate", label: "Recording Date" },
    { value: "releaseDate", label: "Release Date" },
  ];
}
export function getAlbumTags(): {
  value: string;
  label: string;
  type: "input" | "img";
}[] {
  return [
    { value: "album", label: "Album Name", type: "input" },
    { value: "albumArtist", label: "Album Artist", type: "input" },
    { value: "attachedPicture", label: "Album Cover", type: "img" },
    { value: "copyright", label: "Copyright", type: "input" },
    { value: "year", label: "Released", type: "input" },
    { value: "genre", label: "Genre", type: "input" },
  ];
}
export function findFileNodeByPath(
  fileTree: {
    organized: Map<string, FileNode>;
    disorgainzed: Map<string, FileNode>;
  },
  id: string,
): FileNode | null {
  const tree = new Map([...fileTree.organized, ...fileTree.disorgainzed]);
  const search = (nodes: Map<string, FileNode>): FileNode | null => {
    for (const node of nodes.values()) {
      if (node.path === id) return node;
      if (node.type === "directory" && node.children) {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  return search(tree);
}

export function findAudiofilebyHash(
  fileTree: {
    organized: Map<string, FileNode>;
    disorgainzed: Map<string, FileNode>;
  },
  hash: string,
): Extended | null {
  const tree = new Map([...fileTree.organized, ...fileTree.disorgainzed]);
  const search = (nodes: Map<string, FileNode>): Extended | null => {
    for (const node of nodes.values()) {
      if (node.type === "file" && node.audioFile && node.hash === hash) {
        return {
          ...node.audioFile,
          hash: node.hash,
        };
      }
      if (node.type === "directory" && node.children) {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  return search(tree);
}

export function getAudioFiles(tree: Map<string, FileNode>): FileNode[] {
  const audioFiles: FileNode[] = [];

  const traverse = (node: FileNode): void => {
    if (node.type === "file" && node.audioFile) {
      audioFiles.push(node);
    }

    if (node.type === "directory" && node.children) {
      for (const child of node.children.values()) {
        traverse(child);
      }
    }
  };

  for (const node of tree.values()) {
    traverse(node);
  }

  return audioFiles;
}

const tagOptions: TagOption[] = [
  { label: "Title", value: "title" },
  { label: "Artist", value: "artist" },
  { label: "Album", value: "album" },
  { label: "Year", value: "year" },
  { label: "Track Number", value: "trackNumber" },
  { label: "Genre", value: "genre" },
  { label: "Album Artist", value: "albumArtist" },
  { label: "Content Group", value: "contentGroup" },
  { label: "Composer", value: "composer" },
  { label: "Encoded By", value: "encodedBy" },
  { label: "Unsynced Lyrics", value: "unsyncedLyrics" },
  { label: "Length", value: "length" },
  { label: "Conductor", value: "conductor" },
  { label: "User Defined URL", value: "userDefinedURL" },
  { label: "Comments", value: "comments" },
  { label: "Private", value: "private" },
  { label: "Relative Volume Adjustment", value: "relativeVolumeAdjustment" },
  { label: "Encryption Method", value: "encryptionMethod" },
  { label: "Group ID Registration", value: "groupIdRegistration" },
  { label: "General Object", value: "generalObject" },
  { label: "Commercial URL", value: "commercialURL" },
  { label: "Copyright URL", value: "copyrightURL" },
  { label: "Audio File URL", value: "audioFileURL" },
  { label: "Artist URL", value: "artistURL" },
  { label: "Radio Station URL", value: "radioStationURL" },
  { label: "Payment URL", value: "paymentURL" },
  { label: "Bitmap Image URL", value: "bitmapImageURL" },
  { label: "User Defined Text", value: "userDefinedText" },
  { label: "Synchronized Lyrics", value: "synchronizedLyrics" },
  { label: "Tempo Codes", value: "tempoCodes" },
  { label: "Copyright", value: "copyright" },
  { label: "Music CD Identifier", value: "musicCDIdentifier" },
  { label: "Event Timing Codes", value: "eventTimingCodes" },
  { label: "Sequence", value: "sequence" },
  { label: "Play Count", value: "playCount" },
  { label: "Audio Seek Point Index", value: "audioSeekPointIndex" },
  { label: "Media Type", value: "mediaType" },
  { label: "Commercial Frame", value: "commercialFrame" },
  { label: "Audio Encryption", value: "audioEncryption" },
  { label: "Signature Frame", value: "signatureFrame" },
  { label: "Software Encoder", value: "softwareEncoder" },
  { label: "Audio Encoding Method", value: "audioEncodingMethod" },
  { label: "Recommended Buffer Size", value: "recommendedBufferSize" },
  { label: "Beats Per Minute", value: "beatsPerMinute" },
  { label: "Language", value: "language" },
  { label: "File Type", value: "fileType" },
  { label: "Time", value: "time" },
  { label: "Recording Date", value: "recordingDate" },
  { label: "Release Date", value: "releaseDate" },
];
export { tagOptions };

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
