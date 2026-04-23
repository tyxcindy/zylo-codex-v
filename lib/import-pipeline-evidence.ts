import { fetchUrlMetadata } from "@/lib/url-metadata";
import {
  downloadSubtitles,
  downloadVideo,
  extractAudio,
  extractFrames,
  performOcr,
  safeYtDlpJson,
  tryLocalWhisperTranscript
} from "@/lib/import-pipeline-media";
import type {
  CollectedEvidence,
  ImportPipelineInput,
  PipelineStages
} from "@/lib/import-pipeline-types";

export async function collectImportEvidence(
  input: ImportPipelineInput,
  tempDir: string,
  stages: PipelineStages,
  diagnostics: string[]
): Promise<CollectedEvidence> {
  let title: string | null = null;
  let description: string | null = null;
  let pageText: string | null = null;
  let subtitlesText: string | null = null;
  let transcriptText: string | null = null;
  let ocrText: string | null = null;
  let ytDlpInfo = null;

  if (input.type === "url") {
    const urlMetadata = await fetchUrlMetadata(input.content);
    title = urlMetadata.title;
    description = urlMetadata.description;
    pageText = urlMetadata.pageText;
    stages.metadata = {
      status: urlMetadata.rawText ? "complete" : "failed",
      detail: urlMetadata.pageText
        ? "Recovered page metadata and article body text."
        : urlMetadata.rawText
          ? "Recovered page metadata text."
          : "No public page metadata text found."
    };

    const ytDlpResult = await safeYtDlpJson(input.content);
    ytDlpInfo = ytDlpResult.data;
    if (ytDlpResult.error) {
      diagnostics.push(`yt-dlp metadata failed: ${ytDlpResult.error}`);
    }
    stages.ytDlp = {
      status: ytDlpInfo ? "complete" : "failed",
      detail: ytDlpInfo
        ? "Recovered platform metadata."
        : ytDlpResult.error
          ? `yt-dlp metadata failed: ${ytDlpResult.error}`
          : "yt-dlp could not recover platform metadata."
    };

    const subtitlesResult = await downloadSubtitles(input.content, tempDir);
    subtitlesText = subtitlesResult.data;
    if (subtitlesResult.error) {
      diagnostics.push(`subtitles failed: ${subtitlesResult.error}`);
    }
    stages.subtitles = {
      status: subtitlesText ? "complete" : "failed",
      detail: subtitlesText
        ? "Recovered subtitle or auto-caption text."
        : subtitlesResult.error
          ? `Subtitles unavailable: ${subtitlesResult.error}`
          : "No subtitle text recovered."
    };

    const videoResult = await downloadVideo(input.content, tempDir);
    const videoPath = videoResult.data;
    if (videoResult.error) {
      diagnostics.push(`video download failed: ${videoResult.error}`);
    }
    stages.download = {
      status: videoPath ? "complete" : "failed",
      detail: videoPath
        ? "Downloaded media for OCR and optional ASR."
        : videoResult.error
          ? `Media download failed: ${videoResult.error}`
          : "Could not download media for local parsing."
    };

    if (videoPath) {
      const frameResult = await extractFrames(videoPath, tempDir);
      const framePaths = frameResult.data ?? [];
      if (frameResult.error) {
        diagnostics.push(`frames failed: ${frameResult.error}`);
      }
      stages.frames = {
        status: framePaths.length > 0 ? "complete" : "failed",
        detail:
          framePaths.length > 0
            ? `Sampled ${framePaths.length} frames.`
            : frameResult.error ?? "Frame extraction failed."
      };

      if (framePaths.length > 0) {
        ocrText = await performOcr(framePaths);
        stages.ocr = {
          status: ocrText ? "complete" : "failed",
          detail: ocrText ? "Recovered frame text with OCR." : "OCR did not find useful text."
        };
      }

      const audioResult = await extractAudio(videoPath, tempDir);
      const audioPath = audioResult.data;
      if (audioResult.error) {
        diagnostics.push(`audio failed: ${audioResult.error}`);
      }
      if (audioPath) {
        transcriptText = await tryLocalWhisperTranscript(audioPath);
        stages.transcript = {
          status: transcriptText ? "complete" : "skipped",
          detail: transcriptText
            ? "Recovered a local Whisper transcript."
            : "No local Whisper transcript was available. Platform subtitles still count as transcript evidence."
        };
      } else {
        stages.transcript = {
          status: "skipped",
          detail: audioResult.error ?? "No local audio track was available for transcription."
        };
      }
    }

    if (ytDlpInfo?.title && !title) {
      title = ytDlpInfo.title;
    }
    if (ytDlpInfo?.description && !description) {
      description = ytDlpInfo.description;
    }
  } else {
    stages.metadata = { status: "complete", detail: "Using pasted user text as primary evidence." };
    stages.ytDlp = { status: "skipped", detail: "Only URL imports use yt-dlp." };
    stages.subtitles = { status: "skipped", detail: "Only URL imports use subtitle recovery." };
    stages.download = { status: "skipped", detail: "Only URL imports download media." };
    stages.frames = { status: "skipped", detail: "Only URL imports sample frames." };
    stages.ocr = { status: "skipped", detail: "Image mode expects pasted OCR text today." };
    stages.transcript = { status: "skipped", detail: "Only URL imports attempt transcript recovery." };
  }

  return {
    title,
    description,
    pageText,
    subtitlesText,
    transcriptText,
    ocrText,
    ytDlpInfo
  };
}
