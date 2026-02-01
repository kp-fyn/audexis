import { useChanges } from "../hooks/useChanges";
import { Input } from "./Input";
import { AllTags, SerializableTagFrameValue, TagPicture } from "@/ui/types";
import Img from "../assets/images/unknown.jpg";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "./Button";

import { useUserConfig } from "../hooks/useUserConfig";
import toast from "react-hot-toast";
import ImageManagerModal from "./modals/ImageManagerModal";
import { invoke } from "@tauri-apps/api/core";
import ValueListEditor from "./modals/ValueListEditor";

export default function EditMenu({ bottombar }: Props): ReactNode {
  const [image, setImage] = useState<TagPicture | null>(null);
  const [pictures, setPictures] = useState<TagPicture[]>([]);
  const [artworkOpen, setArtworkOpen] = useState(false);
  const [listEditor, setListEditor] = useState<{
    field: string | null;
    open: boolean;
  }>({ field: null, open: false });
  const { config, multiFrameKeys, allSidebarItems } = useUserConfig();

  const { files, changes, setChanges, selected } = useChanges();
  const [defaultValues, setDefaultValues] = useState<
    Record<string, SerializableTagFrameValue>
  >({});
  const sidebar_items = config.sidebar_items;

  const disabled = false;

  useEffect(() => {
    setDefaultValues({});
    // console.log(defaultValues);

    if (selected.length === 0) return;

    const sf = selected.map((fp) => {
      const file = files.find((f) => f.path === fp);

      if (!file) return;

      return file;
    });

    // console.log(sf);
    const sfs = sf
      .filter((item) => item !== null && item !== undefined)
      .filter((f) => f?.frames !== null)
      .filter((f) => f !== undefined || f !== null);

    const selectedFiles = sfs.map((f) => f.frames);

    if (selectedFiles.length === 0) return;
    if (selectedFiles.length === 1) {
      const map: Record<string, SerializableTagFrameValue> = {};

      allSidebarItems.map((key) => {
        map[key.value] = { value: "", type: "Text" };
      });

      Object.entries(selectedFiles[0]).forEach(([key, value]) => {
        // console.log({ value });
        if (Array.isArray(value) && value.length > 0) {
          map[key] = value[0];
        }
      });
      console.log({ map });

      setDefaultValues(map);

      const selectedPath = selected[0];
      const fileObj = files.find((f) => f.path === selectedPath);
      const framePics: TagPicture[] = Array.isArray(
        (fileObj as any)?.frames?.attachedPicture,
      )
        ? ((fileObj as any).frames.attachedPicture as any[])
            .filter((v) => v && v.type === "Picture" && v.value)
            .map((v) => ({ type: "Picture", value: v.value }))
        : [];
      console.log({ framePics });
      if (framePics.length > 0) {
        setPictures(framePics);
        setImage(framePics[0]);
      } else if (selectedFiles[0].attachedPicture) {
        if (!selectedFiles[0]) return;
        if (!selectedFiles[0].attachedPicture) return;

        const img = selectedFiles[0].attachedPicture[0] as
          | TagPicture
          | undefined;
        if (!img) return;
        if (!img.value) return;

        setPictures([img]);
        setImage(img);
      } else {
        setPictures([]);
        setImage(null);
      }
    } else {
      const defaultValue: Record<
        string,
        SerializableTagFrameValue | undefined
      > = sidebar_items.reduce<
        Record<string, SerializableTagFrameValue | undefined>
      >((obj, v) => {
        obj[v.value] = { value: "", type: "Text" };
        return obj;
      }, {});

      Object.entries(
        allSidebarItems.map((key) => {
          defaultValue[key.value] = { value: "", type: "Text" };
        }),
      );
      sidebar_items.forEach((item) => {
        const values = selectedFiles.map((f) => f[item.value as keyof AllTags]);
        const first = values[0];

        const same = values.every(
          (v) => first && v && (v[0].value as any) === first[0].value,
        );

        if (!same) {
          defaultValue[item.value] = { value: "...", type: "Text" } as any;
        } else if (first) {
          defaultValue[item.value] = first as any;
        }
      });

      setDefaultValues(defaultValue as any);
      const picTheSame = selectedFiles.every(
        (f) => f.attachedPicture === selectedFiles[0].attachedPicture,
      );
      if (picTheSame) {
        const selectedPath = selected[0];
        const fileObj = files.find((f) => f.path === selectedPath);
        const framePics: TagPicture[] = Array.isArray(
          (fileObj as any)?.frames?.attachedPicture,
        )
          ? ((fileObj as any).frames.attachedPicture as any[])
              .filter((v) => v && v.type === "Picture" && v.value)
              .map((v) => ({ type: "Picture", value: v.value }))
          : [];
        if (framePics.length > 0) {
          setPictures(framePics);
          setImage(framePics[0]);
        } else {
          if (!selectedFiles[0].attachedPicture) return;
          const img = selectedFiles[0].attachedPicture[0] as
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
  }, [selected, files, sidebar_items]);

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
        {defaultValues && (
          <div
            className={`${
              bottombar
                ? "grid  px-6 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6"
                : "flex flex-col gap-3 px-2"
            } w-full`}
          >
            {sidebar_items.map((item) => {
              return (
                item.item_type != "Image" && (
                  <div
                    key={item.value}
                    className={`text-foreground text-md flex flex-col capitalize ${
                      disabled ? "opacity-50" : ""
                    }`}
                  >
                    {item.label}
                    <div className="flex gap-2">
                      {/* {multiFrameKeys.includes(item.value) ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            disabled={disabled || selected.length !== 1}
                            onClick={() =>
                              setListEditor({
                                field: item.value,
                                open: true,
                              })
                            }
                          >
                            Edit list
                          </Button>
                          {(() => {
                            if (selected.length !== 1) return null;
                            const f = files.find(
                              (ff) => ff.path === selected[0],
                            );
                            const arr = f?.frames?.[item.value];
                            const textCount = Array.isArray(arr)
                              ? arr.filter((v: any) => v && v.type === "Text")
                                  .length
                              : 0;
                            if (textCount > 0)
                              return (
                                <span className="text-[10px] px-1 rounded bg-muted text-foreground/70">
                                  {textCount} items
                                </span>
                              );
                            return null;
                          })()}
                        </div>
                      ) : ( */}
                      <Input
                        placeholder={item.label}
                        disabled={disabled}
                        onFocus={(e) => {
                          if (e.target.value === "...") {
                            e.target.select();
                          }
                        }}
                        value={(() => {
                          let df: string = "";
                          if (selected.length > 0) {
                            if (
                              changes[item.value] &&
                              changes[item.value][0] &&
                              typeof changes[item.value][0].value === "string"
                            ) {
                              df = changes[item.value][0].value as string;
                            } else {
                              if (
                                defaultValues[item.value] &&
                                defaultValues[item.value].value &&
                                typeof defaultValues[item.value].value ===
                                  "string"
                              ) {
                                df = defaultValues[item.value].value as string;
                              }
                            }
                          }
                          return df;
                        })()}
                        onChange={(e) => {
                          let v = changes[item.value];
                          if (!v) {
                            v = [];
                          }

                          const newItem = {
                            value: e.target.value,
                            type: "Text" as const,
                          };
                          v[0] = newItem;
                          setChanges({
                            ...changes,
                            [item.value]: v,
                          });
                        }}
                      />
                      {multiFrameKeys.includes(item.value) &&
                        selected.length === 1 && (
                          <Button
                            variant="outline"
                            disabled={disabled}
                            onClick={() =>
                              setListEditor({
                                field: item.value,
                                open: true,
                              })
                            }
                          >
                            Edit list
                          </Button>
                        )}
                      {/* )} */}
                    </div>
                  </div>
                )
              );
            })}
          </div>
        )}
      </div>

      {!bottombar && (
        <>
          <img
            src={(() => {
              if (image) {
                return `data:${image.value.mime};base64,${image.value.data_base64}`;
              }
              if (!changes) return Img;
              if (!changes.attachedPicture) return Img;
              const c = changes.attachedPicture[0];
              if (!c) return Img;
              if (c?.type === "Picture") {
                return `data:${c.value.mime};base64,${c.value.data_base64}`;
              }
              return Img;
            })()}
            onClick={async () => {
              const selectedFormats = selected
                .map((fp) => files.find((f) => f.path === fp))
                .filter(Boolean)
                .map((f) => (f as any).tag_format as string);
              const anyV1 = selectedFormats.some(
                (fmt) =>
                  typeof fmt === "string" &&
                  fmt.toLowerCase().startsWith("id3v1"),
              );
              if (anyV1) {
                toast.error(
                  "ID3v1 doesn’t support embedded artwork. Select an ID3v2 file to add images.",
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
                        key: "attachedPicture",
                        values: [],
                      },
                    ],
                  },
                })
                  .then(() => toast.success("Artwork removed"))
                  .catch((e) =>
                    toast.error(`Failed to save artwork: ${String(e)}`),
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
                      key: "attachedPicture",
                      values: nextList,
                    },
                  ],
                },
              })
                .then(() => toast.success("Artwork updated"))
                .catch((e) =>
                  toast.error(`Failed to save artwork: ${String(e)}`),
                );
            }}
          />
          <ValueListEditor
            open={listEditor.open}
            title={
              listEditor.field ? `Edit ${listEditor.field}` : "Edit Values"
            }
            values={(() => {
              if (!listEditor.open || selected.length !== 1) return [];
              const f = files.find((ff) => ff.path === selected[0]);
              if (!f || !f.frames) return [];
              const key = listEditor.field;
              if (!key) return [];
              const arr = (f.frames as any)[key] as Array<any> | undefined;
              if (!Array.isArray(arr)) return [];
              return arr
                .filter(
                  (v) => v && v.type === "Text" && typeof v.value === "string",
                )
                .map((v) => v.value as string);
            })()}
            onClose={() => setListEditor({ field: null, open: false })}
            onSave={(vals) => {
              if (!listEditor.field) return;

              invoke("save_frame_changes", {
                frameChanges: {
                  paths: selected,
                  frames: [
                    {
                      key: listEditor.field,
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
