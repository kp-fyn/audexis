import {
  ContextMenuCheckboxItem,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "../context-menu";
import { ReactNode, Dispatch, SetStateAction } from "react";
import { AudioFile, FileNode } from "src/types";
import { useChanges } from "../../hooks/useChanges";
import { useUserConfig } from "../../hooks/useUserConfig";
import { PlusIcon } from "lucide-react";

export default function FileContextMenu({
  file,
  checked,
  setChecked,
  setShowSubDirectories,
  setIsRenaming,
  showSubDirectories,
}: {
  file: FileNode;
  audioFile?: AudioFile;
  checked: boolean;
  showSubDirectories: boolean;
  setShowSubDirectories: Dispatch<SetStateAction<boolean>>;
  setChecked: Dispatch<SetStateAction<boolean>>;
  setIsRenaming: Dispatch<SetStateAction<boolean>>;
}): ReactNode {
  let isRoot = false;
  let isDirectory = false;
  if (file.path === ":/fake" || file.path === ":/fake2") isRoot = true;
  if (file.type === "directory") isDirectory = true;
  const { showAlbumDialog } = useChanges();
  const { config } = useUserConfig();
  const rootItems = [
    {
      label: "Import...",
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
      {isDirectory && (
        <>
          <ContextMenuCheckboxItem
            checked={showSubDirectories}
            onClick={() => setShowSubDirectories((bool) => !bool)}
          >
            Show sub-directories
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={checked} onClick={() => setChecked((bool) => !bool)}>
            Show Files
          </ContextMenuCheckboxItem>
          {!isRoot && (
            <>
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger disabled={isRoot}>
                  Treat Folder as Album
                </ContextMenuSubTrigger>

                <ContextMenuSubContent>
                  {config.albums.map((album) => (
                    <ContextMenuItem
                      onClick={() =>
                        window.app.addFolderToAlbum({ albumId: album.id, folderPath: file.path })
                      }
                      key={album.id}
                    >
                      {" "}
                      {album.album}
                    </ContextMenuItem>
                  ))}
                  <ContextMenuItem
                    className="flex gap-1 justify-start items-center"
                    onClick={() => {
                      showAlbumDialog(2);
                    }}
                  >
                    <PlusIcon size={18}></PlusIcon>
                    Create Album
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </>
          )}
        </>
      )}
    </>
  );
}
