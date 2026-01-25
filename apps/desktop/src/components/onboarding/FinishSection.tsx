import { parseShortcut } from "@/ui/lib/utils";
import { SectionHeader } from "../settings/SectionHeader";

interface FinishSectionProps {
  theme: "light" | "dark";
  view: "folder" | "simple";
  preset: "basic" | "detailed";
}

export function FinishSection({ theme, view, preset }: FinishSectionProps) {
  return (
    <section className="space-y-4 animate-in fade-in">
      <SectionHeader
        title="All Set"
        description={`You can tweak anything later in Settings ${parseShortcut("mod+,")}.`}
      />
      <div className="space-y-5">
        <div className="text-[12px] leading-relaxed text-foreground/65">
          You're ready to start tagging. Import files using the Import button in
          the title bar or by dragging them in.
        </div>
        <div className="grid gap-2 text-[11px] text-foreground/55 p-4 rounded-md border border-border/60 bg-background/40">
          <div>
            <span className="font-medium text-foreground/70">Theme:</span>{" "}
            {theme}
          </div>
          <div>
            <span className="font-medium text-foreground/70">View:</span> {view}
          </div>
          <div>
            <span className="font-medium text-foreground/70">Columns:</span>{" "}
            {preset === "basic" ? "Basic preset" : "Detailed preset"}
          </div>
        </div>
        <div className="text-[10px] text-foreground/45">
          Change later via Settings {parseShortcut("mod+,")}.
        </div>
      </div>
    </section>
  );
}
