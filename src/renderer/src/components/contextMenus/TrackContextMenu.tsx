import { ContextMenuItem } from "../context-menu";
import { ReactNode } from "react";
import { AudioFile } from "src/types";

export default function TrackContextMenu({ file }: { file: AudioFile }): ReactNode {
  return (
    <>
      <ContextMenuItem onClick={() => window.app.showInFinder(file.path)}>
        Show In finder
      </ContextMenuItem>
    </>
  );
}
