export class ApiClientError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

async function parseJson(response: Response) {
  return (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | Array<unknown>
    | null;
}

function getPayloadMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.error === "string" && record.error) {
    return record.error;
  }

  if (Array.isArray(record.errors) && typeof record.errors[0] === "string") {
    return record.errors[0];
  }

  if (typeof record.message === "string" && record.message) {
    return record.message;
  }

  return null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return getPayloadMessage(error.payload) ?? error.message ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function postJson<TResponse>(url: string, body: unknown): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new ApiClientError(
      getPayloadMessage(payload) ?? `Request failed with status ${response.status}.`,
      response.status,
      payload
    );
  }

  return (payload ?? {}) as TResponse;
}
