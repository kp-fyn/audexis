import { z } from "zod";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { app, BrowserWindow } from "electron";

import path from "path";
import Constants from "../../shared/Constants";
import { workspace } from "..";

const columns = z
  .object({
    value: z.string().readonly(),
    label: z.string(),
    size: z.number().default(200),
  })
  .required();
const albums = z.array(
  z.object({
    id: z.string(),
    hashes: z.array(z.string()).default([]),

    album: z.string(),
    copyright: z.string().optional(),
    year: z.string().optional(),
    genre: z.string().optional(),
    albumArtist: z.string().optional(),
    folder: z.string().optional(),
    fileFormatPath: z.string().optional(),
    fileFormatPathEnabled: z.boolean().default(false),
    attachedPicture: z
      .object({
        buffer: z.string(),
        mime: z.string(),
      })
      .optional(),
  })
);
const ConfigSchema = z.object({
  theme: z.enum(["light", "dark"]).default("light"),
  view: z.enum(["simple", "folder"]).default("folder"),
  onboarding: z.boolean().default(true),
  albums: albums.default([]),
  columns: z.array(columns).default([
    { value: "path", label: "Path" },
    { value: "release", label: "Tag Manager" },
    { value: "title", label: "Title" },
    { value: "artist", label: "Artist" },
    { value: "album", label: "Album" },

    { value: "year", label: "Year" },
    { value: "trackNumber", label: "Track Number" },
    { value: "genre", label: "Genre" },
    { value: "albumArtist", label: "Album Artist" },
    { value: "composer", label: "Composer" },
    { value: "encodedBy", label: "Encoded By" },
    { value: "conductor", label: "Conductor" },
  ]),
});

export type UserConfig = z.infer<typeof ConfigSchema>;
export type Album = z.infer<typeof albums.element>;

console.log(path.join(app.getPath("userData"), "config.json"));

const configPath = path.join(app.getPath("userData"), "config.json");

const file = new JSONFile<UserConfig>(configPath);
const defaults = getDefaults(ConfigSchema);

const db = new Low<UserConfig>(file, { ...defaults });

export async function loadConfig(): Promise<UserConfig> {
  await db.read();
  if (!db.data) {
    db.data = { ...defaults };
    await db.write();
  }

  return db.data;
}
export async function saveConfig(
  config: Partial<UserConfig>,
  windows: Map<string, number>
): Promise<void> {
  await db.read();
  const initial = { ...db.data };
  db.data = ConfigSchema.parse({ ...db.data, ...config });

  await db.write();
  if (config.view) {
    if (db.data.view !== initial.view) {
      if (db.data.view === "folder") {
        workspace.startWatching();
      } else {
        workspace.stopWatching();
      }
    }
  }

  windows.forEach((window) => {
    const win = BrowserWindow.fromId(window);
    if (win) {
      win.webContents.send(Constants.channels.USER_CONFIG_UPDATE, db.data);
    }
  });
}
function getDefaults<Schema extends z.AnyZodObject>(schema: Schema): UserConfig {
  const entries = Object.entries(schema.shape).map(([key, value]) => {
    if (value instanceof z.ZodDefault) return [key, value._def.defaultValue()];
    return [key, undefined];
  });
  return entries.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}) as UserConfig;
}
