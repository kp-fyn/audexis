import { useMemo } from "react";
import { Button } from "@/ui/components/Button";
import { AllTags, File, TagText, TagPicture } from "@/ui/types";
import { Modal } from "./Modal";

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
        let val = file.frames[fieldKey];
        let oldValue = "";
        if (Array.isArray(val) && val.length > 0 && val[0].type === "Text") {
          oldValue = val[0].value;
        }

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review Changes"
      description={`${diffs.length} file${diffs.length === 1 ? "" : "s"} will be modified`}
      bodyClassName="px-6 py-4"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={diffs.length === 0}>
            Save Changes
          </Button>
        </>
      }
    >
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
    </Modal>
  );
}
