import { useChanges } from "../hooks/useChanges";
import { Input } from "./Input";
import { AllTags, TagPicture, UserConfig } from "@/ui/types";
import Img from "../assets/images/unknown.jpg";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "./Button";
import { ChevronDown } from "lucide-react";

import { useUserConfig } from "../hooks/useUserConfig";
import toast from "react-hot-toast";
import ImageManagerModal from "./ImageManagerModal";
import { invoke } from "@tauri-apps/api/core";
import ValueListEditor from "./ValueListEditor";

export default function EditMenu({ bottombar }: Props): ReactNode {
  const [image, setImage] = useState<TagPicture | null>(null);
  const [pictures, setPictures] = useState<TagPicture[]>([]);
  const [artworkOpen, setArtworkOpen] = useState(false);
  const [listEditor, setListEditor] = useState<{
    field: "artist" | "genre" | null;
    open: boolean;
  }>({ field: null, open: false });
  const { config } = useUserConfig();

  const [filteredSuggestions, setFilteredSuggestions] = useState<
    UserConfig["albums"]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { files, changes, setChanges, selected, neededItems } = useChanges();
  const [defaultValues, setDefaultValues] = useState<
    Record<
      string,
      | {
          value: string;
          type: "Text";
        }
      | TagPicture
      | undefined
    >
  >({});

  const disabled = selected.length === 0 || files.length === 0;

  useEffect(() => {
    setDefaultValues({});

    if (selected.length === 0) return;

    const sf = selected.map((fp) => {
      const file = files.find((f) => f.path === fp);

      if (!file) return;

      return file;
    });

    const sfs = sf
      .filter((item) => item !== null && item !== undefined)
      .filter((f) => f?.tags !== null)
      .filter((f) => f !== undefined || f !== null);

    const selectedFiles = sfs.map((f) => f?.tags);

    if (selectedFiles.length === 0) return;
    if (selectedFiles.length === 1) {
      if (!selectedFiles[0]) return;

      const img = selectedFiles[0].attachedPicture as TagPicture | undefined;
      const map: Record<string, { value: string; type: "Text" } | TagPicture> =
        {};

      Object.entries(selectedFiles[0]).forEach(([key, value]) => {
        if (value && typeof value === "object" && "value" in value) {
          map[key] = value as any;
        }
      });
      setDefaultValues(map);

      const selectedPath = selected[0];
      const fileObj = files.find((f) => f.path === selectedPath);
      const framePics: TagPicture[] = Array.isArray(
        (fileObj as any)?._frames?.attachedPicture
      )
        ? ((fileObj as any)._frames.attachedPicture as any[])
            .filter((v) => v && v.type === "Picture" && v.value)
            .map((v) => ({ type: "Picture", value: v.value }))
        : [];

      if (framePics.length > 0) {
        setPictures(framePics);
        setImage(framePics[0]);
      } else if (selectedFiles[0].attachedPicture && img && img.value) {
        setPictures([img]);
        setImage(img);
      } else {
        setPictures([]);
        setImage(null);
      }
    } else {
      const defaultValue: Record<
        string,
        | {
            value: string;
            type: "Text";
          }
        | TagPicture
        | undefined
      > = neededItems.reduce<
        Record<
          string,
          | {
              value: string;
              type: "Text";
            }
          | TagPicture
          | undefined
        >
      >((obj, v) => {
        obj[v.value] = { value: "", type: "Text" };
        return obj;
      }, {});

      neededItems.forEach((item) => {
        const values = selectedFiles.map((f) => f[item.value as keyof AllTags]);
        const first = values[0];

        const same = values.every(
          (v) => first && v && (v as any).value === (first as any).value
        );

        if (!same) {
          defaultValue[item.value] = { value: "...", type: "Text" } as any;
        } else if (first) {
          defaultValue[item.value] = first as any;
        }
      });

      setDefaultValues(defaultValue as any);
      const picTheSame = selectedFiles.every(
        (f) => f.attachedPicture === selectedFiles[0].attachedPicture
      );
      if (picTheSame) {
        const selectedPath = selected[0];
        const fileObj = files.find((f) => f.path === selectedPath);
        const framePics: TagPicture[] = Array.isArray(
          (fileObj as any)?._frames?.attachedPicture
        )
          ? ((fileObj as any)._frames.attachedPicture as any[])
              .filter((v) => v && v.type === "Picture" && v.value)
              .map((v) => ({ type: "Picture", value: v.value }))
          : [];
        if (framePics.length > 0) {
          setPictures(framePics);
          setImage(framePics[0]);
        } else {
          const img = selectedFiles[0].attachedPicture as
            | TagPicture
            | undefined;
          if (img && img.value) {
            setPictures([img]);
            setImage(img);
          } else {
            setPictures([]);
            setImage(null);
          }
        }
      }
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
              </div>
            )}
      </div>
      <div className={`flex px-6`}>
        {/* {bottombar && (
          <img
            src={(() => {
              const c = changes.attachedPicture as TagPicture | undefined;
              if (c?.type === "Picture") {
                return `data:${c.value.mime};base64,${c.value.data_base64}`;
              }
              return image
                ? `data:${image.value.mime};base64,${image.value.data_base64}`
                : Img;
            })()}
            onDoubleClick={async () => {
              // const img = await window.app.uploadImage();
              //
              // if (!img) return;
              // if (!img.buffer) return;
              // setChanges({
              //     ...changes,
              //     attachedPicture: {
              //         mime: img.mime,
              //         buffer: img.buffer,
              //         type: img.type,
              //         description: img.description,
              //     },
              // });
              //
              // const blob = new Blob([img.buffer as BlobPart]);
              // const url = URL.createObjectURL(blob);
              // const fullImage = { ...img, url };
              //
              // setImage(fullImage);
            }}
            className="aspect-square h-48"
            alt={"artwork"}
          ></img>
        )} */}
        {defaultValues && (
          <div
            className={`${
              bottombar
                ? "grid  px-6 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6"
                : "flex flex-col gap-3 px-2"
            } w-full`}
          >
            {neededItems.map((item) => {
              return item.value !== "album" ? (
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
                      onFocus={(e) => {
                        if (e.target.value === "...") {
                          e.target.select();
                        }
                      }}
                      value={
                        selected.length > 0
                          ? (changes[item.value as keyof AllTags]?.value ===
                              "" ||
                              changes[item.value as keyof AllTags]) &&
                            changes[item.value as keyof AllTags] !==
                              undefined &&
                            changes[item.value as keyof AllTags] !== null &&
                            typeof (changes as any)[item.value]?.value ===
                              "string"
                            ? ((changes as any)[item.value]?.value as string)
                            : defaultValues &&
                              (defaultValues[item.value] as any)?.value &&
                              typeof (defaultValues[item.value] as any)
                                ?.value === "string"
                            ? (defaultValues[item.value] as any).value
                            : ""
                          : ""
                      }
                      onChange={(e) =>
                        setChanges({
                          ...changes,
                          [item.value]: { value: e.target.value, type: "Text" },
                        })
                      }
                    />

                    {item.value === "album" && (
                      <div className="text-sm text-muted-foreground items-center flex justify-center px-2  bg-hover hover:bg-opacity-30 rounded">
                        <ChevronDown size={18} />
                      </div>
                    )}
                    {(item.value === "artist" || item.value === "genre") && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          disabled={disabled || selected.length !== 1}
                          onClick={() =>
                            setListEditor({
                              field: item.value as "artist" | "genre",
                              open: true,
                            })
                          }
                        >
                          Edit list
                        </Button>
                        {(() => {
                          if (selected.length !== 1) return null;
                          const f = files.find((ff) => ff.path === selected[0]);
                          const arr = f?._frames?.[item.value];
                          const textCount = Array.isArray(arr)
                            ? arr.filter((v: any) => v && v.type === "Text")
                                .length
                            : 0;
                          if (textCount > 1)
                            return (
                              <span className="text-[10px] px-1 rounded bg-muted text-foreground/70">
                                +{textCount - 1}
                              </span>
                            );
                          return null;
                        })()}
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
                      onFocus={(e) => {
                        if (e.target.value === "...") {
                          e.target.select();
                        }
                        setShowSuggestions(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 100)
                      }
                      value={
                        selected.length > 0
                          ? (changes as any)[item.value]?.value === "" ||
                            ((changes as any)[item.value] !== undefined &&
                              (changes as any)[item.value] !== null &&
                              typeof (changes as any)[item.value]?.value ===
                                "string")
                            ? (changes as any)[item.value]?.value
                            : defaultValues &&
                              (defaultValues[item.value] as any)?.value
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setChanges({
                          ...changes,
                          [item.value]: { value: value, type: "Text" },
                        });
                        const albumNames = config.albums.map((s) =>
                          s.album.toLowerCase()
                        );
                        const filter = albumNames.filter((s) =>
                          s.toLowerCase().includes(value.toLowerCase())
                        );

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
                              // selected.forEach((s) => {
                              //     // window.app.addToAlbum({ albumId: album.id, filePath: s });
                              //     setShowSuggestions(false);
                              // });
                            }}
                            key={i}
                            className="py-1 hover:bg-accent cursor-pointer flex gap-1 items-center"
                          >
                            {album.attached_picture && (
                              <img
                                className="w-8 h-8 rounded"
                                src={
                                  changes.attachedPicture &&
                                  (changes.attachedPicture as any).type ===
                                    "Picture"
                                    ? `data:${
                                        (changes.attachedPicture as TagPicture)
                                          .value.mime
                                      };base64,${
                                        (changes.attachedPicture as TagPicture)
                                          .value.data_base64
                                      }`
                                    : image
                                    ? `data:${image.value.mime};base64,${image.value.data_base64}`
                                    : Img
                                }
                              ></img>
                            )}
                            {album.album}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!bottombar && (
        <>
          <img
            src={(() => {
              const c = changes.attachedPicture as TagPicture | undefined;
              if (c?.type === "Picture") {
                return `data:${c.value.mime};base64,${c.value.data_base64}`;
              }
              return image
                ? `data:${image.value.mime};base64,${image.value.data_base64}`
                : Img;
            })()}
            onClick={async () => {
              const selectedFormats = selected
                .map((fp) => files.find((f) => f.path === fp))
                .filter(Boolean)
                .map((f) => (f as any).tag_format as string);
              const anyV1 = selectedFormats.some(
                (fmt) =>
                  typeof fmt === "string" &&
                  fmt.toLowerCase().startsWith("id3v1")
              );
              if (anyV1) {
                toast.error(
                  "ID3v1 doesn’t support embedded artwork. Select an ID3v2 file to add images."
                );
                return;
              }
              setArtworkOpen(true);
            }}
            className="w-full aspect-square self-center justify-self-center mt-4"
          ></img>
          <ImageManagerModal
            open={artworkOpen}
            onClose={() => setArtworkOpen(false)}
            pictures={pictures}
            onChange={(nextList) => {
              if (nextList.length === 0) {
                setImage(null);
                setPictures([]);
                invoke("save_frame_changes", {
                  frameChanges: {
                    paths: selected,
                    frames: [
                      {
                        key: "AttachedPicture",
                        values: [],
                      },
                    ],
                  },
                })
                  .then(() => toast.success("Artwork removed"))
                  .catch((e) =>
                    toast.error(`Failed to save artwork: ${String(e)}`)
                  );
                return;
              }
              setPictures(nextList);
              setImage(nextList[0]);
              invoke("save_frame_changes", {
                frameChanges: {
                  paths: selected,
                  frames: [
                    {
                      key: "AttachedPicture",
                      values: nextList,
                    },
                  ],
                },
              })
                .then(() => toast.success("Artwork updated"))
                .catch((e) =>
                  toast.error(`Failed to save artwork: ${String(e)}`)
                );
            }}
          />
          <ValueListEditor
            open={listEditor.open}
            title={listEditor.field === "artist" ? "Artists" : "Genres"}
            values={(() => {
              if (!listEditor.open || selected.length !== 1) return [];
              const f = files.find((ff) => ff.path === selected[0]);
              if (!f || !f._frames) return [];
              const key = listEditor.field === "artist" ? "artist" : "genre";
              const arr = (f._frames as any)[key] as Array<any> | undefined;
              if (!Array.isArray(arr)) return [];
              return arr
                .filter(
                  (v) => v && v.type === "Text" && typeof v.value === "string"
                )
                .map((v) => v.value as string);
            })()}
            onClose={() => setListEditor({ field: null, open: false })}
            onSave={(vals) => {
              if (!listEditor.field) return;
              const keyVariant =
                listEditor.field === "artist" ? "Artist" : "Genre";
              invoke("save_frame_changes", {
                frameChanges: {
                  paths: selected,
                  frames: [
                    {
                      key: keyVariant,
                      values: vals
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0)
                        .map((s) => ({ type: "Text", value: s })),
                    },
                  ],
                },
              })
                .then(() => {
                  toast.success("Saved");
                  setListEditor({ field: null, open: false });
                })
                .catch((e) => toast.error(`Failed to save: ${String(e)}`));
            }}
          />
        </>
      )}
    </div>
  );
}

interface Props {
  bottombar?: boolean;
}
