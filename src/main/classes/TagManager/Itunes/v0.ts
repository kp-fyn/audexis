/* eslint-disable no-control-regex */
//took me a week to understand this dumb  ilst ting
// helpful links for m4a
//https://ahyattdev.github.io/blog/2018/02/17/m4a-metadata-structure.html
//https://atomicparsley.sourceforge.net/mpeg-4files.html
//https://github.com/ahyattdev/M4ATools/blob/master/Sources/M4ATools/Metadata.swift
//https://github.com/sergiomb2/libmp4v2/wiki/iTunesMetadata
// I don't want to open this file again

import { itunesReverseMapping, itunesTags } from "../../../utils/Itunes";
import { ImgData, Tags } from "../../../../types";

import fs from "node:fs";
import { TagFormatRelease } from "../abstractions";

type ItunesFrames = {
  [key: string]: string | ImgData;
};
type RawItunesFrames = {
  [key: string]: string | Buffer;
};

const atomsWFlag = [
  {
    name: "©alb",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "©ART",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "aART",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "©cmt",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "©day",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "©nam",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "©gen",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "gnre",
    flag: [0x00, 0x00, 0x00, 0x00],
  },
  {
    name: "trkn",
    flag: [0x00, 0x00, 0x00, 0x00],
  },
  {
    name: "disk",
    flag: [0x00, 0x00, 0x00, 0x00],
  },
  {
    name: "©wrt",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "©too",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "tmpo",
    flag: [0x00, 0x00, 0x00, 0x15],
  },
  {
    name: "cprt",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "cpil",
    flag: [0x00, 0x00, 0x00, 0x15],
    boolean: true,
  },
  {
    name: "covr",
    flag: [0x00, 0x00, 0x00, 0x0e],
  },
  {
    name: "rtng",
    flag: [0x00, 0x00, 0x00, 0x15],
  },
  {
    name: "©grp",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "stik",
    flag: [0x00, 0x00, 0x00, 0x15],
  },
  {
    name: "pcst",
    flag: [0x00, 0x00, 0x00, 0x15],
    boolean: true,
  },
  {
    name: "catg",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "keyw",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "purl",
    flag: [0x00, 0x00, 0x00, 0x15],
  },
  {
    name: "egid",
    flag: [0x00, 0x00, 0x00, 0x15],
  },
  {
    name: "desc",
    flag: [0x00, 0x00, 0x00, 0x01],
    noSizeLimit: true,
  },

  {
    name: "©lyr",
    flag: [0x00, 0x00, 0x00, 0x01],
    noSizeLimit: true,
  },
  {
    name: "tvnn",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "tvsh",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "tven",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "tvsn",
    flag: [0x00, 0x00, 0x00, 0x15],
    size: 32,
  },
  {
    name: "tves",
    flag: [0x00, 0x00, 0x00, 0x15],
    size: 32,
  },
  {
    name: "purd",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "apID",
    flag: [0x00, 0x00, 0x00, 0x01],
  },
  {
    name: "pgap",
    flag: [0x00, 0x00, 0x00, 0x15],
    boolean: true,
  },
  {
    name: "akID",
    flag: [0x00, 0x00, 0x00, 0x15],
  },
  {
    name: "cnID",
    flag: [0x00, 0x00, 0x00, 0x15],
    size: 32,
  },
  {
    name: "atID",
    flag: [0x00, 0x00, 0x00, 0x15],
    size: 32,
  },
  {
    name: "sfID",
    flag: [0x00, 0x00, 0x00, 0x15],
    size: 32,
  },
  {
    name: "atID",
    flag: [0x00, 0x00, 0x00, 0x15],
    size: 32,
  },
  {
    name: "geID",
    flag: [0x00, 0x00, 0x00, 0x15],
    size: 32,
  },
  {
    name: "plID",
    flag: [0x00, 0x00, 0x00, 0x15],
    size: 64,
  },
];

export default class Itunes extends TagFormatRelease {
  constructor() {
    super();
  }
  clearTags(filePath: string): void {
    this.ensureIlst(filePath);

    const fileBuffer = fs.readFileSync(filePath);

    if (!fileBuffer) return;

    const ilstAtom = this.getIlstAtom(fileBuffer);

    if (!ilstAtom) return;

    const updatedIlst = this.encodeIlst({}, [], fileBuffer);

    if (!updatedIlst) return;

    const newFile = this.rebuildM4AFile(fileBuffer, updatedIlst);

    if (!newFile) return;

    fs.writeFileSync(filePath, newFile);
  }
  writeTags(tags: Partial<Tags>, filePath: string): void {
    const realTags: Record<string, string | Buffer | ImgData> = {};

    for (const key in tags) {
      if (!tags[key as keyof Tags]) continue;

      if (key === "attachedPicture") {
        const imageData = tags[key] as ImgData;

        if (!imageData.buffer) continue;

        realTags[key] = imageData;
      } else {
        realTags[key] = tags[key as keyof Tags] as string;
      }
    }

    const fileBuffer = fs.readFileSync(filePath);

    if (!fileBuffer) return;

    this.ensureIlst(filePath);
    const ilstAtom = this.getIlstAtom(fileBuffer);

    if (!ilstAtom) return;

    const ilstSubAtoms = this.parseAtoms(fileBuffer, ilstAtom.position + 8, ilstAtom.size - 8);
    const originalTags = this.getMetadata(fileBuffer, ilstSubAtoms, false);
    const rawTags = { ...originalTags, ...this.tagsToRaw(realTags) };

    if (!rawTags) return;

    const updatedIlst = this.encodeIlst(
      rawTags as Record<string, string | ImgData | number | Buffer>,
      ilstSubAtoms,
      fileBuffer
    );

    if (!updatedIlst) return;

    const newFile = this.rebuildM4AFile(fileBuffer, updatedIlst);

    if (!newFile) return;

    fs.writeFileSync(filePath, newFile);
  }

  private findStcoAtom(buffer: Buffer, moovAtom: Atom): Atom[] | null {
    const trakAtoms = this.parseAtoms(buffer, moovAtom.position + 8, moovAtom.size - 8).filter(
      (atom) => atom.type === "trak"
    );

    const stcoAtoms: Atom[] = [];
    for (const trak of trakAtoms) {
      const mdia = this.parseAtoms(buffer, trak.position + 8, trak.size - 8).find(
        (atom) => atom.type === "mdia"
      );
      if (!mdia) continue;

      const minf = this.parseAtoms(buffer, mdia.position + 8, mdia.size - 8).find(
        (atom) => atom.type === "minf"
      );
      if (!minf) continue;

      const stbl = this.parseAtoms(buffer, minf.position + 8, minf.size - 8).find(
        (atom) => atom.type === "stbl"
      );
      if (!stbl) continue;

      const stco = this.parseAtoms(buffer, stbl.position + 8, stbl.size - 8).find(
        (atom) => atom.type === "stco"
      );
      if (stco) {
        stcoAtoms.push(stco);
      }
    }

    if (stcoAtoms.length) return stcoAtoms;

    return null;
  }

  private findCo64Atom(buffer: Buffer, moovAtom: Atom): Atom[] | null {
    const co64Atoms: Atom[] = [];
    const trakAtoms = this.parseAtoms(buffer, moovAtom.position + 8, moovAtom.size - 8).filter(
      (atom) => atom.type === "trak"
    );

    for (const trak of trakAtoms) {
      const mdia = this.parseAtoms(buffer, trak.position + 8, trak.size - 8).find(
        (atom) => atom.type === "mdia"
      );
      if (!mdia) continue;

      const minf = this.parseAtoms(buffer, mdia.position + 8, mdia.size - 8).find(
        (atom) => atom.type === "minf"
      );
      if (!minf) continue;

      const stbl = this.parseAtoms(buffer, minf.position + 8, minf.size - 8).find(
        (atom) => atom.type === "stbl"
      );
      if (!stbl) continue;

      const stco = this.parseAtoms(buffer, stbl.position + 8, stbl.size - 8).find(
        (atom) => atom.type === "co64"
      );

      if (stco) {
        co64Atoms.push(stco);
      }
    }
    if (co64Atoms.length) return co64Atoms;

    return null;
  }

  private ensureIlst(filePath: string): void {
    const buffer = fs.readFileSync(filePath);

    if (!buffer) return;

    const atoms = this.parseAtoms(buffer);
    const moovAtom = atoms.find((atom) => atom.type === "moov");

    if (!moovAtom) return;

    const moovSubAtoms = this.parseAtoms(buffer, moovAtom.position + 8, moovAtom.size - 8);
    const udtaAtom = moovSubAtoms.find((atom) => atom.type === "udta");

    let metaAtom: Atom | undefined;
    let ilstAtom: Atom | undefined;

    if (udtaAtom) {
      const udtaSubAtoms = this.parseAtoms(buffer, udtaAtom.position + 8, udtaAtom.size - 8);

      metaAtom = udtaSubAtoms.find((atom) => atom.type === "meta");
    }

    if (metaAtom) {
      const metaSubAtoms = this.parseAtoms(buffer, metaAtom.position + 12, metaAtom.size - 12);

      ilstAtom = metaSubAtoms.find((atom) => atom.type === "ilst");
    }

    if (ilstAtom) return;

    const emptyIlst = Buffer.alloc(8);

    emptyIlst.writeUInt32BE(8, 0);
    emptyIlst.write("ilst", 4, 4, "ascii");

    let newMetaBuffer: Buffer;

    if (!metaAtom) {
      const emptyMeta = Buffer.alloc(12);
      emptyMeta.writeUInt32BE(12, 0);
      emptyMeta.write("meta", 4, 4, "ascii");
      emptyMeta.writeUInt32BE(0, 8);

      newMetaBuffer = Buffer.concat([emptyMeta, emptyIlst]);
      newMetaBuffer.writeUInt32BE(newMetaBuffer.length, 0);
    } else {
      const metaBuffer = buffer.subarray(metaAtom.position, metaAtom.position + metaAtom.size);
      newMetaBuffer = Buffer.concat([metaBuffer.subarray(0, metaBuffer.length), emptyIlst]);
      newMetaBuffer.writeUInt32BE(newMetaBuffer.length, 0);
    }

    let newUdtaBuffer: Buffer;
    if (!udtaAtom) {
      const emptyUdta = Buffer.alloc(8);
      emptyUdta.writeUInt32BE(8 + newMetaBuffer.length, 0);
      emptyUdta.write("udta", 4, 4, "ascii");

      newUdtaBuffer = Buffer.concat([emptyUdta, newMetaBuffer]);
    } else {
      const udtaContent = buffer.subarray(udtaAtom.position + 8, udtaAtom.position + udtaAtom.size);

      const newBuff = Buffer.concat([udtaContent, newMetaBuffer]);
      const emptyUdta = Buffer.alloc(8);

      emptyUdta.write("udta", 4, 4, "ascii");

      newUdtaBuffer = Buffer.concat([emptyUdta, newBuff]);
      newUdtaBuffer.writeUInt32BE(newUdtaBuffer.length, 0);
    }

    const moovSub = moovSubAtoms.filter((atom) => atom.type !== "udta");
    const mooovSubBuffers = moovSub.map((atom) => atom.buffer);
    const oldMoovAtomWithOutUdta = Buffer.concat(mooovSubBuffers);

    const newMoovBuffer = Buffer.concat([
      buffer.subarray(moovAtom.position, moovAtom.position + 8),
      oldMoovAtomWithOutUdta,
      newUdtaBuffer,
    ]);
    newMoovBuffer.writeUInt32BE(newMoovBuffer.length, 0);

    const newBuffer = Buffer.concat([
      buffer.subarray(0, moovAtom.position),
      newMoovBuffer,
      buffer.subarray(moovAtom.position + moovAtom.size),
    ]);
    const shift = newMoovBuffer.length - moovAtom.size;

    const newAtoms = this.parseAtoms(newBuffer);

    const newMoovAtom = newAtoms.find((atom) => atom.type === "moov");

    if (!newMoovAtom) return;
    const stcoAtom = this.findStcoAtom(newBuffer, newMoovAtom);
    let updatedBuffer: Buffer | undefined;
    const co64Atom = this.findCo64Atom(newBuffer, newMoovAtom);

    if (stcoAtom) {
      updatedBuffer = this.updateStcoOffsets(newBuffer, shift, stcoAtom);
    } else {
      if (co64Atom) {
        updatedBuffer = this.updateCo64Offsets(newBuffer, shift, co64Atom);
      }
    }
    if (!updatedBuffer) return;
    const Atoms = this.parseAtoms(updatedBuffer);
    const newMoovAtoms = Atoms.find((atom) => atom.type === "moov");
    if (!newMoovAtoms) return;
    const newMoovSubAtoms = this.parseAtoms(
      updatedBuffer,
      newMoovAtoms.position + 8,
      newMoovAtoms.size - 8
    );
    const newUdtaAtom = newMoovSubAtoms.find((atom) => atom.type === "udta");
    if (!newUdtaAtom) return;

    //   oldSz: moovAtom.size,
    //   newUdtaContent: newUdtaAtom.buffer.toString(),
    //   oldUdta: udtaAtom,
    //   oldUdtaContent: buffer
    //     .subarray(udtaAtom.position, udtaAtom.position + udtaAtom.size)
    //     .toString(),

    //   newAtoms: Atoms,
    //   oldAtoms: atoms,
    //   newMoovSubAtoms,
    //   oldMoovSubAtoms: moovSubAtoms,
    // });

    fs.writeFileSync(filePath, updatedBuffer);

    return;
  }

  private updateCo64Offsets(buffer: Buffer, shift: number, co64Atoms: Atom[]): Buffer {
    let buff = buffer;
    for (const co64Atom of co64Atoms) {
      if (!co64Atom) continue;

      const co64Buffer = buff.subarray(co64Atom.position, co64Atom.position + co64Atom.size);
      const entryCount = co64Buffer.readUInt32BE(12);
      const updatedCo64Buffer = Buffer.from(co64Buffer);

      for (let i = 0; i < entryCount; i++) {
        const offsetPosition = 16 + i * 8;
        const oldOffset = updatedCo64Buffer.readBigUInt64BE(offsetPosition);
        updatedCo64Buffer.writeBigUInt64BE(oldOffset + BigInt(shift), offsetPosition);
      }

      buff = Buffer.concat([
        buff.subarray(0, co64Atom.position),
        updatedCo64Buffer,
        buff.subarray(co64Atom.position + co64Atom.size),
      ]);
    }
    return buff;
  }

  private updateStcoOffsets(buffer: Buffer, shift: number, stcoAtoms: Atom[]): Buffer {
    let buff = buffer;

    for (const stcoAtom of stcoAtoms) {
      if (!stcoAtom) continue;

      const stcoBuffer = buff.subarray(stcoAtom.position, stcoAtom.position + stcoAtom.size);
      const entryCount = stcoBuffer.readUInt32BE(12);
      const updatedStcoBuffer = Buffer.from(stcoBuffer);

      for (let i = 0; i < entryCount; i++) {
        const offsetPosition = 16 + i * 4;
        const oldOffset = updatedStcoBuffer.readUInt32BE(offsetPosition);
        updatedStcoBuffer.writeUInt32BE(oldOffset + shift, offsetPosition);
      }

      buff = Buffer.concat([
        buff.subarray(0, stcoAtom.position),
        updatedStcoBuffer,
        buff.subarray(stcoAtom.position + stcoAtom.size),
      ]);
    }

    return buff;
  }

  private rebuildM4AFile(buffer: Buffer, updatedIlst: Buffer): Buffer | null {
    const atoms = this.parseAtoms(buffer);
    if (!atoms.length) return null;

    const moovAtom = atoms.find((atom) => atom.type === "moov");

    if (!moovAtom) return null;

    const moovBuffer = buffer.subarray(moovAtom.position, moovAtom.position + moovAtom.size);

    const moovSubAtoms = this.parseAtoms(buffer, moovAtom.position + 8, moovAtom.size - 8);

    const udtaAtom = moovSubAtoms.find((atom) => atom.type === "udta");

    if (!udtaAtom) return null;
    const udtaSubAtoms = this.parseAtoms(buffer, udtaAtom.position + 8, udtaAtom.size - 8);
    const metaAtom = udtaSubAtoms.find((atom) => atom.type === "meta");
    if (!metaAtom) return null;
    const metaSubAtoms = this.parseAtoms(buffer, metaAtom.position + 12, metaAtom.size - 12);
    const ilstAt = metaSubAtoms.find((atom) => atom.type === "ilst");
    if (!ilstAt) return null;

    const metaBuffer = buffer.subarray(metaAtom.position, metaAtom.position + metaAtom.size);
    const newMetaBuffer = Buffer.concat([
      metaBuffer.subarray(0, ilstAt.position - metaAtom.position),
      updatedIlst,
      metaBuffer.subarray(ilstAt.position + ilstAt.size - metaAtom.position, metaBuffer.length),
    ]);

    newMetaBuffer.writeUInt32BE(newMetaBuffer.length, 0);
    const udtaBuffer = buffer.subarray(udtaAtom.position, udtaAtom.position + udtaAtom.size);
    const newUdtaBuffer = Buffer.concat([
      udtaBuffer.subarray(0, metaAtom.position - udtaAtom.position),
      newMetaBuffer,
      udtaBuffer.subarray(metaAtom.position + metaAtom.size - udtaAtom.position, udtaBuffer.length),
    ]);

    newUdtaBuffer.writeUInt32BE(newUdtaBuffer.length, 0);
    const newMoovBuffer = Buffer.concat([
      moovBuffer.subarray(0, udtaAtom.position - moovAtom.position),
      newUdtaBuffer,
      moovBuffer.subarray(udtaAtom.position + udtaAtom.size - moovAtom.position, moovBuffer.length),
    ]);
    newMoovBuffer.writeUInt32BE(newMoovBuffer.length, 0);
    const ilstAtom = this.getIlstAtom(buffer);
    if (!ilstAtom) return null;

    const ez = Buffer.concat([
      buffer.subarray(0, moovAtom.position),
      newMoovBuffer,
      buffer.subarray(moovAtom.position + moovAtom.size),
    ]);

    const newAtoms = this.parseAtoms(ez);
    const newMoovAtom = newAtoms.find((atom) => atom.type === "moov");
    if (!newMoovAtom) return null;
    const stcoAtom = this.findStcoAtom(ez, newMoovAtom);

    const co64Atom = this.findCo64Atom(ez, newMoovAtom);
    let newBuff: Buffer = ez;
    if (co64Atom) {
      newBuff = this.updateCo64Offsets(ez, newMoovAtom.size - moovAtom.size, co64Atom);
    }
    if (stcoAtom) {
      newBuff = this.updateStcoOffsets(ez, newMoovAtom.size - moovAtom.size, stcoAtom);
    }
    return newBuff;
  }

  private dataToBuffer({ key, value }: { key: string; value: string | Buffer }): Buffer | null {
    const item = atomsWFlag.find((item) => item.name === key);
    if (!item) return null;
    if (item.flag[3] === 0x01) {
      if (typeof value === "string") {
        const maxBytes = 255;
        const prefix = Buffer.from("\x00\x00\x00\x00");
        const valueBuffer = Buffer.from(value, "utf8");
        const allowedBytes = maxBytes - prefix.length;
        const trimmedValueBuffer =
          valueBuffer.length > allowedBytes ? valueBuffer.subarray(0, allowedBytes) : valueBuffer;

        const buffer = Buffer.concat([
          Buffer.from(item.flag),
          prefix,
          item.noSizeLimit ? valueBuffer : trimmedValueBuffer,
        ]);

        return buffer;
      } else {
        return value;
      }
    } else if (item.flag[3] === 0x15 || item.flag[3] === 0x00) {
      if (typeof value !== "number") return null;
      if (item.size) {
        const valueBuffer = Buffer.alloc(8);

        valueBuffer.writeUInt32BE(value, 4);
        const buffer = Buffer.concat([Buffer.from(item.flag), valueBuffer]);

        return buffer;
      } else {
        const valueBuffer = Buffer.alloc(5);

        valueBuffer.writeUInt8(value === 1 ? 1 : 0, 4);
        const buffer = Buffer.concat([Buffer.from(item.flag), valueBuffer]);

        return buffer;
      }
    }
    return null;
  }

  private parseKey(key: string): Buffer {
    if (key.startsWith("©")) {
      const buff = Buffer.alloc(4);

      buff.writeUInt8(0xa9, 0);
      buff.write(key.slice(1), 1, "ascii");

      return buff;
    }

    return Buffer.from(key, "utf8");
  }

  private encodeIlst(
    metadata: Record<string, ImgData | string | Buffer | number>,
    subAtoms: Atom[],
    ogFileBuffer: Buffer
  ): Buffer {
    const ilstEntries: Buffer[] = [];
    if (metadata["covr"]) {
      const imageData = metadata["covr"] as ImgData;

      let mime = Buffer.from([0x00, 0x00, 0x00, 0x0f]);

      if (imageData.mime === "image/jpeg") mime = Buffer.from([0x00, 0x00, 0x00, 0x0d]);

      if (imageData.mime === "image/png") mime = Buffer.from([0x00, 0x00, 0x00, 0x0e]);

      const reserved = Buffer.alloc(4);
      const dataBuffer = Buffer.concat([mime, reserved, imageData.buffer]);
      const dataAtomSize = 8 + dataBuffer.length;
      const dataSizeBuffer = Buffer.alloc(4);

      dataSizeBuffer.writeUInt32BE(dataAtomSize, 0);

      const dataAtom = Buffer.concat([dataSizeBuffer, Buffer.from("data"), dataBuffer]);
      const keyAtomSize = 8 + dataAtom.length;
      const keySizeBuffer = Buffer.alloc(4);
      const keyBuffer = this.parseKey("covr");

      keySizeBuffer.writeUInt32BE(keyAtomSize, 0);

      const keyAtom = Buffer.concat([keySizeBuffer, keyBuffer, dataAtom]);

      ilstEntries.push(keyAtom);
    }
    while (subAtoms.length) {
      const atom = subAtoms.shift();

      if (!atom) continue;

      if (atom.type === "----") {
        ilstEntries.push(ogFileBuffer.subarray(atom.position, atom.position + atom.size));
      }
    }

    for (const [key, pv] of Object.entries(metadata)) {
      if (key.length !== 4) continue;
      const value = pv as string | Buffer;
      const dataBuffer = this.dataToBuffer({ key, value });

      if (!dataBuffer) continue;

      const dataAtomSize = 8 + dataBuffer.length;
      const dataSizeBuffer = Buffer.alloc(4);

      dataSizeBuffer.writeUInt32BE(dataAtomSize, 0);

      const dataAtom = Buffer.concat([dataSizeBuffer, Buffer.from("data"), dataBuffer]);

      const keyAtomSize = 8 + dataAtom.length;
      const keySizeBuffer = Buffer.alloc(4);
      const keyBuffer = this.parseKey(key);

      keySizeBuffer.writeUInt32BE(keyAtomSize, 0);

      const keyAtom = Buffer.concat([keySizeBuffer, keyBuffer, dataAtom]);

      ilstEntries.push(keyAtom);
    }

    const ilstBody = Buffer.concat(ilstEntries);
    const totalSize = ilstBody.length + 8;
    const ilstHeader = Buffer.alloc(8);

    ilstHeader.writeUInt32BE(totalSize, 0);
    ilstHeader.write("ilst", 4);

    const newIlst = Buffer.concat([ilstHeader, ilstBody]);

    return newIlst;
  }

  private getIlstAtom(fileBuffer: Buffer): Atom | null {
    const topLevelAtoms = this.parseAtoms(fileBuffer);
    const moovAtom = topLevelAtoms.find((atom) => atom.type === "moov");
    const mdatAtom = topLevelAtoms.find((atom) => atom.type === "mdat");

    if (!moovAtom || !mdatAtom) {
      return null;
    }

    if (!moovAtom) {
      return null;
    }

    const moovSubAtoms = this.parseAtoms(fileBuffer, moovAtom.position + 8, moovAtom.size - 8);
    const udtaAtom = moovSubAtoms.find((atom) => atom.type === "udta");

    let metaAtom: Atom | undefined;

    if (udtaAtom) {
      const udtaSubAtoms = this.parseAtoms(fileBuffer, udtaAtom.position + 8, udtaAtom.size - 8);

      metaAtom = udtaSubAtoms.find((atom) => atom.type === "meta");
    } else {
      metaAtom = moovSubAtoms.find((atom) => atom.type === "meta");
    }

    if (!metaAtom) {
      return null;
    }
    const metaSubAtoms = this.parseAtoms(fileBuffer, metaAtom.position + 12, metaAtom.size - 12);

    const ilstAtom = metaSubAtoms.find((atom) => atom.type === "ilst");

    if (!ilstAtom) {
      return null;
    }
    return ilstAtom;
  }

  getTags(filePath: string): Tags | null {
    this.ensureIlst(filePath);

    const fileBuffer = fs.readFileSync(filePath);
    const ilstAtom = this.getIlstAtom(fileBuffer);
    const atoms = this.parseAtoms(fileBuffer);

    if (!ilstAtom) {
      return null;
    }

    const moovAtom = atoms.find((atom) => atom.type === "moov");
    if (!moovAtom) return null;

    const ilstSubAtoms = this.parseAtoms(fileBuffer, ilstAtom.position + 8, ilstAtom.size - 8);

    const metadata = this.getMetadata(fileBuffer, ilstSubAtoms, false);
    const cleaned = Object.keys(metadata).reduce(
      (acc: Record<string, string | number | ImgData>, key) => {
        if (typeof metadata[key] === "string") {
          acc[key] = metadata[key].replace(/[\x00-\x1F\x7F]/g, "");
        } else {
          acc[key] = metadata[key];
        }

        return acc;
      },
      {}
    );

    const tags = this.rawToTags({ ...itunesTags, ...cleaned });

    return tags as Tags;
  }

  private parseAtoms(buffer: Buffer, start = 0, size?: number): Atom[] {
    let position = start;
    const atoms: Atom[] = [];
    const end = size ? start + size : buffer.length;

    while (position < end) {
      if (position + 8 > buffer.length) break;

      const atomSize = buffer.readUInt32BE(position);
      const rawAtomType = buffer.subarray(position + 4, position + 8);

      let atomType = rawAtomType.toString("utf8").trim();

      if (rawAtomType[0] === 0xa9) {
        atomType = "©" + atomType.slice(1);
      }

      atoms.push({
        type: atomType,
        size: atomSize,
        position,
        buffer: buffer.subarray(position, position + atomSize),
      });

      if (atomSize < 8) break;
      position += atomSize;
    }
    return atoms;
  }

  private getMetadata(
    buffer: Buffer,
    atoms: Atom[],
    noImageConversion: boolean
  ): Record<string, string | ImgData | number> {
    const metadata: Record<string, string | ImgData | number> = {};

    for (const atom of atoms) {
      let tag = atom.type;

      if (tag.charCodeAt(0) === 0xfffd) {
        tag = "©" + tag.slice(1);
      }

      const dataStart = atom.position + 16;
      const dataSize = atom.size - 16;

      if (tag === "covr") {
        if (noImageConversion) {
          const pos = atom.position;

          metadata[tag] = buffer.subarray(pos + 24, pos + dataSize).toString("utf-8");
        } else {
          const pos = atom.position;
          const magicNumber = buffer.toString("hex", pos + 24);

          let mime = "image/bmp";

          if (magicNumber.startsWith("ffd8ff")) mime = "image/jpg";
          if (magicNumber.startsWith("89504e47")) mime = "image/png";

          if (mime === "monkey") continue;

          metadata[tag] = {
            buffer: Buffer.from(buffer.toString("hex", pos + 24, pos + dataSize + 16), "hex"),
            mime: mime,
          };

          continue;
        }
      }
      const item = atomsWFlag.find((item) => item.name === tag);
      if (item) {
        if (item.flag[3] === 0x15) {
          if (item.size) {
            metadata[tag] = buffer.readUInt32BE(dataStart + 8);
          } else {
            metadata[tag] = buffer.readUInt8(dataStart + 8);
          }
          continue;
        }
      }

      if (tag === "----") {
        metadata[tag] = buffer.toString("utf8", dataStart - 8, dataStart + dataSize);
      } else {
        metadata[tag] = buffer
          .toString("utf8", dataStart, dataStart + dataSize)
          .replace(/[\x00-\x1F\x7F]/g, "");
      }
    }
    return metadata;
  }
  private tagsToRaw(tags: Partial<Tags>): RawItunesFrames {
    const rawMetadata: Record<string, string> = {};
    for (const key in tags) {
      if (Object.prototype.hasOwnProperty.call(tags, key)) {
        const rawKey = Object.keys(itunesReverseMapping).find(
          (k) => itunesReverseMapping[k] === key
        );
        if (rawKey) {
          rawMetadata[rawKey] = tags[key as keyof Tags] as string;
        }
      }
    }
    return rawMetadata as RawItunesFrames;
  }
  rawToTags(rawMetadata: ItunesFrames): typeof itunesTags {
    const readableTags: Record<string, string> = {};

    for (const key in rawMetadata) {
      const readableKey = itunesReverseMapping[key];

      if (readableKey) {
        readableTags[readableKey] = rawMetadata[key] as string;
      }
    }
    return readableTags as typeof itunesTags;
  }
}

interface Atom {
  type: string;
  size: number;
  position: number;
  buffer: Buffer;
}
