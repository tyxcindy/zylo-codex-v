import type { PipelineStages } from "@/lib/import-pipeline-types";

export function createInitialStages(): PipelineStages {
  return {
    metadata: { status: "skipped", detail: "Not run." },
    ytDlp: { status: "skipped", detail: "Not run." },
    subtitles: { status: "skipped", detail: "Not run." },
    download: { status: "skipped", detail: "Not run." },
    frames: { status: "skipped", detail: "Not run." },
    ocr: { status: "skipped", detail: "Not run." },
    transcript: { status: "skipped", detail: "Not run." },
    geocoding: { status: "skipped", detail: "Not run." },
    languageNormalization: { status: "skipped", detail: "Not run." },
    geminiRefinement: { status: "skipped", detail: "Not run." }
  };
}
