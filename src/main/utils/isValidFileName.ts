const illegalCharacters = /[\\/:*?"<>|]/;
const reservedFileNames = [
  "CON",
  "PRN",
  "AUX",
  "NUL",
  ...Array.from({ length: 9 }, (_, i) => `COM${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `LPT${i + 1}`),
];

export function isValidFileName(name: string, ignoreMaxChar = false): boolean {
  if (!name || name.trim().length === 0) {
    return false;
  }

  if (illegalCharacters.test(name)) {
    return false;
  }

  if (name.endsWith(" ") || name.endsWith(".")) {
    return false;
  }

  const baseName = name.split(".")[0].toUpperCase();
  if (reservedFileNames.includes(baseName)) {
    return false;
  }

  if (name.length > 255 && !ignoreMaxChar) {
    return false;
  }

  return true;
}
