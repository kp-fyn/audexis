import { Image, MusicMetadataFile } from "../../electron/electron-env";
import { TableCell, TableRow } from "@/components/ui/table";
import { useImage } from "react-image";

import { useEffect, useState, ReactNode } from "react";

export default function Track({ track, selected, onClick }: Props) {
  const filename = track.path.replace(/^.*[\\/]/, "");

  const [image, setImage] = useState<Image | null>(null);

  useEffect(() => {
    if (track.image) {
      if (typeof track.image !== "string") {
        const blob = new Blob([track.image.imageBuffer], {
          type: track.image.mime,
        });

        setImage({ ...track.image, image: URL.createObjectURL(blob) });
      }
    }
  }, [track]);
  const { src } = useImage({
    srcList: [image?.image as string, "/unknown.jpg"],
  });
  return (
    <TableRow
      onClick={onClick}
      className={` ${
        selected ? "bg-accent hover:!bg-accent" : "bg-transparent"
      } track cursor-pointer track ml-2`}
    >
      <TableCell className={"left-2 px-2 h-[60ox] w-[60px] track"}>
        <img
          alt={track.title}
          src={src}
          className={"h-full w-full track rounded-xl track"}
        />
      </TableCell>
      <TableCell className="font-medium track text-ellipsis !max-w-[200px] w-[200px] overflow-hidden whitespace-nowrap ">
        {filename}
      </TableCell>
      <TrackCell>{track.title}</TrackCell>
      <TrackCell>{track.artist}</TrackCell>
      <TrackCell>{track.album}</TrackCell>
      <TableCell>{track.performerInfo}</TableCell>
      <TableCell>{track.genre}</TableCell>
      <TableCell>{track.year}</TableCell>
      <TableCell>{track.trackNumber}</TableCell>
      <TableCell>{track.composer}</TableCell>
      <TableCell className="font-">{track.path}</TableCell>
    </TableRow>
  );
}

function TrackCell({ children }: { children: ReactNode }) {
  return (
    <TableCell className="font-medium track text-ellipsis !max-w-[200px] w-[300px] overflow-hidden whitespace-nowrap ">
      {children}
    </TableCell>
  );
}

interface Props {
  track: MusicMetadataFile;
  selected: boolean;
  onClick: () => void;
}
