import { EllipsisIcon } from "lucide-react";
import { useUserConfig } from "../..//hooks/useUserConfig";
import { ReactNode } from "react";
import { useChanges } from "../../hooks/useChanges";
import { Button } from "../button";

export default function AllAlbums({ goToNextPage }: Props): ReactNode {
  const { config } = useUserConfig();
  const { setAlbumId } = useChanges();
  return (
    <div className="flex flex-col gap-2 min-h-[800px]">
      <div className="pb-4 flex">
        <Button className="ml-auto" onClick={() => goToNextPage(2)}>
          Create New Album
        </Button>
      </div>
      <div className="grid  grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-12">
        {config.albums.map((album) => (
          <div
            onClick={() => {
              setAlbumId(album.id);
              goToNextPage(1);
            }}
            className="w-full"
            key={album.id}
          >
            <div className="flex w-full flex-col items-start justify-start select-none">
              {album.attachedPicture && (
                <img
                  className="w-48 h-48 rounded hover:opacity-50 transition-opacity duration-300 select-none"
                  src={URL.createObjectURL(
                    new Blob([Buffer.from(album.attachedPicture.buffer, "base64") as BlobPart])
                  )}
                ></img>
              )}
              <div className="mt-4 w-full flex flex-col hover:underline">
                <div className="flex items-center text-lg w-[90%] gap-2">
                  <span className="text-lg font-semibold truncate overflow-hidden whitespace-nowrap block max-w-full">
                    {album.album}
                  </span>
                  <div className="flex-shrink-0 ml-auto">
                    <EllipsisIcon className="hover:bg-hover py-1 px-1 rounded" />
                  </div>{" "}
                </div>
                <span className="text-sm text-muted-foreground">{album.albumArtist}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
interface Props {
  goToNextPage: (num?: number) => void;
}
