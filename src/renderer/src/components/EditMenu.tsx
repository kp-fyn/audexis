import { useChanges } from "../hooks/useChanges";
import { Input } from "./input";
import { AudioFile, FileNode, FullImage, UserConfig } from "../../../types";
import Img from "../assets/images/unknown.jpg";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "./button";
import ContextMenuHandler from "./ContextMenuHandler";
import ImageContextMenu from "./contextMenus/ImageContextMenu";
import { ChevronDown } from "lucide-react";
import { useUserConfig } from "../hooks/useUserConfig";

export default function EditMenu({ bottombar }: Props): ReactNode {
  const [image, setImage] = useState<FullImage | null>(null);
  const { config } = useUserConfig();

  const [filteredSuggestions, setFilteredSuggestions] = useState<UserConfig["albums"]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { files, changes, saveChanges, setChanges, selected, neededItems } = useChanges();
  const [defaultValues, setDefaultValues] = useState<Partial<AudioFile>>();
  const disabled = selected.length === 0 || files.length === 0;

  useEffect(() => {
    console.log({ selected });
    // const selectedFile = files.find((f) => f.path === selected[0]);
    setDefaultValues({});

    if (selected.length === 0) return;

    const sf = selected.map((fp) => {
      const file = files.find((f) => f.path === fp);
      if (!file) return;

      return file;
    });
    console.log({ sf });
    console.log({ files });

    const sfs = sf
      .filter((f) => f?.audioFile !== null)
      .filter((f) => f !== undefined || f !== null) as FileNode[];
    console.log({ sfs });
    const selectedFiles = sfs.map((f) => f.audioFile) as AudioFile[];
    if (selectedFiles.length === 0) return;
    if (selectedFiles.length === 1) {
      if (!selectedFiles[0]) return;
      if (!selectedFiles[0].attachedPicture) return;
      if (selectedFiles[0].attachedPicture) {
        const img = selectedFiles[0].attachedPicture;
        if (typeof img === "string") {
          setImage(null);
          return;
        }
        if (!img.buffer) {
          setImage(null);
          return;
        }
        if (!img.mime) {
          setImage(null);
          return;
        }
        if (typeof img.mime !== "string") {
          setImage(null);
          return;
        }

        const blob = new Blob([img.buffer as BlobPart]);
        const url = URL.createObjectURL(blob);
        const fullImage = { ...img, url };
        setImage(fullImage);
      }
      setDefaultValues(selectedFiles[0]);
    } else {
      const picTheSame = selectedFiles.every(
        (f) => f.attachedPicture === selectedFiles[0].attachedPicture
      );
      if (picTheSame) {
        const img = selectedFiles[0].attachedPicture;
        if (!img) {
          setImage(null);
          return;
        }
        if (typeof img === "string") {
          setImage(null);
          return;
        }
        if (!img.buffer) {
          setImage(null);
          return;
        }
        if (!img.mime) {
          setImage(null);
          return;
        }
        if (typeof img.mime !== "string") {
          setImage(null);
          return;
        }
        const blob = new Blob([img.buffer as BlobPart]);
        const url = URL.createObjectURL(blob);
        const fullImage = { ...img, url };
        setImage(fullImage);
      }
      const defaultValue = neededItems.reduce<{ [key: string]: string }>((obj, v) => {
        obj[v.value] = "";
        return obj;
      }, {});

      neededItems.forEach((item) => {
        const values = selectedFiles.map((f) => f[item.value]) as string[];
        const first = values[0];
        const same = values.every((v) => v === first);
        if (!same) {
          defaultValue[item.value] = "...";
        } else {
          defaultValue[item.value] = first;
        }
      });

      setDefaultValues(defaultValue);
    }
  }, [selected, files, neededItems]);

  return (
    <div className="py-2 px-4">
      <div className="text-muted-foreground text-md flex flex-col capitalize px-6">
        {disabled
          ? "No file selected"
          : bottombar && (
              <div className="flex flex-row  truncate">
                &gt;&nbsp;Editing&nbsp;
                {/* {selected.length > 1
                  ? `${selected.length} files`
                  : (files.find((f) => f.path === selected[0])?.audioFile?.fileName ?? "1 file")} */}
              </div>
            )}
      </div>
      <div className={`flex px-6`}>
        {bottombar && (
          <ContextMenuHandler contextMenuContent={<ImageContextMenu />}>
            <img
              src={image ? image.url : Img}
              onDoubleClick={async () => {
                const img = await window.app.uploadImage();

                if (!img) return;
                if (!img.buffer) return;
                setChanges({
                  ...changes,
                  attachedPicture: {
                    mime: img.mime,
                    buffer: img.buffer,
                    type: img.type,
                    description: img.description,
                  },
                });

                const blob = new Blob([img.buffer as BlobPart]);
                const url = URL.createObjectURL(blob);
                const fullImage = { ...img, url };

                setImage(fullImage);
              }}
              className="aspect-square h-48"
            ></img>
          </ContextMenuHandler>
        )}
        {defaultValues && (
          <div
            className={`${bottombar ? "grid  px-6 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6" : "flex flex-col gap-3 px-2"} w-full`}
          >
            {neededItems.map((item) =>
              item.value !== "album" ? (
                <div
                  key={item.value}
                  className={`text-foreground text-md flex flex-col capitalize ${
                    disabled ? "opacity-50" : ""
                  }`}
                >
                  {item.label}
                  <div className="flex gap-2">
                    <Input
                      placeholder={item.label}
                      disabled={disabled}
                      maxLength={item.maxLength}
                      minLength={item.maxLength}
                      value={
                        selected.length > 0
                          ? changes[item.value] === "" || changes[item.value]
                            ? changes[item.value]
                            : defaultValues[item.value]
                          : ""
                      }
                      onChange={(e) => setChanges({ ...changes, [item.value]: e.target.value })}
                    />

                    {item.value === "album" && (
                      <div className="text-sm text-muted-foreground items-center flex justify-center px-2  bg-hover hover:bg-opacity-30 rounded">
                        <ChevronDown size={18} />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  key={item.value}
                  className={`text-foreground text-md flex flex-col capitalize ${
                    disabled ? "opacity-50" : ""
                  }`}
                >
                  {item.label}
                  <div className="flex gap-2">
                    <Input
                      placeholder={item.label}
                      disabled={disabled}
                      maxLength={item.maxLength}
                      minLength={item.maxLength}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                      value={
                        selected.length > 0
                          ? changes[item.value] === "" || changes[item.value]
                            ? changes[item.value]
                            : defaultValues[item.value]
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setChanges({ ...changes, [item.value]: value });
                        const albumNames = config.albums.map((s) => s.album.toLowerCase());
                        const filter = albumNames.filter((s) =>
                          s.toLowerCase().includes(value.toLowerCase())
                        );
                        console.log({ filter });
                        const filtered = config.albums.filter((s) =>
                          filter.includes(s.album.toLowerCase())
                        );
                        setFilteredSuggestions(filtered);
                        setShowSuggestions(true);
                      }}
                    />

                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute  z-10 bg-popover text-foreground shadow-md rounded w-[20%] max-h-40 overflow-auto mt-12 py  x border border-border">
                        {filteredSuggestions.map((album, i) => (
                          <div
                            onMouseDown={() => {
                              console.log("clicked");
                              selected.forEach((s) => {
                                window.app.addToAlbum({ albumId: album.id, filePath: s });
                                setShowSuggestions(false);
                              });
                            }}
                            key={i}
                            className="py-1 hover:bg-accent cursor-pointer flex gap-1 items-center"
                          >
                            {album.attachedPicture && (
                              <img
                                className="w-8 h-8 rounded"
                                src={URL.createObjectURL(
                                  new Blob([
                                    Buffer.from(album.attachedPicture.buffer, "base64") as BlobPart,
                                  ])
                                )}
                              ></img>
                            )}
                            {album.album}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {!bottombar && (
        <ContextMenuHandler contextMenuContent={<ImageContextMenu />}>
          <img
            src={image ? image.url : Img}
            onDoubleClick={async () => {
              const img = await window.app.uploadImage();

              if (!img) return;
              if (!img.buffer) return;
              setChanges({
                ...changes,
                attachedPicture: {
                  mime: img.mime,
                  buffer: img.buffer,
                  type: img.type,
                  description: img.description,
                },
              });

              const blob = new Blob([img.buffer as BlobPart]);
              const url = URL.createObjectURL(blob);
              const fullImage = { ...img, url };
              setImage(fullImage);
            }}
            className="w-full aspect-square self-center justify-self-center mt-4"
          ></img>
        </ContextMenuHandler>
      )}
      <Button className="mt-4" onClick={() => saveChanges()}>
        Save
      </Button>
    </div>
  );
}
interface Props {
  bottombar?: boolean;
}
