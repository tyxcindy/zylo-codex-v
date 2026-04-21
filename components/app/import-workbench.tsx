"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Link2, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SourceArtifact } from "@/lib/domain";

const modes = [
  { id: "url", label: "Paste a link", icon: Link2 },
  { id: "text", label: "Paste text", icon: Type },
  { id: "image", label: "Upload a screenshot", icon: ImagePlus }
] as const;

function summarizeArtifact(artifact: SourceArtifact) {
  const rawMessage =
    artifact.status === "complete"
      ? `${artifact.extractedPlaces} places extracted and normalized.`
      : artifact.status === "failed"
        ? artifact.errorMessage ?? "This import did not produce actionable places."
        : artifact.status === "processing"
          ? "Processing import."
          : "Queued for processing.";

  return rawMessage.length > 180 ? `${rawMessage.slice(0, 177)}...` : rawMessage;
}

export function ImportWorkbench({ sourceArtifacts }: { sourceArtifacts: SourceArtifact[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<(typeof modes)[number]["id"]>("url");
  const [content, setContent] = useState("");
  const [destinationHint, setDestinationHint] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"neutral" | "error" | "success">("neutral");
  const [loading, setLoading] = useState(false);
  const recentArtifacts = sourceArtifacts.slice(0, 3);

  async function handleSubmit() {
    setLoading(true);
    setStatus(null);
    setStatusTone("neutral");

    try {
      const response = await fetch("/api/imports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: mode,
          content,
          destinationHint
        })
      });

      const payload = await response.json().catch(() => null);
      setLoading(false);

      if (!response.ok) {
        setStatus(payload?.error ?? payload?.errors?.[0] ?? "Import failed.");
        setStatusTone("error");
        router.refresh();
        return;
      }

      setStatus(
        payload?.job?.extractedPlaces
          ? `Imported ${payload.job.extractedPlaces} place(s) and saved the job.`
          : "Import finished, but no actionable places were found."
      );
      setStatusTone(payload?.job?.extractedPlaces ? "success" : "error");
      setContent("");
      setDestinationHint("");
      router.refresh();
    } catch {
      setLoading(false);
      setStatus("Import request failed before Zylo received it. Refresh the page and try again.");
      setStatusTone("error");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">New import</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {modes.map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  active
                    ? "border-white/16 bg-[linear-gradient(135deg,var(--brand)_0%,color-mix(in_srgb,var(--brand)_72%,white)_100%)] text-white shadow-[0_18px_32px_rgba(91,104,255,0.24)]"
                    : "border-[color:var(--line)] bg-[color:var(--glass-bg)] text-[color:var(--text-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]"
                }`}
                onClick={() => setMode(item.id)}
              >
                <Icon className="h-4 w-4" />
                <p className="mt-3 text-sm font-semibold">{item.label}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-5 space-y-4">
          {mode === "url" && (
            <Input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="https://www.instagram.com/reel/..."
            />
          )}
          {mode === "text" && (
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste a caption, blog excerpt, or your own saved notes."
            />
          )}
          {mode === "image" && (
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="For the secure beta backend, paste OCR text or describe what the screenshot contains. Signed uploads are the next step."
            />
          )}
          <Input
            value={destinationHint}
            onChange={(event) => setDestinationHint(event.target.value)}
            placeholder="Destination hint (optional)"
          />
          {status ? (
            <p
              className={`text-sm ${
                statusTone === "error"
                  ? "text-rose-300"
                  : statusTone === "success"
                    ? "text-emerald-300"
                    : "text-[color:var(--text-soft)]"
              }`}
            >
              {status}
            </p>
          ) : null}
          <Button
            type="button"
            className="w-full"
            variant="app"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send to Zylo"}
          </Button>
        </div>
      </Card>
      <Card className="glass-panel border-[color:var(--line)] bg-[color:var(--glass-bg-strong)] text-[color:var(--app-text)] shadow-[var(--glass-shadow)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--app-text-soft)]">
          Latest uploads
        </p>
        <div className="mt-5 space-y-4">
          {recentArtifacts.length > 0 ? (
            recentArtifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--glass-bg)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[color:var(--app-text)]">{artifact.label}</p>
                    <p className="mt-1 text-sm text-[color:var(--app-text-soft)]">
                      {artifact.type} · {new Date(artifact.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="app-pill shrink-0 px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    {artifact.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[color:var(--app-text-soft)]">
                  {summarizeArtifact(artifact)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm leading-7 text-[color:var(--app-text-soft)]">
              No uploads yet. Your latest imports will show up here.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
