import { AudioFile } from "../types/index";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

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
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import { useSidebarWidth } from "./hooks/useSidebarWidth";
import { useChanges } from "./hooks/useChanges";
import DragCell from "./components/DragCell";
import DraggableHeader from "./components/DraggableHeader";

const columnHelper = createColumnHelper<AudioFile>();

export default function App() {
  const [previous, setPrevious] = useState<number>(0);

  const { selected, setSelected, files, setFiles, neededItems } = useChanges();
  const [lastSelected, setLastSelected] = useState<number>(-1);
  const { sidebarWidth } = useSidebarWidth();

  const helpers = neededItems.map((item) =>
    columnHelper.accessor(item.value, {
      id: item.value,
      cell: (info) => {
        const value = info.getValue();
        return (
          <i className="truncate">{typeof value === "string" ? value : ""}</i>
        );
      },
      size: 200,
      header: () => <span>{item.label}</span>,
      footer: (info) => info.column.id,
    })
  );

  const columns: ColumnDef<AudioFile, any>[] = [
    columnHelper.accessor("path", {
      id: "path",
      cell: (info) => <i className="truncate">{info.getValue()}</i>,

      size: 200,
      header: () => <span>Path</span>,
      footer: (info) => info.column.id,
    }),
    columnHelper.accessor("release", {
      id: "release",
      cell: (info) => <i className="truncate">{info.getValue()}</i>,

      size: 200,
      header: () => <span>Tag Manager</span>,
      footer: (info) => info.column.id,
    }),
    ...helpers,
  ];
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.map((c) => c.id!)
  );

  const table = useReactTable({
    data: files,
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

    window.app.onUpdate((_e, updatedFiles) => {
      //  updatedFiles.map((file) => {
      //     if (file.corrupted) return file;
      //   });

      setFiles(updatedFiles);
    });
  }, []);
  useEffect(() => {
    setLastSelected(-1);
  }, [files]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        return;
      }
      if (!files.length) return;

      let currentIndex = lastSelected;
      if (currentIndex === -1) currentIndex = -1;
      if (
        currentIndex === -1 ||
        (currentIndex === 0 && event.key === "ArrowUp" && files.length >= 2)
      )
        currentIndex = files.length;
      if (
        currentIndex === files.length - 1 &&
        event.key === "ArrowDown" &&
        files.length >= 2
      )
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
    [files, selected, handleSelection]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function handleSelection(
    index: number,
    path: string,
    event?: KeyboardEvent | React.MouseEvent
  ) {
    const isShift = event?.shiftKey;
    const isCtrlOrCmd = event?.ctrlKey || event?.metaKey;
    setLastSelected(index);
    setSelected((prevSelected) => {
      let newSelection = [...prevSelected];

      if (isShift && previous !== null) {
        const start = Math.min(previous, index);
        const end = Math.max(previous, index);
        const pathsInRange = files
          .slice(start, end + 1)
          .map((file) => file.path);

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
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        return arrayMove(columnOrder, oldIndex, newIndex);
      });
    }
  }
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );
  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="w-full h-full flex overflow-hidden">
        <Sidebar />
        <div className="w-full h-full" style={{ marginLeft: sidebarWidth }}>
          <div className="w-full h-full overflow-hidden">
            <div className="overflow-x-auto h-full">
              <div className="min-w-max min-h-full">
                <div className="sticky top-0 z-10 bg-neutral-950 text-white">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <div key={headerGroup.id} className="ml-12 flex">
                      <SortableContext
                        items={columnOrder}
                        strategy={horizontalListSortingStrategy}
                      >
                        {headerGroup.headers.map((header) => (
                          <DraggableHeader header={header}>
                            <div
                              onDoubleClick={() => header.column.resetSize()}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                header.getResizeHandler()(e);
                              }}
                              onTouchStart={header.getResizeHandler()}
                              className="absolute top-0 right-0 h-full w-[1px] cursor-col-resize bg-gray-700 select-none transition-opacity hover:opacity-100"
                            />
                          </DraggableHeader>
                        ))}
                      </SortableContext>
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-gray-700">
                  {table.getRowModel().rows.map((row) => {
                    const isSelected = selected.includes(row.original.path);

                    return (
                      <div
                        key={row.id}
                        className={`flex cursor-pointer items-center ${
                          isSelected
                            ? "bg-accent"
                            : row.index % 2 === 0
                            ? "bg-neutral-900"
                            : "bg-neutral-950"
                        } }`}
                        onClick={(e) =>
                          handleSelection(row.index, row.original.path, e)
                        }
                      >
                        <div className="w-12 h-12 rounded ">
                          {row.original.attachedPicture &&
                            typeof row.original.attachedPicture !==
                              "string" && (
                              <img
                                className="w-12 h-12"
                                src={URL.createObjectURL(
                                  new Blob(
                                    [row.original.attachedPicture.buffer],
                                    {
                                      type: row.original.attachedPicture.mime,
                                    }
                                  )
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
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
