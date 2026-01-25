import { parseShortcut } from "@/ui/lib/utils";
import { SectionHeader } from "../settings/SectionHeader";

export function WelcomeSection() {
  return (
    <section className="space-y-4 animate-in fade-in">
      <SectionHeader
        title="Welcome to Audexis"
        description="A focused, keyboard-friendly audio tag editor."
      />
      <div className="space-y-4">
        <p className="text-[12px] leading-relaxed text-foreground/65 max-w-prose">
          Let's set up a few basics so the interface matches how you work. You
          can change any of these later in Settings {parseShortcut("mod+,")}.
        </p>
        <ul className="list-disc list-inside text-[11px] text-foreground/55 space-y-1">
          <li>Choose theme (light or dark)</li>
          <li>Select a view style (folder or simple list)</li>
          <li>Pick a starting column preset</li>
        </ul>
      </div>
    </section>
  );
}
