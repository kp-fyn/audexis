import React, { useEffect, useRef } from "react";
import { useSidebarWidth } from "../hooks/useSidebarWidth";
import useWindowDimensions from "../hooks/useWindowDimensions";
import { useChanges } from "../hooks/useChanges";
import { Input } from "./input";
import { AudioFile, FullImage } from "@/types";
import { useImage } from "react-image";
// import useClickOutside from "../hooks/useClickOutside";
import { Button } from "./button";
import ContextMenuHandler from "./ContextMenuHandler";
import ImageContextMenu from "./contextMenus/ImageContextMenu";

export default function Sidebar() {
  const { sidebarWidth, setSidebarWidth } = useSidebarWidth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const [image, setImage] = React.useState<FullImage | null>(null);
  const {
    files,
    saveChanges,
    changes,
    setChanges,
    selected,
    neededItems,
    setImageData,
  } = useChanges();
  const disabled = selected.length === 0 || files.length === 0;
  const { width } = useWindowDimensions();
  const [defaultValues, setDefaultValues] =
    React.useState<Partial<AudioFile>>();

  const startResizing = (_event: React.MouseEvent) => {
    isResizing.current = true;
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (event: MouseEvent) => {
    if (isResizing.current && sidebarRef.current) {
      const newWidth = event.clientX;
      const minWidth = 200;
      const maxWidth = window.innerWidth - 200;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(`${newWidth}px`);
      }
    }
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.body.style.userSelect = ""; // Re-enable selection

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
      const defaultValue = neededItems.reduce<{ [key: string]: string }>(
        (obj, v) => {
          obj[v.value] = "";
          return obj;
        },
        {}
      );

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
  }, [selected, files]);

  const { src } = useImage({
    srcList: [image?.url ?? "static://images/unknown.jpg"],
  });

  return (
    <div
      ref={sidebarRef}
      style={{
        width: `${sidebarWidth}`,
        minWidth: "300px",
        maxWidth: `${width - 200} px`,
      }}
      className="fixed top-0 left-0 h-screen z-[9999999] bg-background  text-white p-4 overflow-y-auto"
    >
      <div className="mt-12 py-2">
        {defaultValues && (
          <>
            {neededItems.map((item) => (
              <div
                key={item.value}
                className={`text-white text-md flex flex-col capitalize ${
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
                    changes[item.value] === "" || changes[item.value]
                      ? changes[item.value]
                      : defaultValues[item.value]
                  }
                  onChange={(e) =>
                    setChanges({ ...changes, [item.value]: e.target.value })
                  }
                />
              </div>
            ))}
          </>
        )}
        <ContextMenuHandler contextMenuContent={<ImageContextMenu />}>
          <img
            src={src}
            onDoubleClick={async () => {
              const img = await window.app.uploadImage();
              if (!img) return;
              if (!img.buffer) return;

              const blob = new Blob([img.buffer]);
              const url = URL.createObjectURL(blob);
              const fullImage = { ...img, url };
              setImage(fullImage);
              setImageData(img);
            }}
            className="w-full aspect-square"
          ></img>
        </ContextMenuHandler>

        <Button onClick={saveChanges}>Save</Button>
      </div>
      <div className="h-full bg-white fixed top-0 "></div>

      <div
        style={{ left: sidebarWidth }}
        className={`fixed top-0 bottom-0  h-screen w-[6px] cursor-col-resize  bg-gray-700 hover:bg-gray-500`}
        onMouseDown={startResizing}
      />
    </div>
  );
}
