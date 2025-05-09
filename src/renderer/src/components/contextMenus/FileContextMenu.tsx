import { ContextMenuCheckboxItem, ContextMenuItem, ContextMenuSeparator } from "../context-menu";
import { ReactNode, Dispatch, SetStateAction } from "react";
import { AudioFile, FileNode } from "src/types";

export default function FileContextMenu({
  file,
  checked,
  setChecked,
  setIsRenaming,
}: {
  file: FileNode;
  audioFile?: AudioFile;
  checked: boolean;
  setChecked: Dispatch<SetStateAction<boolean>>;
  setIsRenaming: Dispatch<SetStateAction<boolean>>;
}): ReactNode {
  let isRoot = false;
  let isDirectory = false;
  if (file.path === ":/fake" || file.path === ":/fake2") isRoot = true;
  if (file.type === "directory") isDirectory = true;
  const rootItems = [
    {
      label: "Import Folder",
      onClick: (): void => {
        window.app.openDialog();
      },
    },
  ];

  return (
    <>
      {isRoot && (
        <>
          {rootItems.map((item) => (
            <ContextMenuItem key={item.label} onClick={item.onClick}>
              {item.label}
            </ContextMenuItem>
          ))}
          <ContextMenuSeparator />
        </>
      )}
      {isDirectory && (
        <>
          <ContextMenuCheckboxItem checked={checked} onClick={() => setChecked((bool) => !bool)}>
            Show files
          </ContextMenuCheckboxItem>
        </>
      )}
      {!isRoot && (
        <>
          <ContextMenuItem onClick={() => window.app.showInFinder(file.path)}>
            Show In finder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setIsRenaming((bool) => !bool)}>
            Rename File
          </ContextMenuItem>
        </>
      )}
    </>
  );
}
