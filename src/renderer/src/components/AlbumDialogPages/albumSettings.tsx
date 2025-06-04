import { useUserConfig } from "../..//hooks/useUserConfig";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useChanges } from "../../hooks/useChanges";
import { Button } from "../button";
import {
  getAlbumTags,
  findFileNodeByPath,
  findAudiofilebyHash,
  tagOptions,
  isValidFileName,
} from "../../lib/utils";
import { Extended, Album } from "../../../../types/index";
import { EllipsisIcon } from "lucide-react";
import DropdownMenu from "../dropdown";
import MentionsInput from "../MentionsInput";
import { Checkbox } from "../checkbox";
import toast from "react-hot-toast";

export default function AlbumSettings({ goToPreviousPage }: Props): ReactNode {
  const { config } = useUserConfig();
  const tags = getAlbumTags();
  const { albumId, fileTree } = useChanges();

  const album = config.albums.find((album) => album.id === albumId);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [albumDialogValues, setAlbumDialogValues] = useState<Partial<Album>>({});
  const divRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  useEffect(() => {
    if (!album) return;
    setAlbumDialogValues({
      albumArtist: album.albumArtist ?? "",
      album: album.album ?? "",
      year: album.year,
      genre: album.genre,
      copyright: album.copyright,
      fileFormatPath: album.fileFormatPath ?? "",
      fileFormatPathEnabled: album.fileFormatPathEnabled ?? false,
      attachedPicture: album.attachedPicture
        ? {
            buffer: Buffer.from(album.attachedPicture.buffer, "base64"),
            mime: album.attachedPicture.mime,
            url: URL.createObjectURL(
              new Blob([Buffer.from(album.attachedPicture.buffer, "base64") as BlobPart])
            ),
            type: { id: 3 },
          }
        : undefined,
    });
    setInitialized(true);
  }, [album]);
  useEffect(() => {
    if (isEditing && divRef.current) {
      divRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isEditing]);
  if (!album) {
    goToPreviousPage(0);
    return <></>;
  }
  const hashes = album.hashes
    .map((hash) => findAudiofilebyHash(fileTree, hash))
    .filter((file) => file !== null);
  const folderTracks: Extended[] = [];
  if (album.folder) {
    const folderNode = findFileNodeByPath(fileTree, album.folder);
    if (folderNode && folderNode.children) {
      folderNode.children.forEach((file) => {
        if (!file.hash) return;
        const fileNode = findAudiofilebyHash(fileTree, file.hash);
        if (!fileNode) return;
        folderTracks.push(fileNode);
      });
    }
  }

  const tracks: Extended[] = [...hashes, ...folderTracks].filter(
    (file) => file !== null
  ) as Extended[];
  const albumTracks = [...new Set(tracks)];
  const trackLength = albumTracks.length === 0 ? (album.folder ? 1 : 0) : albumTracks.length;
  if (!initialized)
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  return (
    <div className="flex flex-col gap-2 min-h-[600px]">
      <div className="flex h-48 w-full items-start justify-start select-none gap-x-12">
        {album.attachedPicture && (
          <img
            className="w-48 h-48 rounded hover:opacity-50 transition-opacity duration-300 select-none"
            src={URL.createObjectURL(
              new Blob([Buffer.from(album.attachedPicture.buffer, "base64") as BlobPart])
            )}
          ></img>
        )}
        <div className="flex   flex-col w-full h-48 overflow-hidden">
          <span className="text-3xl font-bold truncate overflow-hidden whitespace-nowrap block max-w-full">
            {album.album}
          </span>
          <span className="text-lg text-primary">{album.albumArtist}</span>
          <div className="flex  flex-row gap-1 text-xs text-muted-foreground">
            <span>{album.genre}</span>
            {album.year && <span>&bull; {parseYear(album.year)}</span>}
          </div>
          <div className="w-full flex mt-auto pb-6">
            <Button className="w-24" onClick={() => setIsEditing((prev) => !prev)}>
              Edit Album
            </Button>
            <div className="ml-auto flex justify-center flex-shrink-0 ">
              <DropdownMenu
                className="bg-hover text-primary"
                items={[
                  {
                    label: "Edit Album",
                    onClick: (): void => {
                      setIsEditing((prev) => !prev);
                    },
                  },
                  {
                    label: "Delete Album",
                    onClick: (): void => {
                      console.log("Deleting album", { albumId });
                      window.app.deleteAlbum({ albumId });
                      goToPreviousPage(0);
                    },
                  },
                ]}
              >
                <EllipsisIcon className="w-4 h-4" />
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        {albumTracks.map((track, i) => (
          <div
            key={(track.hash, i)}
            className="flex select-none items-center transition-colors py-3 px-4 border-border border-b hover:bg-muted-hover  text-sm"
          >
            <div className="flex flex-col select-none">
              <span className="text-sm font-bold">{track.title}</span>
              <span className="text-sm text-muted-foreground">
                {track.artist ?? track.albumArtist ?? "Unknown Artist"}
              </span>
            </div>
            <div className="ml-auto flex flex-row gap-1">
              <DropdownMenu
                className="hover:bg-transparent hover:text-accent"
                items={[
                  {
                    label: "Show in Finder",
                    onClick: (): void => {
                      if (!track.path) return;
                      window.app.showInFinder(track.path);
                    },
                  },
                  {
                    label: "Remove from Album",
                    onClick: (): void => {
                      window.app.removeFromAlbum({ albumId: album.id, fileHash: track.hash });
                    },
                  },
                ]}
              >
                <EllipsisIcon className="w-4 h-4" />
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-col text-sm text-muted-foreground">
        <span>
          {trackLength} Item
          {trackLength !== 1 && "s"}
        </span>
        {album.year && (
          <span className="text-sm text-muted-foreground">{parseDate(album.year)}</span>
        )}
        <span className="text-sm text-muted-foreground">{album.copyright}</span>
      </div>

      {isEditing && (
        <div ref={divRef} className="flex flex-col gap-2 mt-4">
          {tags.map((tag) => (
            <div className="flex flex-col w-full" key={tag.value}>
              <label className="text-sm text-muted-foreground">{tag.label}</label>
              {tag.type === "input" && (
                <input
                  value={albumDialogValues[tag.value] ?? ""}
                  onChange={(e) => {
                    setAlbumDialogValues((prev) => ({
                      ...prev,
                      [tag.value]: e.target.value,
                    }));
                  }}
                  className="bg-transparent border border-border w-full py-2 px-2 outline-none focus:border-primary transition-colors rounded"
                  placeholder={tag.label}
                ></input>
              )}
              {tag.type === "img" && tag.value === "attachedPicture" && (
                <img
                  onDoubleClick={async () => {
                    const img = await window.app.uploadImage();

                    if (!img) return;
                    if (!img.buffer) return;
                    const blob = new Blob([img.buffer as BlobPart]);
                    setAlbumDialogValues((prev) => ({
                      ...prev,
                      attachedPicture: {
                        buffer: img.buffer,
                        mime: img.mime,
                        type: { id: 3 },
                        url: URL.createObjectURL(blob),
                      },
                    }));
                  }}
                  src={albumDialogValues.attachedPicture?.url}
                  className="w-32 h-32"
                />
              )}
            </div>
          ))}
          <div className="flex flex-col w-full gap-y-1">
            <div
              onClick={() =>
                setAlbumDialogValues((prev) => ({
                  ...prev,
                  fileFormatPathEnabled: prev.fileFormatPathEnabled ? false : true,
                }))
              }
              className="flex gap-x-2 items-center"
            >
              <Checkbox
                checked={albumDialogValues.fileFormatPathEnabled}
                onCheckedChange={(ch) =>
                  setAlbumDialogValues((prev) => ({
                    ...prev,
                    fileFormatPathEnabled: ch as boolean,
                  }))
                }
                id="terms"
                className="h-4 w-4"
              />
              <label className="text-sm text-muted-foreground">Auto Rename?</label>
            </div>
            <MentionsInput
              symbol="{"
              value={albumDialogValues.fileFormatPath ?? ""}
              disabled={!albumDialogValues.fileFormatPathEnabled}
              closingSymbol="}"
              type="text"
              defaultValue={albumDialogValues.fileFormatPath ?? ""}
              placeholder="{trackNumber} - {title}"
              items={tagOptions}
              setInputValue={(e) =>
                setAlbumDialogValues((prev) => ({ ...prev, fileFormatPath: e }))
              }
              onMention={(user) => console.log("User mentioned:", user)}
            />
          </div>

          <Button
            onClick={() => {
              if (albumDialogValues.fileFormatPathEnabled) {
                if (isValidFileName(albumDialogValues.fileFormatPath ?? "", true).err) {
                  toast.error("Invalid file format path. Please check the format.");
                  return;
                } else {
                  window.app.editAlbum({ albumId: album.id, changes: { ...albumDialogValues } });
                }
              } else {
                window.app.editAlbum({ albumId: album.id, changes: { ...albumDialogValues } });
              }
            }}
            className="ml-auto"
          >
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
function parseDate(date: string): string {
  const parsedDate = new Date(date);
  if (parsedDate.toString() !== "Invalid Date") {
    return parsedDate.toDateString();
  } else {
    return date;
  }
}

function parseYear(year: string): number | string {
  const date = new Date(year);
  if (date.toString() !== "Invalid Date") {
    return date.getFullYear();
  } else {
    return year;
  }
}
interface Props {
  goToPreviousPage: (num?: number) => void;
}
