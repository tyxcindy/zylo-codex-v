import { postJson } from "@/lib/client/api";

export type ImportRequest = {
  type: "url" | "text" | "image";
  content: string;
  destinationHint?: string;
};

export type ImportResponse = {
  job?: {
    id?: string;
    status?: string;
    extractedPlaces?: number;
  };
  importJob?: {
    id?: string | null;
    status?: string;
    stage?: string;
    stageDetail?: string;
    errorMessage?: string | null;
  } | null;
  statusUrl?: string;
};

export type ImportStatusResponse = {
  job?: {
    id?: string;
    status?: string;
    extractedPlaces?: number;
  };
  importJob?: {
    id?: string | null;
    status?: string;
    stage?: string;
    stageDetail?: string;
    errorMessage?: string | null;
  } | null;
  analysisPreview?: Record<string, unknown> | null;
};

export function submitImportRequest(payload: ImportRequest) {
  return postJson<ImportResponse>("/api/imports", payload);
}

export async function getImportStatus(statusUrl: string) {
  const response = await fetch(statusUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Import status request failed with status ${response.status}.`);
  }

  return (await response.json()) as ImportStatusResponse;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForImportCompletion(
  statusUrl: string,
  options?: {
    intervalMs?: number;
    maxAttempts?: number;
    onProgress?: (status: ImportStatusResponse) => void;
  }
) {
  const intervalMs = options?.intervalMs ?? 1500;
  const maxAttempts = options?.maxAttempts ?? 90;
  let latestStatus = await getImportStatus(statusUrl);
  options?.onProgress?.(latestStatus);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const jobStatus = latestStatus.job?.status;
    const importStatus = latestStatus.importJob?.status;

    if (jobStatus === "complete" || importStatus === "complete") {
      return latestStatus;
    }

    if (jobStatus === "failed" || importStatus === "failed") {
      return latestStatus;
    }

    await sleep(intervalMs);
    latestStatus = await getImportStatus(statusUrl);
    options?.onProgress?.(latestStatus);
  }

  return latestStatus;
}
