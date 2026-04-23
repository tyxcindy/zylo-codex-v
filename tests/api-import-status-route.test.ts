export {};

const mockRequireApiUser = vi.hoisted(() => vi.fn());
const mockResumeQueuedImportSubmission = vi.hoisted(() => vi.fn());
const mockGetClientIp = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireApiUser: mockRequireApiUser
}));

vi.mock("@/lib/import-processing", () => ({
  isImportJobStale: (updatedAt: string | null | undefined) => {
    if (!updatedAt) {
      return false;
    }

    const updatedAtMs = Date.parse(updatedAt);
    if (Number.isNaN(updatedAtMs)) {
      return false;
    }

    return Date.now() - updatedAtMs > 2 * 60_000;
  },
  resumeQueuedImportSubmission: mockResumeQueuedImportSubmission
}));

vi.mock("@/lib/request", () => ({
  getClientIp: mockGetClientIp
}));

function createSupabaseMock(options?: {
  initialArtifactStatus?: "queued" | "processing";
  initialImportJobStatus?: "queued" | "processing";
  initialUpdatedAt?: string;
}) {
  let artifactReadCount = 0;
  let importJobReadCount = 0;

  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => {
              if (table === "source_artifacts") {
                artifactReadCount += 1;
                return {
                  data:
                    artifactReadCount === 1
                      ? {
                          id: "artifact-1",
                          type: "url",
                          label: "Queued import",
                          status: options?.initialArtifactStatus ?? "queued",
                          created_at: "2026-04-22T00:00:00.000Z",
                          extracted_places: 0
                        }
                      : {
                          id: "artifact-1",
                          type: "url",
                          label: "Queued import",
                          status: "complete",
                          created_at: "2026-04-22T00:00:00.000Z",
                          extracted_places: 2
                        },
                  error: null
                };
              }

              if (table === "import_jobs") {
                importJobReadCount += 1;
                return {
                  data:
                    importJobReadCount === 1
                      ? {
                          id: "job-1",
                          status: options?.initialImportJobStatus ?? "queued",
                          stage:
                            options?.initialImportJobStatus === "processing"
                              ? "extracting"
                              : "queued",
                          stage_detail:
                            options?.initialImportJobStatus === "processing"
                              ? "Recovering transcript, subtitles, OCR, and metadata."
                              : "Queued for background processing.",
                          error_message: null,
                          created_at: "2026-04-22T00:00:00.000Z",
                          updated_at: options?.initialUpdatedAt ?? "2026-04-22T00:00:00.000Z",
                          started_at:
                            options?.initialImportJobStatus === "processing"
                              ? "2026-04-22T00:00:01.000Z"
                              : null,
                          finished_at: null,
                          analysis_preview: {}
                        }
                      : {
                          id: "job-1",
                          status: "complete",
                          stage: "complete",
                          stage_detail: "Saved 2 verified place(s).",
                          error_message: null,
                          created_at: "2026-04-22T00:00:00.000Z",
                          updated_at: "2026-04-22T00:00:10.000Z",
                          started_at: "2026-04-22T00:00:01.000Z",
                          finished_at: "2026-04-22T00:00:10.000Z",
                          analysis_preview: {
                            travelScore: 5
                          }
                        },
                  error: null
                };
              }

              throw new Error(`Unhandled table ${table}`);
            })
          }))
        }))
      }))
    }))
  };
}

describe("GET /api/imports/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockGetClientIp.mockReturnValue("127.0.0.1");
  });

  it("resumes queued imports when the client polls their status", async () => {
    const supabase = createSupabaseMock();
    mockRequireApiUser.mockResolvedValue({
      supabase,
      user: {
        id: "user-1"
      }
    });
    mockResumeQueuedImportSubmission.mockResolvedValue(true);

    const { GET } = await import("@/app/api/imports/[id]/route");
    const response = await GET(new Request("http://localhost/api/imports/artifact-1") as any, {
      params: Promise.resolve({ id: "artifact-1" })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      job: {
        id: "artifact-1",
        type: "url",
        label: "Queued import",
        status: "complete",
        createdAt: "2026-04-22T00:00:00.000Z",
        extractedPlaces: 2
      },
      importJob: {
        id: "job-1",
        status: "complete",
        stage: "complete",
        stageDetail: "Saved 2 verified place(s).",
        errorMessage: null,
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T00:00:10.000Z",
        startedAt: "2026-04-22T00:00:01.000Z",
        finishedAt: "2026-04-22T00:00:10.000Z"
      },
      analysisPreview: {
        travelScore: 5
      }
    });
    expect(mockResumeQueuedImportSubmission).toHaveBeenCalledWith({
      supabase,
      user: {
        id: "user-1"
      },
      artifactId: "artifact-1",
      ip: "127.0.0.1"
    });
  });

  it("resumes stale processing imports instead of leaving them stuck forever", async () => {
    const supabase = createSupabaseMock({
      initialArtifactStatus: "processing",
      initialImportJobStatus: "processing",
      initialUpdatedAt: "2026-04-22T00:00:00.000Z"
    });
    mockRequireApiUser.mockResolvedValue({
      supabase,
      user: {
        id: "user-1"
      }
    });
    mockResumeQueuedImportSubmission.mockResolvedValue(true);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T00:05:00.000Z"));

    try {
      const { GET } = await import("@/app/api/imports/[id]/route");
      const response = await GET(new Request("http://localhost/api/imports/artifact-1") as any, {
        params: Promise.resolve({ id: "artifact-1" })
      });

      expect(response.status).toBe(200);
      expect(mockResumeQueuedImportSubmission).toHaveBeenCalledWith({
        supabase,
        user: {
          id: "user-1"
        },
        artifactId: "artifact-1",
        ip: "127.0.0.1"
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
