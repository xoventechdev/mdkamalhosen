"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-foreground hover:opacity-90 shadow-sm",
        secondary:
          "border border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        danger:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline:
          "border border-input bg-background text-foreground hover:bg-muted",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, type = "button", asChild, children, ...props },
    ref,
  ) {
    if (asChild && React.isValidElement(children)) {
      // Merge our classes onto the child (typically a Link). The child
      // receives the button styling and inherits any onClick.
      const child = children as React.ReactElement<{ className?: string }>;
      const merged = cn(buttonVariants({ variant, size }), child.props.className, className);
      return React.cloneElement(child, {
        ...props,
        className: merged,
      });
    }
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
