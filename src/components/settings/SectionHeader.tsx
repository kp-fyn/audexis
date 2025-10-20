interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <header className="space-y-1">
      <h3 className="text-[11px] font-semibold tracking-wide uppercase text-foreground/60">
        {title}
      </h3>
      {description && (
        <p className="text-[11px] text-foreground/45 max-w-prose">
          {description}
        </p>
      )}
    </header>
  );
}
