import { SectionHeader } from "../settings/SectionHeader";

interface ThemeSectionProps {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

export function ThemeSection({ theme, onThemeChange }: ThemeSectionProps) {
  return (
    <section className="space-y-4 animate-in fade-in">
      <SectionHeader
        title="Choose Theme"
        description="Pick the interface style you prefer."
      />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {(["light", "dark"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onThemeChange(opt)}
              className={`relative rounded-md border p-4 text-left transition-colors group ${
                theme === opt
                  ? "border-primary bg-primary/10"
                  : "border-border/60 hover:border-primary/40 hover:bg-muted/20"
              }`}
            >
              <div className="text-[11px] font-medium tracking-wide uppercase text-foreground/60 mb-2">
                {opt} theme
              </div>
              <div className="h-20 rounded bg-gradient-to-br from-background/70 to-background/40 border border-border flex items-center justify-center text-[10px] text-foreground/50">
                Preview
              </div>
              {theme === opt && (
                <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary shadow-inner" />
              )}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-foreground/50">
          Your choice will preview immediately.
        </p>
      </div>
    </section>
  );
}
