"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Link2, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/client/api";
import { submitImportRequest, waitForImportCompletion } from "@/lib/client/imports";
import type { SourceArtifact } from "@/lib/domain";

const modes = [
  { id: "url", label: "Links from Instagram, Tiktok, Blogs, etc", icon: Link2 },
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
  const trimmedContent = content.trim();
  const trimmedDestinationHint = destinationHint.trim();

  async function handleSubmit() {
    if (!trimmedContent) {
      setStatus("Add the reel link, caption, or screenshot text first.");
      setStatusTone("error");
      return;
    }

    setLoading(true);
    setStatus(null);
    setStatusTone("neutral");

    try {
      const payload = await submitImportRequest({
        type: mode,
        content: trimmedContent,
        destinationHint: trimmedDestinationHint || undefined
      });

      if (payload.statusUrl) {
        setStatus(
          payload.importJob?.stageDetail ?? "Import queued. Recovering transcript and place evidence."
        );

        const finalStatus = await waitForImportCompletion(payload.statusUrl, {
          onProgress: (jobStatus) => {
            if (jobStatus.importJob?.stageDetail) {
              setStatus(jobStatus.importJob.stageDetail);
            }
          }
        });

        if (finalStatus.job?.status === "complete") {
          setStatus(
            finalStatus.job?.extractedPlaces
              ? `Imported ${finalStatus.job.extractedPlaces} place(s) and saved the job.`
              : "Import finished, but no actionable places were found."
          );
          setStatusTone(finalStatus.job?.extractedPlaces ? "success" : "error");
          setContent("");
          setDestinationHint("");
        } else if (finalStatus.job?.status === "failed" || finalStatus.importJob?.status === "failed") {
          setStatus(
            finalStatus.importJob?.errorMessage ??
              "This import failed before Zylo could save any places."
          );
          setStatusTone("error");
        } else {
          setStatus("Import is still processing. Refresh in a moment for the latest status.");
          setStatusTone("neutral");
        }
      } else {
        setStatus(
          payload?.job?.extractedPlaces
            ? `Imported ${payload.job.extractedPlaces} place(s) and saved the job.`
            : "Import finished, but no actionable places were found."
        );
        setStatusTone(payload?.job?.extractedPlaces ? "success" : "error");
        setContent("");
        setDestinationHint("");
      }

      router.refresh();
    } catch (error) {
      setStatus(
        getApiErrorMessage(
          error,
          "Import request failed before Zylo received it. Refresh the page and try again."
        )
      );
      setStatusTone("error");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(420px,1.05fr)_minmax(0,0.95fr)]">
      <Card className="p-7 xl:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">New import</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
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
                } min-h-[112px] px-5 py-5`}
                onClick={() => setMode(item.id)}
              >
                <Icon className="h-5 w-5" />
                <p className="mt-4 text-[15px] font-semibold leading-6">{item.label}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-5 space-y-4">
          {mode === "url" && (
            <Input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Instagram, TikTok, blog, newsletter, or any travel link"
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
              placeholder="Paste OCR text or describe what the screenshot contains. URL imports now try metadata, subtitles, frame OCR, and free parsing."
            />
          )}
          <Input
            value={destinationHint}
            onChange={(event) => setDestinationHint(event.target.value)}
            placeholder="Destination hint (optional, but helps free geocoding)"
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
            disabled={loading || !trimmedContent}
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
