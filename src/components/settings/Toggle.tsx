interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="flex items-center justify-between rounded border border-border/60 bg-background/40 px-3 py-2">
      <span className="truncate text-foreground/65 text-[11px] pr-3">
        {label}
      </span>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="h-5 w-9 rounded-full bg-border/60 peer-checked:bg-primary/70 transition-colors flex items-center px-0.5 after:content-[''] after:h-4 after:w-4 after:rounded-full after:bg-background after:shadow after:transition-transform after:duration-300 after:border after:border-border/60 peer-checked:after:translate-x-4" />
    </label>
  );
}
