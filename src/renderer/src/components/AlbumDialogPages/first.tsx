import { getAlbumTags } from "../../lib/utils";
import { ReactNode } from "react";
import { useChanges } from "../../hooks/useChanges";
import { Button } from "../button";
import toast from "react-hot-toast";

export default function FirstPage({ goToNextPage }: Props): ReactNode {
  const tags = getAlbumTags();
  const { albumDialogValues, setAlbumDialogValues, closeAlbumDialog } = useChanges();

  return (
    <div className="flex flex-col justify-start items-start select-none">
      {/* <button className="text-primary hover:underline px-0" onClick={goToNextPage}>
        Next

      </button> */}

      <div className="">
        <button onClick={() => goToNextPage(3)} className="text-primary px-0 hover:text-underline">
          {" "}
          Auto-complete with online database
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-1 w-full">
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
      </div>
      <div className="flex gap-2 mt-4 ml-auto">
        <Button
          onClick={() => {
            closeAlbumDialog();
          }}
          variant={"outline"}
        >
          Cancel
        </Button>
        <Button
          onClick={(): void => {
            if (!albumDialogValues.album) {
              toast.error("Please enter an album name");
              return;
            }
            window.app.saveAlbum(albumDialogValues);
            closeAlbumDialog();
            toast.success("Album saved");
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
interface Props {
  goToNextPage: (page: number) => void;
}
