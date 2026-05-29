import { useEffect, useState } from "react";
import { path } from "@tauri-apps/api";
import { Modal, useAnimatedModalClose } from "./Modal";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "../Input";
import { Column, SerializableTagFrameValue, TagPicture } from "@/ui/types";
import { Ellipsis } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../Dropdown";
import { Button } from "../Button";
import { col } from "framer-motion/client";
type FolderConfig = {
  default_values: Record<string, SerializableTagFrameValue>;
  path_pattern: string | null;
};

interface FolderConfigModalProps {
  open: boolean;
  onClose: () => void;
  folderPath: string;
}

export function FolderConfigModal({
  open,
  onClose,
  folderPath,
}: FolderConfigModalProps) {
  const { closing, requestClose } = useAnimatedModalClose(onClose, 160);
  const [loadingg, setLoading] = useState(true);
  const [columns, setColumns] = useState<Column[]>([]);

  const [config, setConfig] = useState<FolderConfig>({
    default_values: {},
    path_pattern: null,
  });
  useEffect(() => {
    console.log({ open });
    if (open) {
      setLoading(true);
      invoke<FolderConfig>("get_folder_config", { path: folderPath }).then(
        (cfg) => {
          setConfig(cfg);
          console.log({ cfg });

          invoke<Column[]>("get_all_columns", { remove: true }).then((cols) => {
            setColumns(cols);
          });
          setLoading(false);
        },
      );

      // invoke("save_folder_config", {
      //   path: folderPath,
      //   config: {
      //     path_pattern: null,
      //     default_values: {
      //       title: {
      //         type: "Text",
      //         value: "New Title",
      //       },
      //     },
      //   },
      // }).then(() => {});
    }
  }, [open]);
  if (loadingg || !config) {
    return <></>;
  }
  const colsAdded = new Set(Object.keys(config.default_values));
  const columnsNotAdded = columns
    .filter((col) => colsAdded.has(col.value) === false)
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Modal
      open={open}
      onClose={requestClose}
      closing={closing}
      title={`Configure Folder: ${folderPath.split(path.sep()).pop()}`}
      description="Change default tag values for new files in this folder."
      bodyClassName="p-0"
      footer={
        <div className="ml-auto">
          <Button
            onClick={() =>
              invoke("set_folder_config", { config, path: folderPath })
            }
          >
            Save
          </Button>
        </div>
      }
    >
      <div className="">
        {loadingg && <p>Loading...</p>}
        {!loadingg && config && (
          <div className="p-4 flex flex-col gap-y-5">
            <div className="flex ">
              <h3 className="font-bold mb-2">Default Tag Values</h3>
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button asChild variant="outline" size="sm">
                      <div> Add Default Value</div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-999999">
                    {columnsNotAdded.map((col) => (
                      <DropdownMenuItem
                        key={col.value}
                        onClick={() => {
                          const defaultValue: SerializableTagFrameValue =
                            col.kind === "Image"
                              ? {
                                  type: "Picture",
                                  value: {
                                    data_base64: "",
                                    mime: "image/jpeg",
                                  },
                                }
                              : { type: "Text", value: "" };

                          setConfig((prevConfig) => ({
                            ...prevConfig,
                            default_values: {
                              ...prevConfig.default_values,
                              [col.value]: defaultValue,
                            },
                          }));
                        }}
                      >
                        {col.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {Object.entries(config.default_values).map(([key, val]) => (
              <div key={key} className="mb-2 flex">
                {val.type === "Text" && (
                  <div className="flex flex-col w-full">
                    <label className="block text-sm font-medium mb-1">
                      {(columns.find((col) => col.value === key)?.label || key)
                        .substring(0, 1)
                        .toUpperCase() +
                        (
                          columns.find((col) => col.value === key)?.label || key
                        ).substring(1)}
                    </label>
                    <Input
                      value={config.default_values[key].value as string}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setConfig((prevConfig) => ({
                          ...prevConfig,
                          default_values: {
                            ...prevConfig.default_values,
                            [key]: {
                              type: "Text",
                              value: newValue,
                            },
                          },
                        }));
                      }}
                    />
                  </div>
                )}
                {val.value && val.type === "Picture" && (
                  <div className="flex flex-col w-full">
                    <label className="block text-sm font-medium mb-1">
                      {(columns.find((col) => col.value === key)?.label || key)
                        .substring(0, 1)
                        .toUpperCase() +
                        (
                          columns.find((col) => col.value === key)?.label || key
                        ).substring(1)}
                    </label>
                    <div>
                      <Button
                        onClick={async () => {
                          const img: TagPicture | null =
                            await invoke("import_image");
                          if (!img) return;
                          setConfig((prevConfig) => ({
                            ...prevConfig,
                            default_values: {
                              ...prevConfig.default_values,
                              [key]: img,
                            },
                          }));
                        }}
                        variant={"default"}
                      >
                        Upload Image
                      </Button>
                    </div>
                    <img
                      src={`data:${val.value.mime};base64,${val.value.data_base64}`}
                      className="h-20 w-20 object-cover rounded"
                    />
                  </div>
                )}
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Ellipsis />{" "}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="z-999999">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          const newConfig = { ...config };
                          delete newConfig.default_values[key];
                          setConfig(newConfig);
                        }}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loadingg && !config && <p>No config found for this folder.</p>}
      </div>
    </Modal>
  );
}
