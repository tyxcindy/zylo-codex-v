import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[color:var(--line)] bg-[color:var(--card)] p-6 backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
