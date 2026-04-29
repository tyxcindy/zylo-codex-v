import { WeaveSpinner } from "@/components/ui/weave-spinner";

export default function AppLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="app-card flex max-w-md flex-col items-center gap-4 px-8 py-8 text-center">
        <WeaveSpinner size={46} label="Loading page" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--app-text-soft)]">
            Loading
          </p>
          <p className="mt-2 text-sm text-[color:var(--app-text-soft)]">
            Pulling your travel workspace into view.
          </p>
        </div>
      </div>
    </div>
  );
}
