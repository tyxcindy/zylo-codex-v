import type { ReactNode } from "react";

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function SectionIntro({ eyebrow, title, description, actions }: SectionIntroProps) {
  return (
    <div className="app-card mb-6 px-6 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="app-kicker text-xs text-[color:var(--app-text-soft)]">
            {eyebrow}
          </p>
          <h1 className="app-display-title mt-3 max-w-5xl text-[2.35rem] leading-[0.96] text-[color:var(--app-text)] sm:text-[3.1rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--app-text-soft)] sm:text-base sm:leading-8">
            {description}
          </p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
