import { useEffect, useMemo, useState } from "react";
import { useChanges } from "@/ui/hooks/useChanges";
import { useUserConfig } from "@/ui/hooks/useUserConfig";
import { Button } from "@/ui/components/Button";
import { cn } from "@/ui/lib/utils";
import DiffModal from "@/ui/components/modals/DiffModal";

export default function SaveBar() {
  const { changes, saveChanges, clearChanges, selected, saveBarNudge, files } =
    useChanges();
  const { config } = useUserConfig();
  const [attention, setAttention] = useState(false);
  const [show_diff_modal, setshow_diff_modal] = useState(false);

  const hasChanges = useMemo(() => {
    return changes && Object.keys(changes).length > 0 && selected.length > 0;
  }, [changes, selected]);

  const countChanged = useMemo(
    () => Object.keys(changes || {}).length,
    [changes],
  );

  const selectedFiles = useMemo(() => {
    if (!selected || selected.length === 0) return [];
    return files.filter((f) => selected.includes(f.path));
  }, [files, selected]);

  useEffect(() => {
    if (saveBarNudge > 0 && hasChanges) {
      setAttention(true);
      const t = setTimeout(() => setAttention(false), 400);
      return () => clearTimeout(t);
    }
  }, [saveBarNudge, hasChanges]);

  const handleSave = () => {
    if (config.show_diff_modal) {
      setshow_diff_modal(true);
    } else {
      saveChanges();
    }
  };

  const handleConfirmSave = () => {
    setshow_diff_modal(false);
    saveChanges();
  };

  return (
    <>
      <DiffModal
        open={show_diff_modal}
        onClose={() => setshow_diff_modal(false)}
        onConfirm={handleConfirmSave}
        changes={changes}
        selectedFiles={selectedFiles}
      />
      <div
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-60",
          "transition-all duration-200 ease-out",
          hasChanges
            ? "bottom-12 opacity-100"
            : "bottom-6 opacity-0 pointer-events-none",
        )}
        aria-hidden={!hasChanges}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-md border border-border bg-background/95 backdrop-blur px-3 py-2 shadow-lg",
            "w-full",
            attention ? "ring-2 ring-primary/40 animate-vibrate" : "",
          )}
        >
          <div className="flex-1 text-[12px] leading-tight text-foreground/80">
            <div className="font-medium text-foreground">Unsaved changes</div>
            <div className="text-foreground/70">
              {selected.length} file{selected.length === 1 ? "" : "s"} selected
              • {countChanged} field{countChanged === 1 ? "" : "s"} modified
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => clearChanges()}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
