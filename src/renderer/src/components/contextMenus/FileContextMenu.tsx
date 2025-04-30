import { ContextMenuItem } from "../context-menu";
import { ReactNode, Dispatch, SetStateAction } from "react";
import { AudioFile, FileNode } from "src/types";

export default function FileContextMenu({
  file,
  audioFile,
  setIsRenaming,
}: {
  file: FileNode;
  audioFile?: AudioFile;
  setIsRenaming: Dispatch<SetStateAction<boolean>>;
}): ReactNode {
  let isRoot = false;
  let isDirectory = false;
  if (file.path === ":/fake") isRoot = true;
  if (file.type === "directory") isDirectory = true;

  return (
    <>
      <ContextMenuItem onClick={() => window.app.showInFinder(file.path)}>
        Show In finder
      </ContextMenuItem>
      <ContextMenuItem onClick={() => setIsRenaming((bool) => !bool)}>Rename File</ContextMenuItem>
    </>
  );
}
