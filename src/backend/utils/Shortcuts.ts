import { Menu, MenuItem, MenuItemConstructorOptions, app } from "electron";
import { audioFiles, mainWindow } from "../main";
import Constants from "./Constants";
const menuItems: MenuItemConstructorOptions[] = [
  {
    label: "File",
    submenu: [
      {
        label: "Open...",
        accelerator: "CmdOrCtrl+O",
        click: () => {
          if (mainWindow) {
            console.log("sending open dialog");
          }
          mainWindow?.webContents.send(Constants.channels.OPEN_DIALOG);
        },
      },
      { label: "Close Editor", role: "close" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      {
        role: "undo",
        click: () => mainWindow?.webContents.send(Constants.channels.UNDO),
      },
      {
        role: "redo",
        click: () => mainWindow?.webContents.send(Constants.channels.REDO),
      },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "pasteAndMatchStyle" },
      { role: "delete" },
      { role: "selectAll" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      {
        role: "forceReload",
        click: () => {
          audioFiles.clear();
          mainWindow?.reload();
        },
      },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  { role: "windowMenu" },
];
export default function getMenu() {
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
