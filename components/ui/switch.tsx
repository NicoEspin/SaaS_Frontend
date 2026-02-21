import * as React from "react";

import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentPropsWithoutRef<"input">, "type"> & {
  label?: string;
};

export const Switch = React.forwardRef<HTMLInputElement, Props>(
  ({ className, checked, disabled, onChange, label, ...props }, ref) => {
    return (
      <label
        className={cn(
          "inline-flex items-center gap-2",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <span className="relative inline-flex h-6 w-10 items-center">
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            {...props}
          />
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-0 rounded-full border border-border bg-muted transition-colors",
              "peer-checked:bg-primary peer-checked:border-primary",
              "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
              "peer-checked:translate-x-4"
            )}
          />
        </span>
        {label ? <span className="text-sm text-foreground">{label}</span> : null}
      </label>
    );
  }
);

Switch.displayName = "Switch";
