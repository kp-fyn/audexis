import React, { ReactNode, useEffect, useRef } from "react";
import { useSidebarWidth } from "../hooks/useSidebarWidth";
import useWindowDimensions from "../hooks/useWindowDimensions";
import { useChanges } from "../hooks/useChanges";
import { Input } from "./input";
import { AudioFile, FullImage } from "../../../types";
import Img from "../assets/images/unknown.jpg";
// import useClickOutside from "../hooks/useClickOutside";
import { Button } from "./button";
import ContextMenuHandler from "./ContextMenuHandler";
import ImageContextMenu from "./contextMenus/ImageContextMenu";

export default function Sidebar(): ReactNode {
  const { sidebarWidth, setSidebarWidth } = useSidebarWidth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const [image, setImage] = React.useState<FullImage | null>(null);
  const { files, changes, saveChanges, setChanges, selected, neededItems } = useChanges();
  const disabled = selected.length === 0 || files.length === 0;
  const { width } = useWindowDimensions();
  const [defaultValues, setDefaultValues] = React.useState<Partial<AudioFile>>();

  const startResizing = (): void => {
    isResizing.current = true;
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (event: MouseEvent): void => {
    if (isResizing.current && sidebarRef.current) {
      const newWidth = event.clientX;
      const minWidth = 0;
      const maxWidth = window.innerWidth - 200;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(`${newWidth}px`);
      }
    }
  };

  const stopResizing = (): void => {
    isResizing.current = false;
    document.body.style.userSelect = "";

    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  };
  useEffect(() => {
    if (!changes) return;
    if (!changes.attachedPicture) return;
    if (!changes.attachedPicture?.buffer) {
      setImage(null);
      return;
    }
    if (!changes.attachedPicture?.mime) {
      setImage(null);
      return;
    }
    if (typeof changes.attachedPicture?.mime !== "string") {
      setImage(null);
      return;
    }
    const blob = new Blob([changes.attachedPicture.buffer]);
    const url = URL.createObjectURL(blob);
    const fullImage = { ...changes.attachedPicture, url };
    setImage(fullImage);
  }, [changes]);

  useEffect(() => {
    // const selectedFile = files.find((f) => f.path === selected[0]);
    setDefaultValues({});
    setImage(null);
    if (selected.length === 0) return;

    const sf = selected.map((fp) => {
      const file = files.find((f) => f.path === fp);
      if (!file) return;

      return file;
    });

    const selectedFiles = sf.filter((f) => f !== null) as AudioFile[];
    if (selectedFiles.length === 0) return;
    if (selectedFiles.length === 1) {
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

        const blob = new Blob([img.buffer]);
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
        const blob = new Blob([img.buffer]);
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

  // const { src } = useImage({
  //   srcList: [image?.url ?? "../assets/images/unknown.jpg"]
  // });

  return (
    <div
      ref={sidebarRef}
      style={{
        width: `${sidebarWidth}`,
        // minWidth: "300px",
        maxWidth: `${width - 200} px`,
      }}
      className="fixed pb-12 top-12 left-0 h-screen z-[9999] bg-background  text-foreground overflow-y-auto"
    >
      <div className="m py-2  ">
        {defaultValues && (
          <div className="flex flex-col gap-3 px-2">
            {neededItems.map((item) => (
              <div
                key={item.value}
                className={`text-foreground text-md flex flex-col capitalize ${
                  disabled ? "opacity-50" : ""
                }`}
              >
                {item.label}
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
              </div>
            ))}
          </div>
        )}

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

              const blob = new Blob([img.buffer]);
              const url = URL.createObjectURL(blob);
              const fullImage = { ...img, url };
              setImage(fullImage);
            }}
            className="w-full aspect-square self-center justify-self-center mt-4"
          ></img>
        </ContextMenuHandler>
        <Button className="mt-4" onClick={() => saveChanges()}>
          Save
        </Button>
      </div>

      <div
        style={{ marginLeft: `${sidebarWidth}` }}
        className={`fixed top-12 bottom-0  h-screen w-[6px] cursor-col-resize  bg-background hover:bg-border `}
        onMouseDown={startResizing}
      >
        <div className="border-r h-screen border-border "></div>
      </div>
    </div>
  );
}
