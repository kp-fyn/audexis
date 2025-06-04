import { BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions, app } from "electron";
import { workspace, createSettingsWindow, mainWindowId } from "../index";
import Constants from "../../shared/Constants";

const menuItems: MenuItemConstructorOptions[] = [
  {
    label: "File",
    submenu: [
      {
        label: "Open...",
        accelerator: "CmdOrCtrl+O",
        click: (): void => {
          const mainWindow = BrowserWindow.getAllWindows().find(
            (window) => window.id === mainWindowId
          );

          if (mainWindow) {
            mainWindow.webContents.send(Constants.channels.OPEN_DIALOG);
          }
        },
      },
      { label: "Close Editor", role: "close" },
    ],
  },
  { label: "Albums", submenu: [] },
  {
    label: "Edit",
    submenu: [
      {
        role: "undo",
        click: (): void => {
          const mainWindow = BrowserWindow.getAllWindows().find(
            (window) => window.id === mainWindowId
          );
          mainWindow?.webContents.send(Constants.channels.UNDO);
        },
      },
      {
        role: "redo",
        click: (): void => {
          const mainWindow = BrowserWindow.getAllWindows().find(
            (window) => window.id === mainWindowId
          );
          mainWindow?.webContents.send(Constants.channels.REDO);
        },
      },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "pasteAndMatchStyle" },
      { role: "delete" },

      {
        role: "selectAll",
      },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      {
        label: "Force Reload",
        accelerator: "CmdOrCtrl+Shift+R",
        click: (): void => {
          workspace.resetTree();
          workspace.sendUpdate();
        },
      },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  { role: "windowMenu" },
];
export default function getMenu(): Menu {
  app.setAboutPanelOptions({
    applicationName: "Audexis",
    applicationVersion: app.getVersion(),
    copyright: "© 2025 Kp Adeyinka",
    authors: ["Kp Adeyinka"],
  });
  app.name = "Audexis";
  const menu = new Menu();
  menu.append(
    new MenuItem({
      label: app.name,
      submenu: [
        {
          role: "about",
        },
        {
          label: "Preferences",
          accelerator: "CmdOrCtrl+,",
          click: (): void => {
            createSettingsWindow();
          },
        },
        { type: "separator" },
        {
          role: "services",
          submenu: [],
        },
        { type: "separator" },
        {
          role: "hide",
        },
        {
          role: "hideOthers",
        },
        {
          role: "unhide",
        },
        { type: "separator" },
        {
          role: "quit",
          label: "Quit Audexis",
        },
      ],
    })
  );
  menuItems.forEach((item) => {
    menu.append(new MenuItem(item));
  });

  return menu;
}
