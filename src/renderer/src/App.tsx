/* eslint-disable react-hooks/exhaustive-deps */
import { AudioFile } from "../../types";
import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";

import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { useEffect, useState, useCallback, ReactNode, useRef, CSSProperties } from "react";
import Sidebar from "./components/Sidebar";
import { useSidebarWidth } from "./hooks/useSidebarWidth";
import { useChanges } from "./hooks/useChanges";
import DragCell from "./components/DragCell";
import DraggableHeader from "./components/DraggableHeader";
import ContextMenuHandler from "./components/ContextMenuHandler";
import TrackContextMenu from "./components/contextMenus/TrackContextMenu";
import { useUserConfig } from "./hooks/useUserConfig";
import ColumnContextMenu from "./components/contextMenus/ColumnContextMenu";

import { getAudioFiles } from "./lib/utils";
import { useBottombarHeight } from "./hooks/useBottombarHeight";
import Bottombar from "./components/Bottombar";

const columnHelper = createColumnHelper<AudioFile>();

export default function App(): ReactNode {
  const [previous, setPrevious] = useState<number>(0);
  const { config, setColumns } = useUserConfig();

  const { selected, setSelected, files, setFiles, setFileTree, setFilesToShow, filesToShow } =
    useChanges();

  const [lastSelected, setLastSelected] = useState<number>(-1);
  const { sidebarWidth } = useSidebarWidth();
  const { bottombarHeight } = useBottombarHeight();

  const helpers = config.columns.map((item) =>
    columnHelper.accessor(item.value, {
      id: item.value,
      cell: (info) => {
        const value = info.getValue();
        return <i className="truncate">{typeof value === "string" ? value : ""}</i>;
      },
      size: item.size,
      header: () => <span>{item.label}</span>,
      footer: (info) => info.column.id,
    })
  );

  const columns: ColumnDef<AudioFile, string>[] = [...helpers];
  const isResizing = useRef(false);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const resizingColumnIdRef = useRef<string | null>(null);
  const initialResizeData = useRef<{
    startX: number;
    startWidth: number;
  }>({ startX: 0, startWidth: 0 });

  const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map((c) => c.id ?? ""));

  useEffect(() => {
    setColumnOrder(columns.map((c) => c.id ?? ""));
  }, [config.columns]);

  const table = useReactTable({
    data: filesToShow,
    state: {
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    columns,
    defaultColumn: { minSize: 50 },
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    window.app.reloadFiles();

    window.app.onUpdate((_e, ft) => {
      //  updatedFiles.map((file) => {
      //     if (file.corrupted) return file;
      //   });
      const updatedFiles = [...getAudioFiles(ft.disorgainzed), ...getAudioFiles(ft.organized)];
      setFiles(updatedFiles);
      setFileTree(ft);
      if (config.view === "simple") setFilesToShow(updatedFiles);
    });
  }, []);
  useEffect(() => {
    console.log({ filesToShow });
  }, [filesToShow]);
  useEffect(() => {
    setLastSelected(-1);
  }, [files]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (document.activeElement?.id !== "App") return;
      if (!files.length) return;

      let currentIndex = lastSelected;
      if (currentIndex === -1) currentIndex = -1;
      if (
        currentIndex === -1 ||
        (currentIndex === 0 && event.key === "ArrowUp" && files.length >= 2)
      )
        currentIndex = files.length;
      if (currentIndex === files.length - 1 && event.key === "ArrowDown" && files.length >= 2)
        currentIndex = -1;
      let newIndex = currentIndex;

      if (event.key === "ArrowUp") {
        event.preventDefault();

        newIndex = Math.max(0, currentIndex - 1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        newIndex = Math.min(files.length - 1, currentIndex + 1);
      }

      if (newIndex !== currentIndex) {
        handleSelection(newIndex, files[newIndex]?.path, event);
      }
    },
    [files, selected, lastSelected]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return (): void => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleSelection(
    index: number,
    path: string,
    event?: KeyboardEvent | React.MouseEvent
  ): void {
    const isShift = event?.shiftKey;
    const isCtrlOrCmd = event?.ctrlKey || event?.metaKey;
    setLastSelected(index);
    setSelected((prevSelected) => {
      let newSelection = [...prevSelected];

      if (isShift && previous !== null) {
        const start = Math.min(previous, index);
        const end = Math.max(previous, index);
        const pathsInRange = files.slice(start, end + 1).map((file) => file.path);

        if (prevSelected.includes(path)) {
          newSelection = newSelection.filter((p) => !pathsInRange.includes(p));
        } else {
          newSelection = [...new Set([...newSelection, ...pathsInRange])];
        }
      } else if (isCtrlOrCmd) {
        if (newSelection.includes(path)) {
          newSelection = newSelection.filter((p) => p !== path);
        } else {
          newSelection.push(path);
        }
      } else {
        newSelection = [path];
      }

      return newSelection;
    });

    setPrevious(index);
  }
  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        const newColumns = arrayMove(columnOrder, oldIndex, newIndex);

        const newRc = newColumns.map((item) => {
          const rc = config.columns.find((c) => c.value === item);
          if (!rc) return null;

          return {
            value: item,
            label: rc.label,
            size: rc.size,
          };
        });
        const newRealColumns = newRc.filter((item) => item !== null);
        setColumns(newRealColumns as { label: string; size: number; value: string }[]);
        return arrayMove(columnOrder, oldIndex, newIndex);
      });
    }
  }
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const startResizing = (columnId: string, event: React.MouseEvent): void => {
    if (!tableRef.current) return;

    const column = config.columns.find((c) => c.value === columnId);
    if (!column) return;

    resizingColumnIdRef.current = columnId;
    isResizing.current = true;
    document.body.style.userSelect = "none";

    initialResizeData.current = {
      startX: event.clientX,
      startWidth: column.size ?? 200,
    };

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };
  const resize = (event: MouseEvent): void => {
    if (!isResizing.current) return;
    const columnId = resizingColumnIdRef.current;
    if (!columnId) return;

    const deltaX = event.clientX - initialResizeData.current.startX;
    const newWidth = initialResizeData.current.startWidth + deltaX;

    const minWidth = 150;
    const maxWidth = window.innerWidth - 200;
    if (newWidth < minWidth || newWidth > maxWidth) return;
    const columnsCopy = config.columns.map((col) => ({ ...col })); // deep enough for shallow objects

    const columnIndex = columnsCopy.findIndex((c) => c.value === columnId);
    if (columnIndex === -1) return;

    columnsCopy[columnIndex].size = newWidth;
    setColumns(columnsCopy);
  };

  const stopResizing = (): void => {
    resizingColumnIdRef.current = null;
    isResizing.current = false;
    document.body.style.userSelect = "";

    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  };
  function getWidth(): number {
    const w = sidebarWidth.split("px")[0];
    if (parseInt(w) < 300 || isNaN(parseInt(w))) {
      return 300;
    } else {
      return parseInt(w);
    }
  }
  const styles: CSSProperties = {};
  if (config.view === "folder") {
    styles.paddingBottom = `${bottombarHeight}`;
  } else {
    styles.paddingBottom = undefined;
  }
  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="overflow-hidden flex flex-col h-full">
        <Sidebar></Sidebar>
        <div
          className="flex flex-col w-full h-full overflow-x-hidden"
          style={{
            ...styles,
            paddingLeft: `${getWidth() + 6}px`,
            paddingTop: "48px",
          }}
        >
          <div
            className="w-full h-full flex text-foreground overflow-x-scroll"
            id="App"
            tabIndex={0}
          >
            <div className="w-full h-full  flex">
              <div className="min-h-full block select-none relative" ref={tableRef} id="table">
                <ContextMenuHandler contextMenuContent={<ColumnContextMenu selected={"__nun"} />}>
                  <div className="sticky z-50 top-0   h-[40px]    bg-background text-foreground border-b border-border p-0 ">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <div key={headerGroup.id} className="flex ml-12 h-full">
                        <SortableContext
                          items={columnOrder}
                          strategy={horizontalListSortingStrategy}
                          key={headerGroup.id}
                        >
                          {headerGroup.headers.map((header) => (
                            <ContextMenuHandler
                              key={header.id}
                              contextMenuContent={<ColumnContextMenu selected={header.id} />}
                            >
                              <DraggableHeader header={header}>
                                <div
                                  onDoubleClick={() => {
                                    setColumns(
                                      config.columns.map((item) =>
                                        item.value === header.id ? { ...item, size: 200 } : item
                                      )
                                    );
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();

                                    startResizing(header.id, e);
                                  }}
                                  onTouchStart={header.getResizeHandler()}
                                  className="absolute top-0 right-0 h-full w-[3px] cursor-col-resize bg-background select-none transition-opacity hover:bg-border hover:opacity-100"
                                >
                                  <div className=" border-r border-border h-full"></div>
                                </div>
                              </DraggableHeader>
                            </ContextMenuHandler>
                          ))}
                        </SortableContext>
                      </div>
                    ))}
                  </div>
                </ContextMenuHandler>
                <div className="divide-y h-full divide-gray-700">
                  {filesToShow.length < 1 && (
                    <div className="flex items-center h-full w-full">
                      <div className="text-foreground text-sm">
                        No files found. Please import files to see them here.
                      </div>
                    </div>
                  )}
                  {table.getRowModel().rows.map((row) => {
                    const isSelected = selected.includes(row.original.path);
                    const currentFile = row.original as AudioFile;

                    return (
                      <ContextMenuHandler
                        contextMenuContent={<TrackContextMenu file={currentFile} />}
                        key={row.id}
                      >
                        <div
                          className={`flex cursor-pointer  h-12 items-center px-1 border-b border-border   transition-colors ${
                            isSelected
                              ? "bg-accent"
                              : "bg-background  hover:bg-hover focus:bg-hover"
                            // : row.index % 2 === 0
                            //   ? "bg-neutral-900"
                            //   : "bg-neutral-950"
                          } }`}
                          onClick={(e) => handleSelection(row.index, row.original.path, e)}
                        >
                          <div className="w-12 h-12 rounded ">
                            {row.original.attachedPicture &&
                              typeof row.original.attachedPicture !== "string" && (
                                <img
                                  className=" h-full"
                                  src={URL.createObjectURL(
                                    new Blob([row.original.attachedPicture.buffer], {
                                      type: row.original.attachedPicture.mime,
                                    })
                                  )}
                                />
                              )}
                          </div>
                          {row.getVisibleCells().map((cell) => (
                            <SortableContext
                              key={cell.id}
                              items={columnOrder}
                              strategy={horizontalListSortingStrategy}
                            >
                              {/* <DragAlongCell key={cell.id} cell={cell} /> */}

                              <DragCell key={cell.id} cell={cell} />
                            </SortableContext>
                          ))}
                        </div>
                      </ContextMenuHandler>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        {config.view === "folder" && <Bottombar></Bottombar>}
        {/* <div
          style={{ marginLeft: `${sidebarWidth}`, height: bottombarHeight }}
          className={` overflow-x-scroll px-4  bottom-0  border-t border-border   w-full cursor-row-resize  bg-background `}
        >
          hi
        </div> */}
      </div>
    </DndContext>
  );
}
