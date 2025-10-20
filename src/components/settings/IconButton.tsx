import { ReactNode, ButtonHTMLAttributes } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: "default" | "primary" | "destructive";
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function IconButton({
  icon,
  variant = "default",
  size = "md",
  label,
  className = "",
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const variantClasses = {
    default:
      "border-border/60 bg-background/40 hover:bg-muted/30 hover:border-border text-foreground/60 hover:text-foreground",
    primary:
      "border-border/60 bg-background/40 hover:bg-primary/10 hover:border-primary/50 text-foreground/60 hover:text-primary",
    destructive:
      "border-border/60 bg-background/40 hover:bg-destructive/10 hover:border-destructive/50 text-foreground/60 hover:text-destructive",
  };

  return (
    <button
      className={`group rounded-md border transition-all duration-200 flex items-center justify-center ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  );
}
