import * as React from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--card-2)] px-4 text-sm text-[color:var(--text)] outline-none transition placeholder:text-[color:var(--text-soft)] focus:border-[color:var(--brand)]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
