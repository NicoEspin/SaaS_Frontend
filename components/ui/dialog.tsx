"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function useDialogCtx() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>");
  return ctx;
}

export function DialogContent({
  className,
  children,
  onInteractOutside,
}: {
  className?: string;
  children: React.ReactNode;
  onInteractOutside?: () => void;
}) {
  const { open, onOpenChange } = useDialogCtx();
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const el = ref.current;
    if (!el) return;

    const prev = document.activeElement as HTMLElement | null;
    el.focus();

    return () => {
      prev?.focus?.();
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onMouseDown={() => {
          onInteractOutside?.();
          onOpenChange(false);
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          ref={ref}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-full max-w-2xl rounded-xl border border-border bg-card text-card-foreground shadow-lg",
            "outline-none",
            className
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1 border-b border-border p-5", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function DialogClose({
  children,
}: {
  children: (props: { onClick: () => void }) => React.ReactNode;
}) {
  const { onOpenChange } = useDialogCtx();
  return children({ onClick: () => onOpenChange(false) });
}
