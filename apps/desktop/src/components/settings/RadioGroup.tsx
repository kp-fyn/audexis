interface RadioOption<T extends string> {
  value: T;
  label: string;
}

interface RadioGroupProps<T extends string> {
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: RadioGroupProps<T>) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 text-[11px] py-1.5 rounded-md border text-center transition-colors ${
            value === option.value
              ? "border-primary bg-primary/15 text-foreground"
              : "border-border/60 bg-muted/20 hover:bg-muted/30 text-foreground/60"
          }`}
          aria-pressed={value === option.value}
          role="radio"
          aria-checked={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
