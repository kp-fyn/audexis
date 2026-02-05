import { SectionHeader } from "./SectionHeader";
import { SettingsCard } from "./SettingsCard";
import { RadioGroup } from "./RadioGroup";

interface AppearanceSectionProps {
  theme: "light" | "dark";
  density: "compact" | "default" | "comfort";
  onThemeChange: (theme: "light" | "dark") => void;
  view: "file" | "simple";
  setView: (view: "folder" | "simple") => void;
  onDensityChange: (density: "compact" | "default" | "comfort") => void;
}

export function AppearanceSection({
  theme,
  density,
  onThemeChange,
  onDensityChange,
  view,
  setView,
}: AppearanceSectionProps) {
  console.log({ view });
  return (
    <section className="space-y-4 animate-in fade-in">
      <SectionHeader
        title="Appearance"
        description="Theme applies immediately; density is visual-only."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsCard title="Theme">
          <RadioGroup
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            value={theme}
            onChange={onThemeChange}
          />
        </SettingsCard>
        <SettingsCard
          title="Density"
          description="Changes the spacing of various UI elements."
        >
          <div className="flex gap-2">
            {(["compact", "default", "comfort"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onDensityChange(value)}
                className={`flex-1 text-[10px] py-1 rounded border transition-colors ${
                  density.toLowerCase() === value
                    ? "border-primary bg-primary/20 text-foreground"
                    : "border-border/60 bg-muted/20 hover:bg-muted/30 text-foreground/60"
                }`}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </SettingsCard>
        <SettingsCard
          title="File View"
          description="Changes how files are displayed in the UI."
        >
          <div className="flex gap-2">
            {(["folder", "simple"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                className={`flex-1 text-[10px] py-1 rounded border transition-colors ${
                  view.toLowerCase() === value
                    ? "border-primary bg-primary/20 text-foreground"
                    : "border-border/60 bg-muted/20 hover:bg-muted/30 text-foreground/60"
                }`}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </SettingsCard>
      </div>
    </section>
  );
}
