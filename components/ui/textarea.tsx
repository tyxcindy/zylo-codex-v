import * as React from "react";
import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[140px] w-full rounded-[24px] border border-[color:var(--line)] bg-[color:var(--card-2)] px-4 py-4 text-sm text-[color:var(--text)] outline-none transition placeholder:text-[color:var(--text-soft)] focus:border-[color:var(--brand)]",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
