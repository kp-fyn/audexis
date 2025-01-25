import { useSidebarWidth } from "@/contexts/Sidbear";
import { Image, MusicMetadataFile } from "../../electron/electron-env";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, RefObject, useState } from "react";
import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { useImage } from "react-image";
import { useChanges } from "@/contexts/Changes";

import ArtworkDialog from "./ArtworkDialog";

const Sidebar = forwardRef<HTMLDivElement, Props>((_props, ref) => {
  const { changes, setChanges, index, files, saveChanges } = useChanges();

  const neededItems: Item[] = [
    { title: "Title", value: "title", value2: "titles" },
    { title: "Album", value: "album", value2: "albums" },
    { title: "Composer", value: "composer", value2: "composers" },
    { title: "Artist", value: "artist", value2: "artists" },
    { title: "Genre", value: "genre", value2: "genres" },
    { title: "Year", value: "year", value2: "years" },
    { title: "Album Artist", value: "performerInfo", value2: "performerInfos" },
    { title: "Track Number", value: "trackNumber", value2: "trackNumbers" },
  ];
  const sidebarWidth = useSidebarWidth();

  const [values, setValues] = useState<Value>({
    titles: [],
    albums: [],
    composers: [],
    artists: [],
    genres: [],
    years: [],
    performerInfos: [],
    trackNumbers: [],
    paths: [],
  });

  const [image, setImage] = useState<Image | string | null>(null);

  useEffect(() => {
    const track = files[index[0]];
    if (!track) return setImage("/unknown.jpg");

    const images = index.map((i) => files[i].image);
    if (!images.every((i) => i === images[0])) return setImage("/unknown.jpg");

    if (track.image) {
      if (typeof track.image !== "string") {
        const blob = new Blob([track.image.imageBuffer], {
          type: track.image.mime,
        });
        setImage({ ...track.image, image: URL.createObjectURL(blob) });
      } else {
        setImage(track.image);
      }
    } else {
      setImage("/unknown.jpg");
    }
  }, [index, files]);
  const { src } = useImage({
    srcList: [
      typeof image === "string"
        ? image
        : image !== null
        ? image.image
        : "/unknown.jpg",
      "/unknown.jpg",
    ],
  });
  useEffect(() => {
    if (!files[0]) {
      setValues({
        titles: [],
        albums: [],
        composers: [],
        artists: [],
        genres: [],
        years: [],
        performerInfos: [],
        trackNumbers: [],
        paths: [],
      });
    } else {
      setValues({
        titles: index.map((i) => files[i].title),
        albums: index.map((i) => files[i].album),
        composers: index.map((i) => files[i]["composer"]),
        artists: index.map((i) => files[i].artist),
        genres: index.map((i) => files[i].genre),
        years: index.map((i) => files[i].year),
        performerInfos: index.map((i) => files[i].performerInfo),
        trackNumbers: index.map((i) => files[i].trackNumber),
        paths: index.map((i) => files[i].path),
      });
    }
  }, [index, files]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      className="flex select-none flex-col sidebar top-[48px] bg-neutral-950 fixed z-50 h-full  border-r overflow-y-auto py-6"
      style={{ width: sidebarWidth, minWidth: "300px" }}
      id={"sidebar"}
    >
      <div>
        {files[index[0]] ? (
          index.length === 1 ? (
            <div className="flex h-full px-4 ">
              <div className={"flex flex-col gap-2 w-full"}>
                {neededItems.map((item) => {
                  const key: keyof MusicMetadataFile = item.value;
                  return (
                    <>
                      <Label>{item.title}</Label>
                      <Input
                        placeholder={item.title}
                        onChange={(e) => {
                          setChanges((prev) => {
                            return {
                              ...prev,
                              [key]: e.target.value,
                            };
                          });
                        }}
                        value={
                          changes[key] ? changes[key] : files[index[0]][key]
                        }
                      ></Input>
                    </>
                  );
                })}

                <ArtworkDialog src={src} setImage={setImage}>
                  <img
                    src={src}
                    className={"h-full w-full track rounded-xl track"}
                  />
                </ArtworkDialog>

                <div className={"ml-auto"}>
                  <Button onClick={saveChanges}> Save</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full ">
              <div className={"flex flex-col gap-2 w-full"}>
                <div className={"flex flex-col gap-2 w-full"}>
                  {neededItems.map((item) => {
                    const key: keyof MusicMetadataFile = item.value;
                    const key2: keyof Value = item.value2;
                    return (
                      <>
                        <Label htmlFor={item.title}>{item.title}</Label>
                        <Input
                          type={item.title}
                          placeholder={item.title}
                          onChange={(e) => {
                            setChanges((prev) => {
                              return {
                                ...prev,
                                [key]: e.target.value,
                              };
                            });
                          }}
                          value={
                            changes[item.value]
                              ? changes[key]
                              : values[key2].every((t) => t === values[key2][0])
                              ? values[key2][0]
                              : "..."
                          }
                        ></Input>
                      </>
                    );
                  })}
                  <div className={"ml-auto"}>
                    <Button onClick={saveChanges}> Save</Button>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <h1>Import and Select a file to edit. </h1>
        )}
      </div>
    </div>
  );
});
export default Sidebar;

interface Props {
  ref: RefObject<HTMLDivElement>;
}

interface Item {
  title: string;
  value:
    | "title"
    | "album"
    | "composer"
    | "artist"
    | "genre"
    | "year"
    | "performerInfo"
    | "trackNumber";
  value2:
    | "titles"
    | "albums"
    | "composers"
    | "artists"
    | "genres"
    | "years"
    | "performerInfos"
    | "trackNumbers";
}

interface Value {
  titles: string[];
  albums: string[];
  composers: string[];
  artists: string[];
  genres: string[];
  years: string[];
  performerInfos: string[];
  trackNumbers: string[];
  paths: string[];
}
