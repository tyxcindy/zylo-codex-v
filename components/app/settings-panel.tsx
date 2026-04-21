import type { ProviderStatus } from "@/lib/provider-status";
import { platformConnections, providerChecklist } from "@/lib/data";
import type { SourceArtifact } from "@/lib/domain";

export function SettingsPanel({
  providerStatus,
  signOutAction,
  profile,
  sourceArtifacts
}: {
  providerStatus: ProviderStatus;
  signOutAction: (formData: FormData) => void | Promise<void>;
  profile: { displayName: string; email: string; homeCity: string };
  sourceArtifacts: SourceArtifact[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="app-card px-6 py-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">Account</p>
        <div className="mt-5 space-y-4 text-sm leading-7 text-[color:var(--app-text-soft)]">
          <p>Display name: {profile.displayName}</p>
          <p>Email: {profile.email}</p>
          <p>Home city: {profile.homeCity}</p>
          <p>Manual import is live. Direct account sync stays scaffold-only in the first beta.</p>
        </div>
        <form action={signOutAction} className="mt-6">
          <button className="rounded-full border border-[color:var(--line)] bg-[color:var(--glass-bg)] px-4 py-2 text-sm font-semibold text-[color:var(--app-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]">
            Sign out
          </button>
        </form>
      </div>

      <div className="app-card px-6 py-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">Connected accounts</p>
        <div className="mt-5 space-y-4">
          {platformConnections.map((connection) => {
            return (
              <div key={connection.id} className="app-card-soft px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[color:var(--app-text)]">{connection.platform}</p>
                  <span className="app-pill px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    {connection.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--app-text-soft)]">{connection.summary}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="app-card px-6 py-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">Import history</p>
        <div className="mt-5 space-y-4">
          {sourceArtifacts.map((artifact) => (
            <div key={artifact.id} className="app-card-soft px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[color:var(--app-text)]">{artifact.label}</p>
                <span className="app-pill px-3 py-1 text-xs uppercase tracking-[0.18em]">
                  {artifact.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--app-text-soft)]">
                {artifact.type} · {artifact.extractedPlaces} places · {artifact.createdAt}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="app-card px-6 py-6 xl:col-span-2">
        <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--app-text-soft)]">Provider status</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {providerChecklist.map((provider) => {
            const status = providerStatus[provider.key];

            return (
              <div key={provider.key} className="app-card-soft px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[color:var(--app-text)]">{provider.label}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      status === "configured"
                        ? "bg-emerald-300/14 text-emerald-200"
                        : "bg-amber-300/14 text-amber-200"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--app-text-soft)]">{provider.note}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
