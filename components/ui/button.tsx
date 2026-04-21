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
          "border-white/20 bg-[linear-gradient(135deg,var(--brand)_0%,color-mix(in_srgb,var(--brand)_72%,white)_100%)] text-white shadow-[0_20px_36px_rgba(91,104,255,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] hover:-translate-y-0.5 hover:brightness-105",
        secondary:
          "border-[color:var(--line)] bg-[color:var(--glass-bg)] text-[color:var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_16px_30px_rgba(24,32,51,0.1)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-[color:var(--glass-bg-strong)]",
        ghost:
          "border-transparent bg-transparent text-[color:var(--text)] hover:-translate-y-0.5 hover:border-[color:var(--line)] hover:bg-[color:var(--glass-hover)]",
        app:
          "border-white/12 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--app-card-bg)_86%,transparent),color-mix(in_srgb,var(--app-card-soft-bg)_96%,transparent))] text-[color:var(--app-text)] shadow-[0_18px_36px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl hover:-translate-y-0.5"
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
