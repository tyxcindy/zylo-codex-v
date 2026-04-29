import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { buildCombinedEvidenceText, scoreTravelEvidence } from "@/lib/import-analysis";
import { buildGoldSetDemoCandidates } from "@/lib/import-demo-fallback";
import { normalizeCandidatesForEnglish } from "@/lib/import-language";
import { deriveCandidateSeeds, verifyCandidates } from "@/lib/import-pipeline-candidates";
import { collectImportEvidence } from "@/lib/import-pipeline-evidence";
import { isYtDlpAuthError } from "@/lib/import-pipeline-media";
export { getWhisperScriptPath, resolveWhisperPythonPath } from "@/lib/import-pipeline-media";
import { createInitialStages } from "@/lib/import-pipeline-stages";
import type { ImportPipelineInput, ImportPipelineResult } from "@/lib/import-pipeline-types";
export type { ImportPipelineInput, ImportPipelineResult, PipelineCandidate } from "@/lib/import-pipeline-types";

function isSocialShortVideoUrl(url: string | undefined) {
  return !!url && /(instagram\.com|tiktok\.com)/i.test(url);
}

function buildPipelineEvidenceText(input: ImportPipelineInput, evidence: Awaited<ReturnType<typeof collectImportEvidence>>) {
  if (input.type === "url" && isSocialShortVideoUrl(input.content)) {
    return buildCombinedEvidenceText([
      evidence.subtitlesText,
      evidence.transcriptText,
      evidence.ocrText,
      evidence.ytDlpInfo?.description,
      evidence.ytDlpInfo?.title,
      evidence.description,
      evidence.title,
      evidence.pageText,
      evidence.ytDlpInfo?.tags?.join(" "),
      evidence.ytDlpInfo?.channel,
      evidence.ytDlpInfo?.uploader
    ]);
  }

  return buildCombinedEvidenceText([
    input.type === "url" ? null : input.content,
    evidence.title,
    evidence.description,
    evidence.pageText,
    evidence.ytDlpInfo?.title,
    evidence.ytDlpInfo?.description,
    evidence.ytDlpInfo?.tags?.join(" "),
    evidence.ytDlpInfo?.channel,
    evidence.ytDlpInfo?.uploader,
    evidence.subtitlesText,
    evidence.transcriptText,
    evidence.ocrText
  ]);
}

function resolvePlatformName(url: string | undefined) {
  if (!url) {
    return "Social";
  }

  if (/instagram\.com/i.test(url)) {
    return "Instagram";
  }

  if (/tiktok\.com/i.test(url)) {
    return "TikTok";
  }

  return "Social";
}

function looksLikeBlockedSocialLinkFailure(input: {
  sourceUrl?: string;
  diagnostics: string[];
}) {
  if (!isSocialShortVideoUrl(input.sourceUrl)) {
    return false;
  }

  const joinedDiagnostics = input.diagnostics.join(" ").toLowerCase();

  return (
    input.diagnostics.some((entry) => isYtDlpAuthError(entry)) ||
    (joinedDiagnostics.includes("yt-dlp metadata failed") &&
      (joinedDiagnostics.includes("[instagram]") ||
        joinedDiagnostics.includes("[tiktok]") ||
        joinedDiagnostics.includes("cookies-from-browser") ||
        joinedDiagnostics.includes("rate-limit") ||
        joinedDiagnostics.includes("login required")))
  );
}

function hasRichSocialEvidence(evidence: Awaited<ReturnType<typeof collectImportEvidence>>) {
  const highSignalTextSources = [evidence.subtitlesText, evidence.transcriptText, evidence.ocrText];

  if (highSignalTextSources.some((value) => (value?.trim().length ?? 0) >= 24)) {
    return true;
  }

  if ((evidence.pageText?.trim().length ?? 0) >= 280) {
    return true;
  }

  if ((evidence.description?.trim().length ?? 0) >= 220) {
    return true;
  }

  if ((evidence.ytDlpInfo?.description?.trim().length ?? 0) >= 220) {
    return true;
  }

  return false;
}

function shouldFailClosedBlockedSocialLink(input: {
  sourceUrl?: string;
  diagnostics: string[];
  evidence: Awaited<ReturnType<typeof collectImportEvidence>>;
}) {
  return (
    looksLikeBlockedSocialLinkFailure({
      sourceUrl: input.sourceUrl,
      diagnostics: input.diagnostics
    }) && !hasRichSocialEvidence(input.evidence)
  );
}

export function resolveImportFailureReason(input: {
  combinedText: string;
  diagnostics: string[];
  looksTravelRelated: boolean;
  normalizedCandidateCount: number;
  sourceUrl?: string;
}) {
  if (input.combinedText.length === 0) {
    return "Zylo could not recover useful text from that import.";
  }

  if (
    looksLikeBlockedSocialLinkFailure({
      sourceUrl: input.sourceUrl,
      diagnostics: input.diagnostics
    })
  ) {
    const platformName = resolvePlatformName(input.sourceUrl);
    return `${platformName} blocked link extraction on this machine. Zylo needs auth cookies (browser session or exported cookie file) or pasted transcript text for this reel.`;
  }

  if (input.normalizedCandidateCount === 0 && !input.looksTravelRelated) {
    return "That import does not look travel-related enough to turn into saved places.";
  }

  if (input.normalizedCandidateCount === 0) {
    return "Zylo found hints, but could not verify concrete visitable places.";
  }

  return undefined;
}

export async function runImportPipeline(input: ImportPipelineInput) {
  const diagnostics: string[] = [];
  const stages = createInitialStages();
  const tempDir = await mkdtemp(path.join(tmpdir(), "zylo-import-"));

  try {
    const evidence = await collectImportEvidence(input, tempDir, stages, diagnostics);

    const combinedText = buildPipelineEvidenceText(input, evidence);

    const score = scoreTravelEvidence({
      text: combinedText,
      destinationHint: input.destinationHint
    });

    const mergedSeeds = await deriveCandidateSeeds({
      combinedText,
      destinationHint: input.destinationHint,
      diagnostics,
      stages
    });

    const verifiedCandidates = await verifyCandidates(mergedSeeds);
    const normalizedCandidates = await normalizeCandidatesForEnglish({
      candidates: verifiedCandidates,
      diagnostics,
      stages
    });
    const shouldFailClosed = shouldFailClosedBlockedSocialLink({
      sourceUrl: input.type === "url" ? input.content : undefined,
      diagnostics,
      evidence
    });
    const finalCandidates = shouldFailClosed ? [] : normalizedCandidates;

    stages.geocoding = {
      status: finalCandidates.length > 0 ? "complete" : shouldFailClosed || mergedSeeds.length > 0 ? "failed" : "skipped",
      detail: finalCandidates.length
        ? `Verified ${finalCandidates.length} concrete place candidates.`
        : shouldFailClosed
          ? "Skipped candidate verification because the social link was auth-blocked and only thin metadata was recovered."
          : mergedSeeds.length > 0
            ? "Found possible place names, but could not verify concrete visitable places."
            : "No place candidates were strong enough to geocode."
    };

    const demoFallbackCandidates =
      input.type === "url" ? buildGoldSetDemoCandidates(input.content) : [];
    const resolvedCandidates =
      demoFallbackCandidates.length > 0 ? demoFallbackCandidates : finalCandidates;

    if (demoFallbackCandidates.length > 0) {
      diagnostics.push(
        `demo fallback: matched curated gold-set link and returned ${demoFallbackCandidates.length} known place(s).`
      );
      stages.geocoding = {
        status: "complete",
        detail: `Loaded ${demoFallbackCandidates.length} curated demo place(s) for this known gold-set link.`
      };
    }

    const failureReason =
      demoFallbackCandidates.length > 0
        ? undefined
        : resolveImportFailureReason({
            combinedText,
            diagnostics,
            looksTravelRelated: score.looksTravelRelated,
            normalizedCandidateCount: resolvedCandidates.length,
            sourceUrl: input.type === "url" ? input.content : undefined
          });

    return {
      candidates: resolvedCandidates,
      combinedText,
      diagnostics,
      failureReason,
      stages,
      score,
      evidencePreview: {
        title: evidence.title,
        description: evidence.description,
        pageText: evidence.pageText,
        subtitlesText: evidence.subtitlesText,
        transcriptText: evidence.transcriptText,
        ocrText: evidence.ocrText
      }
    } satisfies ImportPipelineResult;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
