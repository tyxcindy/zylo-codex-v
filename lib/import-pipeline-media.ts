import { execFile } from "node:child_process";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";

import { subtitleToPlainText } from "@/lib/import-analysis";
import type { YtDlpInfo } from "@/lib/import-pipeline-types";

const execFileAsync = promisify(execFile);
const whisperScriptPath = path.resolve(process.cwd(), "scripts/transcribe_audio.py");
const ocrLanguagePack = "eng+chi_tra+chi_sim";
const ytDlpBinaryPath = path.resolve(process.cwd(), "node_modules/yt-dlp-exec/bin/yt-dlp");
const bundledFfmpegPath = path.resolve(process.cwd(), "node_modules/ffmpeg-static/ffmpeg");
type MediaStepResult<T> = {
  data: T | null;
  error: string | null;
};

type YtDlpAttempt = {
  label: string;
  flags: Record<string, boolean | number | string | undefined>;
};

type SocialCookiePlatform = "instagram" | "tiktok";

type CookieFileConfig = {
  scope: SocialCookiePlatform | "all";
  path: string;
};

function buildYtDlpOptions() {
  return {
    noWarnings: true,
    noPlaylist: true,
    noCheckCertificates: true
  };
}

function scoreSubtitleFilename(file: string) {
  const normalized = file.toLowerCase();

  if (normalized.includes(".zh-tw.") || normalized.includes(".zh_hant.")) {
    return 5;
  }

  if (normalized.includes(".zh-hant.") || normalized.includes(".chi_tra.")) {
    return 4;
  }

  if (normalized.includes(".zh-hans.") || normalized.includes(".chi_sim.")) {
    return 3;
  }

  if (normalized.includes(".zh.")) {
    return 2;
  }

  if (normalized.includes(".en.")) {
    return 1;
  }

  return 0;
}

function toYtDlpFlagName(key: string) {
  return `--${key.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`)}`;
}

export function buildYtDlpArgs(
  url: string,
  flags: Record<string, boolean | number | string | undefined>
) {
  const args: string[] = [url];

  for (const [key, value] of Object.entries(flags)) {
    if (value === undefined || value === false || value === null) {
      continue;
    }

    args.push(toYtDlpFlagName(key));

    if (value === true) {
      continue;
    }

    args.push(String(value));
  }

  return args;
}

function summarizeError(error: unknown) {
  const parts: string[] = [];

  if (error instanceof Error) {
    parts.push(error.message);
  } else if (typeof error === "string") {
    parts.push(error);
  } else if (error) {
    parts.push(JSON.stringify(error));
  }

  if (typeof error === "object" && error !== null) {
    const errorWithOutput = error as {
      stderr?: string | Buffer;
      stdout?: string | Buffer;
      shortMessage?: string;
    };

    if (errorWithOutput.shortMessage) {
      parts.push(errorWithOutput.shortMessage);
    }

    if (errorWithOutput.stderr) {
      parts.push(String(errorWithOutput.stderr));
    }

    if (errorWithOutput.stdout) {
      parts.push(String(errorWithOutput.stdout));
    }
  }

  return parts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 560);
}

export function isYtDlpAuthError(message: string | null | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return (
    normalized.includes("login required") ||
    normalized.includes("cookies-from-browser") ||
    normalized.includes("cookies for the authentication") ||
    normalized.includes("rate-limit reached") ||
    normalized.includes("requested content is not available") ||
    normalized.includes("private video") ||
    normalized.includes("not available in your region") ||
    normalized.includes("login to view") ||
    normalized.includes("sign in") ||
    normalized.includes("checkpoint required")
  );
}

function resolveSocialCookiePlatform(url: string) {
  if (/instagram\.com/i.test(url)) {
    return "instagram" satisfies SocialCookiePlatform;
  }

  if (/tiktok\.com/i.test(url)) {
    return "tiktok" satisfies SocialCookiePlatform;
  }

  return null;
}

function getCookieBrowserCandidates() {
  const explicit = process.env.ZYLO_YTDLP_COOKIE_BROWSERS?.trim();

  if (explicit) {
    return explicit
      .split(",")
      .map((browser) => browser.trim())
      .filter(Boolean);
  }

  if (process.platform === "darwin") {
    return ["chrome", "safari", "brave", "edge"];
  }

  if (process.platform === "win32") {
    return ["chrome", "edge", "brave", "firefox"];
  }

  return ["chrome", "chromium", "brave", "firefox"];
}

function parseCookieFileScope(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "instagram" || normalized === "ig") {
    return "instagram" satisfies SocialCookiePlatform;
  }

  if (normalized === "tiktok" || normalized === "tt") {
    return "tiktok" satisfies SocialCookiePlatform;
  }

  if (normalized === "all" || normalized === "*") {
    return "all" as const;
  }

  return null;
}

function parseCookieFileConfigs() {
  const configs: CookieFileConfig[] = [];
  const fallbackCookieFile = process.env.ZYLO_YTDLP_COOKIES_FILE?.trim();

  if (fallbackCookieFile) {
    configs.push({
      scope: "all",
      path: fallbackCookieFile
    });
  }

  const explicit = process.env.ZYLO_YTDLP_COOKIE_FILES?.trim();
  if (!explicit) {
    return configs;
  }

  for (const rawEntry of explicit.split(",")) {
    const entry = rawEntry.trim();

    if (!entry) {
      continue;
    }

    const separatorIndex = entry.indexOf("=");
    if (separatorIndex === -1) {
      configs.push({
        scope: "all",
        path: entry
      });
      continue;
    }

    const scope = parseCookieFileScope(entry.slice(0, separatorIndex));
    const cookiePath = entry.slice(separatorIndex + 1).trim();

    if (!scope || !cookiePath) {
      continue;
    }

    configs.push({
      scope,
      path: cookiePath
    });
  }

  return configs;
}

function getCookieFileConfigsForUrl(url: string) {
  const platform = resolveSocialCookiePlatform(url);

  if (!platform) {
    return [];
  }

  const parsedConfigs = parseCookieFileConfigs();
  const seenCookiePaths = new Set<string>();
  const orderedConfigs = [
    ...parsedConfigs.filter((config) => config.scope === platform),
    ...parsedConfigs.filter((config) => config.scope === "all")
  ];

  return orderedConfigs.filter((config) => {
    const dedupeKey = `${config.scope}:${config.path}`;

    if (seenCookiePaths.has(dedupeKey)) {
      return false;
    }

    seenCookiePaths.add(dedupeKey);
    return true;
  });
}

function shouldAttemptAuthCookieRetries(url: string, priorError: string | null) {
  if (!resolveSocialCookiePlatform(url)) {
    return false;
  }

  return isYtDlpAuthError(priorError);
}

function shouldAttemptBrowserCookies(url: string, priorError: string | null) {
  if (process.env.ZYLO_YTDLP_DISABLE_BROWSER_COOKIES === "1") {
    return false;
  }

  return shouldAttemptAuthCookieRetries(url, priorError);
}

export function buildYtDlpAttempts(
  url: string,
  flags: Record<string, boolean | number | string | undefined>,
  priorError: string | null = null
) {
  const attempts: YtDlpAttempt[] = [
    {
      label: "direct",
      flags
    }
  ];

  if (!shouldAttemptAuthCookieRetries(url, priorError)) {
    return attempts;
  }

  for (const cookieFile of getCookieFileConfigsForUrl(url)) {
    attempts.push({
      label: `cookie-file:${cookieFile.scope}:${cookieFile.path}`,
      flags: {
        ...flags,
        cookies: cookieFile.path
      }
    });
  }

  if (!shouldAttemptBrowserCookies(url, priorError)) {
    return attempts;
  }

  for (const browser of getCookieBrowserCandidates()) {
    attempts.push({
      label: `cookies:${browser}`,
      flags: {
        ...flags,
        cookiesFromBrowser: browser
      }
    });
  }

  return attempts;
}

export function getPendingYtDlpAttempts(input: {
  url: string;
  flags: Record<string, boolean | number | string | undefined>;
  priorError?: string | null;
  attemptedLabels?: Iterable<string>;
}) {
  const attemptedLabels = new Set(input.attemptedLabels ?? []);

  return buildYtDlpAttempts(input.url, input.flags, input.priorError ?? null).filter(
    (attempt) => !attemptedLabels.has(attempt.label)
  );
}

async function execYtDlpBinary(
  url: string,
  flags: Record<string, boolean | number | string | undefined>
) {
  return execFileAsync(ytDlpBinaryPath, buildYtDlpArgs(url, flags), {
    timeout: 120_000,
    maxBuffer: 1024 * 1024 * 8
  });
}

async function runYtDlpAttempt(
  url: string,
  flags: Record<string, boolean | number | string | undefined>
) {
  return execYtDlpBinary(url, flags);
}

async function safeYtDlpExec(
  url: string,
  flags: Record<string, boolean | number | string | undefined>
) {
  const errors: string[] = [];
  const attemptedLabels = new Set<string>();

  while (true) {
    const attempts = getPendingYtDlpAttempts({
      url,
      flags,
      priorError: errors.at(-1) ?? null,
      attemptedLabels
    });

    if (attempts.length === 0) {
      break;
    }

    for (const attempt of attempts) {
      attemptedLabels.add(attempt.label);
      try {
        return await runYtDlpAttempt(url, attempt.flags);
      } catch (error) {
        errors.push(`${attempt.label}=${summarizeError(error)}`);
      }
    }
  }

  throw new Error(errors.join(" | "));
}

export async function safeYtDlpJson(url: string): Promise<MediaStepResult<YtDlpInfo>> {
  const flags = {
    ...buildYtDlpOptions(),
    dumpSingleJson: true,
    skipDownload: true
  };

  const errors: string[] = [];
  const attemptedLabels = new Set<string>();

  while (true) {
    const attempts = getPendingYtDlpAttempts({
      url,
      flags,
      priorError: errors.at(-1) ?? null,
      attemptedLabels
    });

    if (attempts.length === 0) {
      break;
    }

    for (const attempt of attempts) {
      attemptedLabels.add(attempt.label);
      try {
        const { stdout } = await runYtDlpAttempt(url, attempt.flags);
        return {
          data: JSON.parse(stdout) as YtDlpInfo,
          error: null
        };
      } catch (error) {
        errors.push(`${attempt.label}=${summarizeError(error)}`);
      }
    }
  }

  return {
    data: null,
    error: errors.join(" | ")
  };
}

export async function downloadSubtitles(
  url: string,
  tempDir: string
): Promise<MediaStepResult<string>> {
  const flags = {
    ...buildYtDlpOptions(),
    skipDownload: true,
    writeAutoSub: true,
    writeSub: true,
    subLang: "all,-live_chat",
    subFormat: "vtt",
    output: path.join(tempDir, "artifact.%(ext)s")
  };

  try {
    await safeYtDlpExec(url, flags);

    const files = await readdir(tempDir);
    const subtitleFile = files
      .filter((file) => /\.(vtt|srt|ass|ssa|ttml)$/i.test(file))
      .sort((left, right) => scoreSubtitleFilename(right) - scoreSubtitleFilename(left))[0];

    if (!subtitleFile) {
      return {
        data: null,
        error: "yt-dlp ran, but no subtitle file was written."
      };
    }

    const raw = await readFile(path.join(tempDir, subtitleFile), "utf8");
    return {
      data: subtitleToPlainText(raw),
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: summarizeError(error)
    };
  }
}

export async function downloadVideo(
  url: string,
  tempDir: string
): Promise<MediaStepResult<string>> {
  const flags = {
    ...buildYtDlpOptions(),
    format: "mp4/best[ext=mp4]/best",
    output: path.join(tempDir, "video.%(ext)s")
  };

  try {
    await safeYtDlpExec(url, flags);

    const files = await readdir(tempDir);
    const videoFile = files.find((file) => /\.(mp4|mov|mkv|webm)$/i.test(file));
    return {
      data: videoFile ? path.join(tempDir, videoFile) : null,
      error: videoFile ? null : "yt-dlp ran, but no video file was written."
    };
  } catch (error) {
    return {
      data: null,
      error: summarizeError(error)
    };
  }
}

async function resolveFfmpegBinaryPath() {
  const explicit = process.env.ZYLO_FFMPEG_PATH?.trim();

  if (explicit) {
    return explicit;
  }

  const candidates = [bundledFfmpegPath, ffmpegPath].filter(
    (candidate): candidate is string => Boolean(candidate)
  );

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

export async function extractFrames(
  videoPath: string,
  tempDir: string
): Promise<MediaStepResult<string[]>> {
  const resolvedFfmpegPath = await resolveFfmpegBinaryPath();

  if (!resolvedFfmpegPath) {
    return {
      data: [],
      error: "ffmpeg is unavailable on this server."
    };
  }

  const outputPattern = path.join(tempDir, "frame-%02d.jpg");

  try {
    await execFileAsync(
      resolvedFfmpegPath,
      [
        "-y",
        "-i",
        videoPath,
        "-vf",
        "fps=1/2,scale=min(1280\\,iw):-1",
        "-frames:v",
        "8",
        outputPattern
      ],
      { timeout: 60_000 }
    );

    const files = await readdir(tempDir);
    const framePaths = files
      .filter((file) => /^frame-\d+\.jpg$/i.test(file))
      .map((file) => path.join(tempDir, file));

    return {
      data: framePaths,
      error: framePaths.length > 0 ? null : "ffmpeg ran, but no frames were written."
    };
  } catch {
    return {
      data: [],
      error: "ffmpeg could not sample frames from the downloaded video."
    };
  }
}

export async function extractAudio(
  videoPath: string,
  tempDir: string
): Promise<MediaStepResult<string>> {
  const resolvedFfmpegPath = await resolveFfmpegBinaryPath();

  if (!resolvedFfmpegPath) {
    return {
      data: null,
      error: "ffmpeg is unavailable on this server."
    };
  }

  const audioPath = path.join(tempDir, "audio.wav");

  try {
    await execFileAsync(
      resolvedFfmpegPath,
      ["-y", "-i", videoPath, "-vn", "-ac", "1", "-ar", "16000", audioPath],
      { timeout: 60_000 }
    );
    return {
      data: audioPath,
      error: null
    };
  } catch {
    return {
      data: null,
      error: "ffmpeg could not extract audio for local transcription."
    };
  }
}

export async function performOcr(framePaths: string[]) {
  if (framePaths.length === 0) {
    return "";
  }

  const { createWorker } = await import("tesseract.js");
  let worker;

  try {
    worker = await createWorker(ocrLanguagePack, 1, {
      logger: () => undefined
    });
  } catch {
    worker = await createWorker("eng", 1, {
      logger: () => undefined
    });
  }

  try {
    const snippets: string[] = [];

    for (const framePath of framePaths.slice(0, 6)) {
      const result = await worker.recognize(framePath);
      const text = result.data.text.replace(/\s+/g, " ").trim();
      if (text.length >= 8) {
        snippets.push(text);
      }
    }

    return snippets.join("\n");
  } finally {
    await worker.terminate();
  }
}

export async function resolveWhisperPythonPath() {
  const explicit = process.env.ZYLO_WHISPER_PYTHON?.trim();
  if (explicit) {
    return explicit;
  }

  const candidates = [
    path.resolve(process.cwd(), ".venv/bin/python"),
    path.resolve(process.cwd(), ".venv/Scripts/python.exe"),
    "python3"
  ];

  for (const candidate of candidates) {
    if (candidate === "python3") {
      return candidate;
    }

    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return "python3";
}

export function getWhisperScriptPath() {
  return whisperScriptPath;
}

export async function tryLocalWhisperTranscript(audioPath: string) {
  const pythonPath = await resolveWhisperPythonPath();
  const transcriptPath = audioPath.replace(/\.wav$/i, ".txt");

  try {
    await execFileAsync(
      pythonPath,
      [
        whisperScriptPath,
        "--input",
        audioPath,
        "--output",
        transcriptPath,
        "--model",
        "tiny"
      ],
      {
        timeout: 180_000,
        env: {
          ...process.env,
          PATH: ffmpegPath
            ? `${path.dirname(ffmpegPath)}${path.delimiter}${process.env.PATH ?? ""}`
            : process.env.PATH
        }
      }
    );

    return await readFile(transcriptPath, "utf8");
  } catch {
    return null;
  }
}
