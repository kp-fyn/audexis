import { useChanges } from "@/ui/hooks/useChanges";
import {
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "../context-menu";
import { ReactNode } from "react";
const imageTypes = [
  { value: 0, name: "Other" },
  { value: 1, name: "32x32 pixels file icon" },
  { value: 2, name: "Other file icon" },
  { value: 3, name: "Cover (front)" },
  { value: 4, name: "Cover (back)" },
  { value: 5, name: "Leaflet page" },
  { value: 6, name: "Media (e.g. label side of CD)" },
  { value: 7, name: "Lead artist/lead performer/soloist" },
  { value: 8, name: "Artist/performer" },
  { value: 9, name: "Conductor" },
  { value: 10, name: "Band/orchestra" },
  { value: 11, name: "Composer" },
  { value: 12, name: "Lyricist/text writer" },
  { value: 13, name: "Recording location" },
  { value: 14, name: "During recording" },
  { value: 15, name: "During performance" },
  { value: 16, name: "Movie/video screen capture" },
  { value: 17, name: "A bright colored fish" },
  { value: 18, name: "Illustration" },
  { value: 19, name: "Band/artist logotype" },
  { value: 20, name: "Publisher/studio logotype" },
];

export default function ImageContextMenu(): ReactNode {
  const { selected, files, changes, setChanges } = useChanges();

  const currentFile = files.find((file) => file.path === selected[0]);
  if (!currentFile) return null;
  const noAttatchedImage = !currentFile.attachedPicture && !changes.attachedPicture?.buffer;
  return (
    <>
      <ContextMenuItem
        onClick={async () => {
          const img = await window.app.uploadImage();

          if (!img) return;
          if (!img.buffer) return;

          setChanges({
            ...changes,
            attachedPicture: {
              buffer: img.buffer,
              mime: img.mime,
              type: { id: 3 },
            },
          });
        }}
      >
        Add Image
      </ContextMenuItem>
      <ContextMenuItem
        disabled={noAttatchedImage}
        onClick={() =>
          setChanges({
            ...changes,
            attachedPicture: { buffer: undefined, mime: "null" },
          })
        }
      >
        Remove Image
      </ContextMenuItem>
      <ContextMenuItem disabled={noAttatchedImage}>Save to FIle</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem disabled={noAttatchedImage}>Set Description</ContextMenuItem>
      <ContextMenuSub>
        <ContextMenuSubTrigger disabled={noAttatchedImage}>Set Image Type </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuRadioGroup
            onValueChange={(value) => {
              setChanges({
                ...changes,
                attachedPicture: {
                  ...(changes.attachedPicture
                    ? changes.attachedPicture
                    : currentFile.attachedPicture),
                  type: { id: parseInt(value) },
                },
              });
            }}
            value={
              changes.attachedPicture?.type?.id.toString()
                ? changes.attachedPicture?.type?.id.toString()
                : (currentFile?.attachedPicture?.type?.id.toString() ?? "3")
            }
          >
            {imageTypes.map((type) => (
              <ContextMenuRadioItem key={type.value} value={`${type.value}`}>
                {type.name}
              </ContextMenuRadioItem>
            ))}
          </ContextMenuRadioGroup>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </>
  );
}
