import { SectionHeader } from "../settings/SectionHeader";

interface ColumnsSectionProps {
  preset: "basic" | "detailed";
  onPresetChange: (preset: "basic" | "detailed") => void;
}

export function ColumnsPresetSection({
  preset,
  onPresetChange,
}: ColumnsSectionProps) {
  return (
    <section className="space-y-4 animate-in fade-in">
      <SectionHeader
        title="Preset Columns"
        description="Start with a sensible column layout – you can change later."
      />
      <div className="space-y-4">
        <div className="flex gap-3">
          {(["basic", "detailed"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onPresetChange(opt)}
              className={`flex-1 rounded-md border py-3 px-4 text-left transition-colors ${
                preset === opt
                  ? "border-primary bg-primary/10"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/20"
              }`}
            >
              <div className="text-[11px] font-medium tracking-wide uppercase text-foreground/60 mb-2">
                {opt === "basic" ? "Basic" : "Detailed"}
              </div>
              <div className="flex flex-wrap gap-1">
                {(opt === "basic"
                  ? ["Title", "Artist", "Album", "Year"]
                  : [
                      "Title",
                      "Artist",
                      "Album",
                      "Genre",
                      "Track",
                      "Year",
                      "Composer",
                    ]
                ).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-medium text-foreground/70 border border-border/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-foreground/50">
          We will apply this layout visually. You can customize columns later.
        </p>
      </div>
    </section>
  );
}
