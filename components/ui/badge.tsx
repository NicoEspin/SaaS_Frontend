import * as React from "react";

import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-muted text-foreground",
  outline: "border border-border bg-background text-foreground",
};

export function Badge({ className, variant = "secondary", ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
