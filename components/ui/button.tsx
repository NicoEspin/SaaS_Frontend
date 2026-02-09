import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "icon";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-border bg-background hover:bg-muted hover:text-foreground",
  ghost: "hover:bg-muted hover:text-foreground",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-9 px-4",
  sm: "h-8 px-3",
  icon: "h-9 w-9",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type,
  ...props
}: Props) {
  return (
    <button
      type={type ?? "button"}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
