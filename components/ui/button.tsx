"use client";

import * as React from "react";
import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[color:var(--brand)] text-white shadow-[0_16px_28px_rgba(28,96,214,0.22)] hover:-translate-y-0.5 hover:bg-[color:color-mix(in_srgb,var(--brand)_88%,black)]",
        secondary:
          "border-[color:var(--line)] bg-[color:var(--glass-bg)] text-[color:var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_10px_22px_rgba(24,32,51,0.08)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-[color:var(--glass-bg-strong)]",
        ghost:
          "border-transparent bg-transparent text-[color:var(--text)] hover:-translate-y-0.5 hover:border-[color:var(--line)] hover:bg-[color:var(--glass-hover)]",
        app:
          "border-[color:var(--line)] bg-[color:var(--glass-bg)] text-[color:var(--app-text)] shadow-[0_12px_22px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-[color:var(--glass-bg-strong)]"
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-6"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
