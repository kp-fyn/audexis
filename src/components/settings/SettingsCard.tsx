import { ReactNode } from "react";

interface SettingsCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsCard({
  title,
  description,
  children,
  className = "",
}: SettingsCardProps) {
  return (
    <div
      className={`p-3 rounded-md border border-border/60 bg-background/40 flex flex-col gap-2 ${className}`}
    >
      {title && <div className="text-[11px] font-medium">{title}</div>}
      {children}
      {description && (
        <div className="text-[10px] text-foreground/40">{description}</div>
      )}
    </div>
  );
}
