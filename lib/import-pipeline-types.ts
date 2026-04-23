import type { TravelScoreResult } from "@/lib/import-analysis";
import type { ExtractedPlaceCandidate } from "@/lib/providers/gemini";

export type ImportPipelineInput = {
  type: "url" | "text" | "image";
  content: string;
  destinationHint?: string;
};

export type PipelineStageStatus = "complete" | "skipped" | "failed";

export type PipelineStage = {
  status: PipelineStageStatus;
  detail: string;
};

export type PipelineStageName =
  | "metadata"
  | "ytDlp"
  | "subtitles"
  | "download"
  | "frames"
  | "ocr"
  | "transcript"
  | "geocoding"
  | "languageNormalization"
  | "geminiRefinement";

export type PipelineStages = Record<PipelineStageName, PipelineStage>;

export type YtDlpInfo = {
  title?: string;
  description?: string;
  uploader?: string;
  duration?: number;
  tags?: string[];
  channel?: string;
  webpage_url?: string;
};

export type CandidateSeed = ExtractedPlaceCandidate & {
  queryHint?: string;
  evidence?: string[];
  allowGenericLocation?: boolean;
};

export type PipelineCandidate = ExtractedPlaceCandidate & {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  mapsUrl?: string | null;
  verificationSource?: "nominatim" | "photon" | "google" | "gemini" | "context";
  evidence?: string[];
  allowGenericLocation?: boolean;
};

export type EvidencePreview = {
  title?: string | null;
  description?: string | null;
  pageText?: string | null;
  subtitlesText?: string | null;
  transcriptText?: string | null;
  ocrText?: string | null;
};

export type CollectedEvidence = EvidencePreview & {
  ytDlpInfo: YtDlpInfo | null;
};

export type ImportPipelineResult = {
  candidates: PipelineCandidate[];
  combinedText: string;
  diagnostics: string[];
  failureReason?: string;
  stages: PipelineStages;
  score: TravelScoreResult;
  evidencePreview: EvidencePreview;
};
