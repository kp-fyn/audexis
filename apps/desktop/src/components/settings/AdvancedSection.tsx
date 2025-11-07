import { ReactNode } from "react";
import { SectionHeader } from "./SectionHeader";

interface AdvancedSectionProps {
  children?: ReactNode;
}

export function AdvancedSection({ children }: AdvancedSectionProps) {
  return (
    <section className="space-y-4 animate-in fade-in">
      <SectionHeader
        title="Advanced"
        description="Future space for batch templates, import rules, filename patterns, validation schemas, plugins, etc."
      />
      {children ? (
        children
      ) : (
        <div className="rounded-md border border-border/60 bg-background/40 p-4 text-[11px] text-foreground/55 leading-relaxed">
          Placeholder
        </div>
      )}
    </section>
  );
}
