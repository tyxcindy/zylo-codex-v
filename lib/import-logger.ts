import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { ImportPipelineResult } from "@/lib/import-pipeline";

type ImportLogStatus = "success" | "failure";

type ImportLogInput = {
  userId: string;
  artifactId: string;
  importJobId?: string | null;
  type: "url" | "text" | "image";
  label: string;
  sourceContent: string;
  destinationHint?: string;
  status: ImportLogStatus;
  message: string;
  candidateCount: number;
  ip?: string;
  error?: string;
  analysis?: ImportPipelineResult | null;
  persistenceFailures?: Array<{ candidateName: string; error: string }>;
};

function getImportLogPath() {
  return path.join(process.cwd(), "logs", "imports.jsonl");
}

function buildContentPreview(input: string) {
  return input.replace(/\s+/g, " ").trim().slice(0, 500);
}

function buildStageFailures(
  stages: ImportPipelineResult["stages"] | null | undefined
) {
  if (!stages) {
    return [];
  }

  return Object.entries(stages)
    .filter(([, stage]) => stage.status === "failed")
    .map(([name, stage]) => ({
      name,
      detail: stage.detail
    }));
}

export async function appendImportLog(input: ImportLogInput) {
  const logPath = getImportLogPath();
  await mkdir(path.dirname(logPath), { recursive: true });

  const entry = {
    timestamp: new Date().toISOString(),
    userId: input.userId,
    artifactId: input.artifactId,
    importJobId: input.importJobId ?? null,
    type: input.type,
    label: input.label,
    status: input.status,
    message: input.message,
    error: input.error ?? null,
    candidateCount: input.candidateCount,
    destinationHint: input.destinationHint ?? null,
    ip: input.ip ?? null,
    sourceUrl: input.type === "url" ? input.sourceContent : null,
    sourceContentPreview: buildContentPreview(input.sourceContent),
    analysis: input.analysis
      ? {
          score: input.analysis.score,
          failureReason: input.analysis.failureReason ?? null,
          diagnostics: input.analysis.diagnostics,
          stages: input.analysis.stages,
          stageFailures: buildStageFailures(input.analysis.stages),
          evidencePreview: input.analysis.evidencePreview,
          candidateNames: input.analysis.candidates.map((candidate) => candidate.name)
        }
      : null,
    persistenceFailures: input.persistenceFailures ?? []
  };

  await appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8");
}
