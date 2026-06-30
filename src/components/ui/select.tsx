"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-500",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
