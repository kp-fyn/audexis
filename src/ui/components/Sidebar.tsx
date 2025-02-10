import React, { useEffect, useRef } from "react";
import { useSidebarWidth } from "../hooks/useSidebarWidth";
import useWindowDimensions from "../hooks/useWindowDimensions";
import { useChanges } from "../hooks/useChanges";
import { Input } from "./input";
import { AudioFile } from "@/types";
import useClickOutside from "../hooks/useClickOutside";
import { Button } from "./button";

export default function Sidebar() {
  const sidebarRef = useClickOutside(handleClickOutside);
  const isResizing = useRef(false);
  const { sidebarWidth, setSidebarWidth } = useSidebarWidth();
  const { files, saveChanges, changes, setChanges, selected, neededItems } =
    useChanges();
  const disabled = selected.length === 0 || files.length === 0;
  const [defaultValues, setDefaultValues] =
    React.useState<Partial<AudioFile>>();

  const startResizing = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", resizeSidebar);
    document.addEventListener("mouseup", stopResizing);
  };
  const { width } = useWindowDimensions();

  const resizeSidebar = (event: MouseEvent) => {
    if (isResizing.current && sidebarRef.current) {
      const newWidth =
        event.clientX - sidebarRef.current.getBoundingClientRect().left;

      setSidebarWidth(`${newWidth}px`);
    }
  };
  useEffect(() => {
    setDefaultValues({});
    if (selected.length === 0) return;

    const sf = selected.map((fp) => {
      const file = files.find((f) => f.path === fp);
      if (!file) return null;
      return file;
    });
    const selectedFiles = sf.filter((f) => f !== null) as AudioFile[];
    if (selectedFiles.length === 0) return;
    if (selectedFiles.length === 1) {
      setDefaultValues(selectedFiles[0]);
    } else {
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

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", resizeSidebar);
    document.removeEventListener("mouseup", stopResizing);
  };

  return (
    <div className="fixed  h-screen z-50">
      <div
        ref={sidebarRef}
        style={{
          width: sidebarWidth,
          minWidth: "300px",
          maxWidth: `${width - 200} px`,
        }}
        className="bg-neutral-950  text-white  p-4 relative flex  gap-y-4 flex-col h-full"
      >
        {defaultValues && (
          <div>
            {neededItems.map((item) => (
              <div
                key={item}
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
          </div>
        )}
        <Button onClick={saveChanges}>Save</Button>
        <div
          className="absolute top-0 right-0 h-full w-[2px] cursor-col-resize bg-gray-700"
          onMouseDown={startResizing}
        ></div>
      </div>
    </div>
  );
  // save Changes doesnt work with click outside yet using button for now
  function handleClickOutside() {
    doNothing();
  }
}
function doNothing() {
  return;
}
