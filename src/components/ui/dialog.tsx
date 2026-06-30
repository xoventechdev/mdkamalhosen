"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type DialogContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  titleId: string;
  descId: string;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within <Dialog />");
  return ctx;
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const titleId = React.useId();
  const descId = React.useId();

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Close on ESC.
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const value = React.useMemo(
    () => ({ open, setOpen: onOpenChange, titleId, descId }),
    [open, onOpenChange, titleId, descId],
  );

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof sizeMap;
  hideClose?: boolean;
}

export function DialogContent({
  className,
  children,
  size = "md",
  hideClose = false,
  ...props
}: DialogContentProps) {
  const ctx = useDialogContext();
  const ref = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Focus first focusable on open.
  React.useEffect(() => {
    if (!ctx.open) return;
    const node = ref.current;
    if (!node) return;
    const first = node.querySelector<HTMLElement>(
      "input, textarea, select, button, [tabindex]:not([tabindex='-1'])",
    );
    first?.focus();
  }, [ctx.open]);

  if (!mounted || !ctx.open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => ctx.setOpen(false)}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ctx.titleId}
        aria-describedby={ctx.descId}
        className={cn(
          "relative w-full rounded-lg border border-border bg-card shadow-xl animate-scale-in",
          sizeMap[size],
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={() => ctx.setOpen(false)}
            className="absolute right-3 top-3"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-6 border-b border-border", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const ctx = useDialogContext();
  return (
    <h2
      id={ctx.titleId}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function DialogDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const ctx = useDialogContext();
  return (
    <p
      id={ctx.descId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function DialogBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-6 max-h-[70vh] overflow-y-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 p-6 border-t border-border sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
