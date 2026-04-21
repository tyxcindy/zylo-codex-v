type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionIntro({ eyebrow, title, description }: SectionIntroProps) {
  return (
    <div className="app-card mb-6 px-6 py-6 sm:px-8 sm:py-7">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--app-text-soft)]">
        {eyebrow}
      </p>
      <h1 className="mt-3 max-w-4xl text-4xl leading-[0.98] text-[color:var(--app-text)] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--app-text-soft)] sm:text-base">
        {description}
      </p>
    </div>
  );
}
