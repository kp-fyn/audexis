import { z } from "zod";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { app, BrowserWindow } from "electron";

import path from "path";
import Constants from "../utils/Constants";

const columns = z
  .object({
    value: z.string().readonly(),
    label: z.string(),
    size: z.number().default(200),
  })
  .required();
const ConfigSchema = z.object({
  theme: z.enum(["light", "dark"]).default("light"),
  view: z.enum(["simple", "folder"]).default("folder"),
  onboarding: z.boolean().default(true),
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
console.log(path.join(app.getPath("userData"), "config.json"));

const configPath = path.join(app.getPath("userData"), "config.json");

const file = new JSONFile<UserConfig>(configPath);
const defaults = getDefaults(ConfigSchema);

const db = new Low<UserConfig>(file, { ...defaults });

export async function loadConfig(): Promise<Low<UserConfig>> {
  await db.read();
  const merged = { ...defaults, ...db.data };
  db.data = ConfigSchema.parse(merged);

  await db.write();
  return db;
}
export async function saveConfig(
  config: Partial<UserConfig>,
  windows: Map<string, number>
): Promise<void> {
  db.data = ConfigSchema.parse({ ...db.data, ...config });

  await db.write();
  // workspace.init(db.data.view);
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
