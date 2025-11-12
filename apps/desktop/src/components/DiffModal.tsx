import { useMemo } from "react";
import { Button } from "@/ui/components/Button";
import { AllTags, File, TagText, TagPicture } from "@/ui/types";
import { cn } from "@/ui/lib/utils";

export interface DiffItem {
  field: string;
  label: string;
  before: string;
  after: string;
}

export interface FileDiff {
  path: string;
  fileName: string;
  changes: DiffItem[];
}

interface DiffModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changes: Partial<AllTags>;
  selectedFiles: File[];
}

function formatValue(val: TagText | TagPicture | string | undefined): string {
  if (!val) return "(empty)";
  if (typeof val === "string") return val || "(empty)";
  if (typeof val === "object" && "type" in val) {
    if (val.type === "Text") return (val as TagText).value || "(empty)";
    if (val.type === "Picture") return "[Image]";
  }
  return "(empty)";
}

function getFieldLabel(fieldKey: string): string {
  const labels: Record<string, string> = {
    title: "Title",
    artist: "Artist",
    album: "Album",
    year: "Year",
    trackNumber: "Track Number",
    genre: "Genre",
    albumArtist: "Album Artist",
    composer: "Composer",
    encodedBy: "Encoded By",
    conductor: "Conductor",
    attachedPicture: "Artwork",
    copyright: "Copyright",
    comments: "Comments",
  };
  return labels[fieldKey] || fieldKey;
}

export default function DiffModal({
  open,
  onClose,
  onConfirm,
  changes,
  selectedFiles,
}: DiffModalProps) {
  const diffs = useMemo(() => {
    const result: FileDiff[] = [];

    for (const file of selectedFiles) {
      const fileDiffs: DiffItem[] = [];

      for (const [fieldKey, newValue] of Object.entries(changes)) {
        const oldValue = (file.tags as any)[fieldKey];
        const before = formatValue(oldValue);
        const after = formatValue(newValue);

        if (before !== after) {
          fileDiffs.push({
            field: fieldKey,
            label: getFieldLabel(fieldKey),
            before,
            after,
          });
        }
      }

      if (fileDiffs.length > 0) {
        result.push({
          path: file.path,
          fileName: file.path.split("/").pop() || file.path,
          changes: fileDiffs,
        });
      }
    }

    return result;
  }, [changes, selectedFiles]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-background shadow-2xl",
          "flex flex-col"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Review Changes
            </h2>
            <p className="text-sm text-foreground/70">
              {diffs.length} file{diffs.length === 1 ? "" : "s"} will be
              modified
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground/70 hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {diffs.length === 0 ? (
            <div className="py-8 text-center text-foreground/60">
              No changes to display
            </div>
          ) : (
            <div className="space-y-6">
              {diffs.map((fileDiff, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="truncate" title={fileDiff.path}>
                      {fileDiff.fileName}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {fileDiff.changes.map((change, changeIdx) => (
                      <div
                        key={changeIdx}
                        className="rounded-md border border-border bg-muted/30 p-3"
                      >
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                          {change.label}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-red-500">−</span>
                            <span className="flex-1 text-foreground/70 line-through">
                              {change.before}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-green-500">+</span>
                            <span className="flex-1 font-medium text-foreground">
                              {change.after}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={diffs.length === 0}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
