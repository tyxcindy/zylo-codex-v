export {};

const mockCreateAdminClient = vi.hoisted(() => vi.fn());
const mockResumeQueuedImportSubmission = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient
}));

vi.mock("@/lib/import-processing", async () => {
  const actual = await vi.importActual<typeof import("@/lib/import-processing")>(
    "@/lib/import-processing"
  );

  return {
    ...actual,
    resumeQueuedImportSubmission: mockResumeQueuedImportSubmission
  };
});

function createSupabaseMock(jobs: Array<Record<string, unknown>>) {
  return {
    from: vi.fn((table: string) => {
      if (table !== "import_jobs") {
        throw new Error(`Unhandled table ${table}`);
      }

      return {
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(async () => ({
                data: jobs,
                error: null
              }))
            }))
          }))
        }))
      };
    })
  };
}

describe("import sweeper", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("resumes queued and stale processing jobs while skipping fresh processing jobs", async () => {
    const supabase = createSupabaseMock([
      {
        id: "job-1",
        user_id: "user-1",
        source_artifact_id: "artifact-1",
        status: "queued",
        updated_at: "2026-04-22T00:00:00.000Z"
      },
      {
        id: "job-2",
        user_id: "user-2",
        source_artifact_id: "artifact-2",
        status: "processing",
        updated_at: "2026-04-22T00:00:00.000Z"
      },
      {
        id: "job-3",
        user_id: "user-3",
        source_artifact_id: "artifact-3",
        status: "processing",
        updated_at: "2026-04-22T00:04:30.000Z"
      }
    ]);

    mockResumeQueuedImportSubmission.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T00:05:00.000Z"));

    try {
      const { resumePendingImportSubmissions } = await import("@/lib/import-sweeper");
      const result = await resumePendingImportSubmissions({
        supabase: supabase as never,
        limit: 10,
        ip: "cron-sweep"
      });

      expect(result).toEqual({
        inspected: 3,
        eligible: 2,
        resumed: 1,
        skippedFresh: 1,
        skippedNotResumable: 1,
        failed: 0,
        missingAdminClient: false,
        errors: []
      });
      expect(mockResumeQueuedImportSubmission).toHaveBeenNthCalledWith(1, {
        supabase,
        user: {
          id: "user-1"
        },
        artifactId: "artifact-1",
        ip: "cron-sweep"
      });
      expect(mockResumeQueuedImportSubmission).toHaveBeenNthCalledWith(2, {
        supabase,
        user: {
          id: "user-2"
        },
        artifactId: "artifact-2",
        ip: "cron-sweep"
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("reports missing admin credentials instead of throwing when no admin client is configured", async () => {
    mockCreateAdminClient.mockReturnValue(null);

    const { resumePendingImportSubmissions } = await import("@/lib/import-sweeper");
    const result = await resumePendingImportSubmissions();

    expect(result).toEqual({
      inspected: 0,
      eligible: 0,
      resumed: 0,
      skippedFresh: 0,
      skippedNotResumable: 0,
      failed: 0,
      missingAdminClient: true,
      errors: []
    });
    expect(mockResumeQueuedImportSubmission).not.toHaveBeenCalled();
  });
});
