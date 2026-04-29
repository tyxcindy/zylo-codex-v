export {};

function createSourceArtifactsSupabaseMock() {
  let insertAttempt = 0;

  return {
    from: vi.fn((table: string) => {
      if (table !== "source_artifacts") {
        throw new Error(`Unhandled table ${table}`);
      }

      return {
        insert: vi.fn((payload: Record<string, unknown>) => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              insertAttempt += 1;

              if (insertAttempt === 1) {
                expect(payload.destination_hint).toBe("Hong Kong");
                return {
                  data: null,
                  error: {
                    code: "PGRST204",
                    message:
                      "Could not find the 'destination_hint' column of 'source_artifacts' in the schema cache"
                  }
                };
              }

              expect(payload.destination_hint).toBeUndefined();
              return {
                data: {
                  id: "artifact-1",
                  type: "url",
                  label: "New link import",
                  status: "queued",
                  created_at: "2026-04-24T00:00:00.000Z",
                  extracted_places: 0
                },
                error: null
              };
            })
          }))
        }))
      };
    })
  };
}

function createImportJobsSupabaseMock() {
  let insertAttempt = 0;

  return {
    from: vi.fn((table: string) => {
      if (table !== "import_jobs") {
        throw new Error(`Unhandled table ${table}`);
      }

      return {
        insert: vi.fn((payload: Record<string, unknown>) => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              insertAttempt += 1;

              if (insertAttempt === 1) {
                expect(payload.stage).toBe("queued");
                return {
                  data: null,
                  error: {
                    code: "42703",
                    message: 'column "stage" does not exist'
                  }
                };
              }

              expect(payload.stage).toBeUndefined();
              return {
                data: {
                  id: "job-1",
                  status: "queued"
                },
                error: null
              };
            })
          }))
        }))
      };
    })
  };
}

describe("import artifacts compatibility", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("retries source artifact inserts without destination_hint when the local schema is behind", async () => {
    const { createImportArtifact } = await import("@/lib/import-artifacts");
    const result = await createImportArtifact({
      supabase: createSourceArtifactsSupabaseMock() as never,
      userId: "user-1",
      payload: {
        type: "url",
        content: "https://www.instagram.com/p/DQoxEeJgbUa/",
        destinationHint: "Hong Kong"
      }
    });

    expect(result.record).toEqual(
      expect.objectContaining({
        id: "artifact-1",
        status: "queued"
      })
    );
    expect(result.error).toBeNull();
  });

  it("retries import job inserts without stage fields on older local schemas", async () => {
    const { createImportJob } = await import("@/lib/import-artifacts");
    const result = await createImportJob({
      supabase: createImportJobsSupabaseMock() as never,
      userId: "user-1",
      artifactId: "artifact-1"
    });

    expect(result).toEqual({
      id: "job-1",
      status: "queued"
    });
  });
});
