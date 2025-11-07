interface SectionNavButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function SectionNavButton({
  label,
  isActive,
  onClick,
}: SectionNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-[11px] font-medium tracking-wide transition-colors ${
        isActive
          ? "bg-primary/15 text-foreground border border-primary/40"
          : "text-foreground/60 hover:bg-hover border border-transparent"
      }`}
    >
      {label}
    </button>
  );
}
