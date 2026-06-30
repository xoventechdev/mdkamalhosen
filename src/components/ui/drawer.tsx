"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type DrawerContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  titleId: string;
};

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

function useDrawerContext() {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) throw new Error("Drawer components must be used within <Drawer />");
  return ctx;
}

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const value = React.useMemo(
    () => ({ open, setOpen: onOpenChange, titleId }),
    [open, onOpenChange, titleId],
  );

  return (
    <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
  );
}

export interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  hideClose?: boolean;
}

export function DrawerContent({
  className,
  children,
  hideClose = false,
  ...props
}: DrawerContentProps) {
  const ctx = useDrawerContext();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !ctx.open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => ctx.setOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ctx.titleId}
        className={cn(
          "relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl",
          "animate-slide-in-right",
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

export function DrawerHeader({
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

export function DrawerTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  const ctx = useDrawerContext();
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

export function DrawerBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DrawerFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-t border-border p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
