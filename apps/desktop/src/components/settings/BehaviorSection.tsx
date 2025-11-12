import { SectionHeader } from "./SectionHeader";
import { Toggle } from "./Toggle";

interface BehaviorOption {
  key: string;
  label: string;
}

interface BehaviorSectionProps {
  behavior: Record<string, boolean>;
  options?: BehaviorOption[];
  onBehaviorChange: (key: string, value: boolean) => void;
}

const defaultOptions: BehaviorOption[] = [
  { key: "showDiffModal", label: "Show diff preview before saving" },
];

export function BehaviorSection({
  behavior,
  options = defaultOptions,
  onBehaviorChange,
}: BehaviorSectionProps) {
  return (
    <section className="space-y-4 animate-in fade-in">
      <SectionHeader title="Behavior" description="Interaction preferences " />
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((item) => (
          <Toggle
            key={item.key}
            label={item.label}
            checked={behavior[item.key]}
            onChange={(checked) => {
              onBehaviorChange(item.key, checked);
            }}
          />
        ))}
      </div>
    </section>
  );
}
