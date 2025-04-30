import { clsx, type ClassValue } from "clsx";
import { FileNode } from "src/types";
import { twMerge } from "tailwind-merge";

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
export function findFileNodeByPath(
  tree: { organized: Map<string, FileNode>; disorgainzed: Map<string, FileNode> },
  id: string
): FileNode | null {
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

  return search(tree.organized) || search(tree.disorgainzed);
}
