import * as React from "react";

import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentPropsWithoutRef<"input">, "type">;

export const Checkbox = React.forwardRef<HTMLInputElement, Props>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border border-border bg-background text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";
