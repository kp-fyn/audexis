import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { SectionHeader } from "./SectionHeader";
import type { SidebarItem } from "@/ui/types";
import { PlusIcon, XIcon } from "lucide-react";

interface SidebarItemsSectionProps {
  sidebarItems: SidebarItem[];
  sidebarItemMetaById: Record<string, SidebarItem>;

  setSidebarItems: (sidebarItems: SidebarItem[]) => void;
  allSidebarItems: SidebarItem[];
}

function SortableSidebarItemRow({
  sidebarItem,
  onToggle,
  disabled,
}: {
  sidebarItem: SidebarItem;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sidebarItem.value, disabled });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as const;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded bg-muted/15 px-2 py-1.5 border border-border/40"
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Drag handle for ${sidebarItem.label}`}
        className="h-4 w-4 rounded bg-border/50 flex items-center justify-center text-[10px] text-foreground/50 cursor-grab active:cursor-grabbing select-none"
      >
        ≡
      </button>
      <span className="truncate flex-1 text-[11px] text-foreground/70">
        {sidebarItem.label.charAt(0).toUpperCase() + sidebarItem.label.slice(1)}
      </span>
      <button
        onClick={() => onToggle(sidebarItem.value)}
        className={`group relative rounded-md px-1.5 py-1.5 border transition-all duration-200 ${
          disabled
            ? "border-border/60 bg-background/40 hover:bg-primary/10 hover:border-primary/50"
            : "border-border/60 bg-muted/20 hover:bg-destructive/10 hover:border-destructive/50"
        }`}
        aria-label={
          disabled ? `Add ${sidebarItem.label}` : `Remove ${sidebarItem.label}`
        }
      >
        {disabled ? (
          <PlusIcon className="h-3 w-3 text-foreground/50 group-hover:text-primary transition-colors" />
        ) : (
          <XIcon className="h-3 w-3 text-foreground/50 group-hover:text-destructive transition-colors" />
        )}
      </button>
    </div>
  );
}

export function SidebarItemsSection({
  sidebarItems,
  sidebarItemMetaById,

  setSidebarItems,
  allSidebarItems,
}: SidebarItemsSectionProps) {
  const [sidebarItemQuery, setSidebarItemQuery] = useState("");
  const combined = [
    ...sidebarItems,
    ...allSidebarItems.filter(
      (c) => !sidebarItems.find((col) => col.value === c.value),
    ),
  ];
  const filteredSidebarItems = combined.filter((c) =>
    c.label.toLowerCase().includes(sidebarItemQuery.trim().toLowerCase()),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sidebarItems.findIndex((c) => c.value === active.id);
      const newIndex = sidebarItems.findIndex((c) => c.value === over.id);
      const next = arrayMove(sidebarItems, oldIndex, newIndex);

      const enabledIds = next.filter((c) => c).map((c) => c.value);
      const nextSidebarItems = enabledIds
        .map((id) => sidebarItemMetaById[id])
        .filter(Boolean);
      if (nextSidebarItems.length) setSidebarItems(nextSidebarItems);
    }
  };

  const handleToggle = (id: string) => {
    const sidebarItem = allSidebarItems.find((c) => c.value === id);
    if (!sidebarItem) return;

    const isCurrentlyEnabled = sidebarItems.find((c) => c.value === id);

    if (isCurrentlyEnabled) {
      const nextSidebarItems = sidebarItems.filter((c) => c.value !== id);
      setSidebarItems(nextSidebarItems);
    } else {
      const nextSidebarItems = [...sidebarItems, sidebarItem];
      setSidebarItems(nextSidebarItems);
    }
  };

  return (
    <section className="space-y-4 animate-in fade-in">
      <SectionHeader
        title="Columns"
        description="Reorder & toggle visible columns. Changes are saved."
      />
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={sidebarItemQuery}
          onChange={(e) => setSidebarItemQuery(e.target.value)}
          placeholder="Filter columns..."
          className="flex-1 text-[11px] px-2 py-1 rounded-md border border-border bg-background/60 outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="text-[10px] text-foreground/40">
          {filteredSidebarItems.length}/
          {allSidebarItems.length < filteredSidebarItems.length
            ? filteredSidebarItems.length
            : allSidebarItems.length}
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={combined.map((c) => c.value)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {filteredSidebarItems.map((sidebarItem) => (
              <SortableSidebarItemRow
                key={sidebarItem.value}
                sidebarItem={sidebarItem}
                disabled={
                  !sidebarItems.find((c) => c.value === sidebarItem.value)
                }
                onToggle={handleToggle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
