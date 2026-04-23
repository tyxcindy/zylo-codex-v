import { ApiClientError, getApiErrorMessage, postJson } from "@/lib/client/api";

describe("client api helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts JSON and returns parsed payloads", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true })
    } as Response);

    await expect(postJson<{ ok: boolean }>("/api/test", { hello: "world" })).resolves.toEqual({
      ok: true
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ hello: "world" })
      })
    );
  });

  it("throws ApiClientError with the API error message", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: "Quota exceeded" })
    } as Response);

    await expect(postJson("/api/test", {})).rejects.toMatchObject({
      name: "ApiClientError",
      status: 422,
      message: "Quota exceeded"
    });
  });

  it("extracts the first validation message from array payloads", () => {
    const error = new ApiClientError("bad request", 400, {
      errors: ["Enter a valid email address."]
    });

    expect(getApiErrorMessage(error, "Fallback")).toBe("Enter a valid email address.");
  });

  it("falls back cleanly when the response body is not JSON", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid json");
      }
    } as unknown as Response);

    await expect(postJson("/api/test", {})).rejects.toMatchObject({
      status: 500,
      message: "Request failed with status 500."
    });
  });
});
