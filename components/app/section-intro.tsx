type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionIntro({ eyebrow, title, description }: SectionIntroProps) {
  return (
    <div className="app-card mb-6 px-6 py-6 sm:px-8 sm:py-7">
      <p className="app-kicker text-xs text-[color:var(--app-text-soft)]">
        {eyebrow}
      </p>
      <h1 className="app-display-title mt-3 max-w-4xl text-[2.5rem] leading-[0.92] text-[color:var(--app-text)] sm:text-[3.35rem]">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--app-text-soft)] sm:text-base sm:leading-8">
        {description}
      </p>
    </div>
  );
}
