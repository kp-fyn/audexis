import { SectionHeader } from "../settings/SectionHeader";

interface ViewSectionProps {
  view: "folder" | "simple";
  onViewChange: (view: "folder" | "simple") => void;
}

export function ViewSection({ view, onViewChange }: ViewSectionProps) {
  return (
    <section className="space-y-4 animate-in fade-in">
      <SectionHeader
        title="Choose View Mode"
        description="Decide how your library is organized visually."
      />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {(["folder", "simple"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onViewChange(opt)}
              className={`relative rounded-md border p-4 text-left transition-colors ${
                view === opt
                  ? "border-primary bg-primary/10"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/20"
              }`}
            >
              <div className="text-[11px] font-medium tracking-wide uppercase text-foreground/60 mb-2">
                {opt === "folder" ? "Folder view" : "Simple list"}
              </div>
              <div className="h-20 rounded bg-muted/15 border border-border flex items-center justify-center text-[10px] text-foreground/50">
                Mock Layout
              </div>
              {view === opt && (
                <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-foreground/50">
          Folder view groups by directory; simple lists everything flat.
        </p>
      </div>
    </section>
  );
}
