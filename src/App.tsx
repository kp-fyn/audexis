// export default  function App() {
//   return (
//     <div></div>
//   )
// }
import Header from "@/components/Header";
import { useSidebarWidth } from "@/contexts/Sidbear";
import Sidebar from "@/components/Sidebar";
import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import Track from "@/components/Track";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useChanges } from "@/contexts/Changes";
import { useOnClickOutside } from "usehooks-ts";

function App() {
  const [previous, setPrevious] = useState<number>(0);

  const [keyCode, setKeyCode] = useState<number>(-1);

  const sidebarWidth = useSidebarWidth();
  const fileList = useRef<HTMLDivElement>(null);
  const SidebarRef = useRef<HTMLDivElement>(null);
  const { setChanges, index, setIndex, files, setFiles, saveChanges } =
    useChanges();

  const handleClickOutside = () => {
    saveChanges();
  };
  useOnClickOutside(SidebarRef, handleClickOutside);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown" && event.shiftKey) {
      setKeyCode(0);

      let i = previous + 1;

      if (!files[i]) return;

      if (!i) return;

      if (index.includes(i)) {
        if (Math.max(...index) === previous) {
          setPrevious(i);
          i++;
        } else {
          const newSelection = index.slice();
          const closest = (arr: number[], n: number) =>
            arr.reduce((prev, curr) =>
              Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev
            );
          const closestIndex = closest(index, i - 1);
          const findIndex = index.findIndex((x) => x === closestIndex);

          if (findIndex === -1) return;

          newSelection.splice(findIndex, 1);

          setIndex(newSelection);
          setPrevious(i);
          return;
        }
      }
      if (!files[previous]) setPrevious(0);

      const { highest, lowest } = getHighest(previous, i);
      const r = range(lowest, highest);

      setIndex((prevIndex) => [...new Set([...prevIndex, ...r])]);
      setPrevious(i);
    } else if (event.key === "ArrowUp" && event.shiftKey) {
      setKeyCode(0);
      let i = previous - 1;
      if (i === -1 && files.length > 1 && files[files.length - 1]) {
        i = files.length - 1;
        setPrevious(0);
      }
      if (!files[i]) return;

      if (index.includes(i)) {
        if (Math.min(...index) === previous) {
          setPrevious(i);
          i--;
        } else {
          const newSelection = index.slice();
          const closest = (arr: number[], n: number) =>
            arr.reduce((prev, curr) =>
              Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev
            );
          const closestIndex = closest(index, i + 1);
          const findIndex = index.findIndex((x) => x === closestIndex);
          if (findIndex === -1) return;

          newSelection.splice(findIndex, 1);

          setIndex(newSelection);
          setPrevious(i);
          return;
        }
      }

      if (!files[previous]) setPrevious(0);

      const { highest, lowest } = getHighest(previous, i);
      const r = range(lowest, highest);
      if (previous === 0 && i === files.length - 1) {
        setIndex((prevIndex) => [
          ...new Set([...prevIndex, 0, files.length - 1]),
        ]);
        setPrevious(i);
      } else {
        setIndex((prevIndex) => [...new Set([...prevIndex, ...r])]);
        setPrevious(i);
      }
    } else if (event.key === "Shift") {
      setKeyCode(0);
    } else if (event.key === "Control" || event.key === "Meta") {
      setKeyCode(1);
    } else {
      setKeyCode(-1);
      if (event.key === "ArrowDown") {
        if ((!index.length && files.length) || files.length === 1)
          return setIndex([0]);
        if (
          index[index.length - 1] === files.length - 1 &&
          files.length > 1 &&
          files[0]
        ) {
          setPrevious(files.length - 1);
          setIndex([0]);
        } else {
          setPrevious(
            index[index.length - 1] < files.length - 1
              ? index[index.length - 1]
              : files.length - 1
          );
          setIndex((prevIndex) =>
            prevIndex[prevIndex.length - 1] < files.length - 1
              ? [prevIndex[prevIndex.length - 1] + 1]
              : [files.length - 1]
          );
        }
      } else if (event.key === "ArrowUp") {
        if ((!index.length && files.length) || files.length === 1)
          return setIndex([0]);
        if (
          index[index.length - 1] === 0 &&
          files.length > 1 &&
          files[files.length - 1]
        ) {
          setPrevious(0);
          setIndex([files.length - 1]);
        } else {
          setPrevious(index[index.length - 1 > 0 ? index.length - 1 : 0]);
          setIndex((prevIndex) =>
            prevIndex[prevIndex.length - 1] > 0
              ? [prevIndex[prevIndex.length - 1] - 1]
              : [0]
          );
        }
      }
    }
  };
  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Shift") {
      setKeyCode(-1);
    } else if (event.key === "Control" || event.key === "Meta") {
      setKeyCode(-1);
    }
  };
  useEffect(() => {
    if (files.length === 0) setIndex([]);
    if (files.length > 0) setIndex([0]);
  }, [files]);

  useEffect(() => {
    window.electronAPI.onUpdate((_e, updatedFiles) => {
      setChanges({});
      setFiles(updatedFiles);
    });
    if (index.length > 1) {
      setIndex([0]);
      setPrevious(0);
    } else {
      if (!files[index[0]] || (!files[previous] && files.length > 0)) {
        setIndex([0]);
        setPrevious(0);
      }
    }

    window.electronAPI.onBlur(() => {
      setKeyCode(-1);
      saveChanges();
    });
  }, []);
  return (
    <div className={"bg-background h-full flex w-full"}>
      <Header />
      <Sidebar ref={SidebarRef} />

      <div
        style={{
          marginLeft: sidebarWidth,
          marginTop: "48px",
          display: "flex",
          height: "full",
          background: "",
          width: "100%",
          overflowX: "hidden",
        }}
      >
        {files.length === 0 ? (
          <div
            className={
              "flex flex-col w-full justify-center items-center h-full"
            }
          >
            <h1>No files selected</h1>
            <Button
              onClick={() => {
                window.electronAPI.openDialog().then((file) => {
                  setFiles(file);
                });
              }}
              variant={"default"}
            >
              Import File
            </Button>
          </div>
        ) : (
          <div
            ref={fileList}
            tabIndex={0}
            id="trackList"
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            className={"w-full outline-0 select-none"}
          >
            <Table className={"w-max"}>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className={"p-0 !max-w-fit !w-fit px-0"}
                  ></TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead>Album Artist</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Track Number</TableHead>
                  <TableHead>Composer</TableHead>
                  <TableHead>Path</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody id={"tb"}>
                {files.map((file, i) => (
                  <Track
                    onClick={() => {
                      if (keyCode === 0) {
                        if (!files[previous]) setPrevious(0);
                        const { highest, lowest } = getHighest(previous, i);
                        const r = range(lowest, highest);
                        setIndex((prevIndex) => [
                          ...new Set([...prevIndex, ...r]),
                        ]);
                        setPrevious(i);
                      } else if (keyCode === 1) {
                        setPrevious(i);
                        if (index.includes(i)) {
                          setIndex(index.filter((x) => x !== i));
                        } else {
                          setIndex((prevIndex) => [
                            ...new Set([...prevIndex, i]),
                          ]);
                        }
                      } else {
                        setPrevious(i);
                        if (index.includes(i) && index.length < 2) {
                          setIndex([]);
                        } else {
                          setIndex([i]);
                        }
                      }
                    }}
                    selected={index.includes(i)}
                    track={file}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function range(start: number, end: number) {
  return Array(end - start + 1)
    .fill(undefined)
    .map((_, idx) => start + idx);
}

function getHighest(num1: number, num2: number) {
  return num1 > num2
    ? { highest: num1, lowest: num2 }
    : { highest: num2, lowest: num1 };
}

export default App;
