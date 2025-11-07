import { useEffect, useMemo, useState } from "react";
import { useChanges } from "@/ui/hooks/useChanges";
import { Button } from "@/ui/components/Button";
import { cn } from "@/ui/lib/utils";

export default function SaveBar() {
  const { changes, saveChanges, clearChanges, selected, saveBarNudge } =
    useChanges();
  const [attention, setAttention] = useState(false);

  const hasChanges = useMemo(() => {
    return changes && Object.keys(changes).length > 0 && selected.length > 0;
  }, [changes, selected]);

  const countChanged = useMemo(
    () => Object.keys(changes || {}).length,
    [changes]
  );

  useEffect(() => {
    if (saveBarNudge > 0 && hasChanges) {
      setAttention(true);
      const t = setTimeout(() => setAttention(false), 400);
      return () => clearTimeout(t);
    }
  }, [saveBarNudge, hasChanges]);

  return (
    <div
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-[60]",
        "transition-all duration-200 ease-out",
        hasChanges
          ? "bottom-12 opacity-100"
          : "bottom-6 opacity-0 pointer-events-none"
      )}
      aria-hidden={!hasChanges}
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border border-border bg-background/95 backdrop-blur px-3 py-2 shadow-lg",
          "w-full",
          attention ? "ring-2 ring-primary/40 animate-vibrate" : ""
        )}
      >
        <div className="flex-1 text-[12px] leading-tight text-foreground/80">
          <div className="font-medium text-foreground">Unsaved changes</div>
          <div className="text-foreground/70">
            {selected.length} file{selected.length === 1 ? "" : "s"} selected •{" "}
            {countChanged} field{countChanged === 1 ? "" : "s"} modified
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => clearChanges()}>
            Discard
          </Button>
          <Button size="sm" onClick={() => saveChanges()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
