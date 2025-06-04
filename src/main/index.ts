import { app, shell, BrowserWindow, Menu } from "electron";
import { join } from "path";
import { electronApp, is } from "@electron-toolkit/utils";

import getMenu from "./utils/Menu";
import TagManager from "./classes/TagManager";

import "./utils/Events";
import { loadConfig } from "./db/config";
import { defaultWindowOptions } from "./utils/defaultWindowOptions";
import Constants from "../shared/Constants";
import Workspace from "./classes/Workspace";

const tagManager = new TagManager();
let workspace: Workspace;
const windows = new Map<string, number>();

const menu = getMenu();

let mainWindowId: number = 0;
let settingsWindowId: number = 0;
let onboardingWindowId: number = 0;
async function init(): Promise<void> {
  const initConfig = await loadConfig();
  workspace = new Workspace(initConfig);
  app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId("com.electron");

    // IPC test

    createWindow();

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        windows.clear();
        mainWindowId = 0;
        settingsWindowId = 0;
        onboardingWindowId = 0;
        createWindow();
      }
    });
  });

  app.on("browser-window-created", async (_, window) => {
    const db = await loadConfig();

    window.webContents.send(Constants.channels.USER_CONFIG_UPDATE, db);
  });
  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    if (filePath) {
      workspace.import(filePath);
    }
  });
}

async function createWindow(): Promise<void> {
  if (BrowserWindow.getAllWindows().length > 0) return;

  const db = await loadConfig();

  const backgroundColor = db.theme === "dark" ? "#0a0a0a" : "#f1f1f1";
  const mainWindow = new BrowserWindow({
    ...defaultWindowOptions,
    width: 900,
    height: 670,

    webPreferences: {
      ...defaultWindowOptions.webPreferences,
      nodeIntegration: true,
    },
    backgroundColor,
  });
  if (is.dev) mainWindow.webContents.openDevTools({ mode: "right" });

  mainWindowId = mainWindow.id;
  windows.set("app", mainWindowId);

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    Menu.setApplicationMenu(menu);
  });
  mainWindow.on("close", () => {
    mainWindow.destroy();
    mainWindowId = 0;
    windows.delete("app");
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}?query=app&theme=${db.theme}`);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"), {
      query: {
        query: "app",
        theme: db.theme,
      },
    });
  }
}

async function createSettingsWindow(): Promise<void> {
  const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);
  if (settingsWindowId !== 0) {
    const settingsWindow = BrowserWindow.fromId(settingsWindowId);
    if (settingsWindow) {
      settingsWindow.show();
      settingsWindow.focus();
      return;
    }
  }
  if (!mainWindow) return;
  const db = await loadConfig();
  const backgroundColor = db.theme === "dark" ? "#0a0a0a" : "#f1f1f1";
  const settingsWindow = new BrowserWindow({
    ...defaultWindowOptions,
    width: 650,
    height: 750,
    backgroundColor,
  });
  settingsWindowId = settingsWindow.id;
  windows.set("settings", settingsWindowId);
  settingsWindow.on("close", () => {
    settingsWindow.destroy();
    settingsWindowId = 0;
    windows.delete("settings");
  });
  settingsWindow.on("ready-to-show", () => {
    settingsWindow.show();
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    settingsWindow.loadURL(
      `${process.env["ELECTRON_RENDERER_URL"]}?query=settings&theme=${db.theme}`
    );
  } else {
    settingsWindow.loadFile(join(__dirname, "../renderer/index.html"), {
      query: {
        query: "settings",
        theme: db.theme,
      },
    });
  }
}
let isCreatingOnboarding = false;

async function createOnboardingWindow(): Promise<void> {
  const mainWindow = BrowserWindow.getAllWindows().find((window) => window.id === mainWindowId);
  if (onboardingWindowId !== 0) {
    const onboardingWindow = BrowserWindow.fromId(onboardingWindowId);
    if (onboardingWindow) {
      onboardingWindow.show();
      onboardingWindow.focus();
      return;
    }
  }
  if (isCreatingOnboarding) return;

  if (!mainWindow) return;
  isCreatingOnboarding = true;
  const db = await loadConfig();
  const backgroundColor = db.theme === "dark" ? "#0a0a0a" : "#f1f1f1";
  const onboardingWindow = new BrowserWindow({
    ...defaultWindowOptions,
    parent: mainWindow,
    width: 700,
    height: 600,
    backgroundColor,
    resizable: false,
    modal: true,
  });
  onboardingWindowId = onboardingWindow.id;

  mainWindow.setSize(800, 700);
  windows.set("onboarding", onboardingWindowId);
  isCreatingOnboarding = false;
  onboardingWindow.on("close", () => {
    onboardingWindow.destroy();
    onboardingWindowId = 0;
    mainWindow.resizable = true;
    windows.delete("onboarding");
  });
  onboardingWindow.on("ready-to-show", () => {
    onboardingWindow.show();
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    onboardingWindow.loadURL(
      `${process.env["ELECTRON_RENDERER_URL"]}?query=onboarding&theme=${db.theme}`
    );
  } else {
    onboardingWindow.loadFile(join(__dirname, "../renderer/index.html"), {
      query: {
        query: "onboarding",
        theme: db.theme,
      },
    });
  }
}
init().catch((err) => {
  console.error("Failed to initialize app:", err);
});
export {
  mainWindowId,
  tagManager,
  settingsWindowId,
  createSettingsWindow,
  windows,
  createOnboardingWindow,
  workspace,
};
