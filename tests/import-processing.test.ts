export {};

const mockEnsureProfileForUser = vi.hoisted(() => vi.fn());
const mockUpsertDestination = vi.hoisted(() => vi.fn());
const mockUpsertPlace = vi.hoisted(() => vi.fn());
const mockSearchUnsplashImage = vi.hoisted(() => vi.fn());
const mockGetProviderStatus = vi.hoisted(() => vi.fn());
const mockRecordAuditEvent = vi.hoisted(() => vi.fn());
const mockAppendImportLog = vi.hoisted(() => vi.fn());
const mockRunImportPipeline = vi.hoisted(() => vi.fn());

vi.mock("@/lib/database", async () => {
  const actual = await vi.importActual<typeof import("@/lib/database")>("@/lib/database");
  return {
    ...actual,
    ensureProfileForUser: mockEnsureProfileForUser,
    upsertDestination: mockUpsertDestination,
    upsertPlace: mockUpsertPlace
  };
});

vi.mock("@/lib/providers/unsplash", () => ({
  searchUnsplashImage: mockSearchUnsplashImage
}));

vi.mock("@/lib/provider-status", () => ({
  getProviderStatus: mockGetProviderStatus
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mockRecordAuditEvent
}));

vi.mock("@/lib/import-logger", () => ({
  appendImportLog: mockAppendImportLog
}));

vi.mock("@/lib/import-pipeline", () => ({
  runImportPipeline: mockRunImportPipeline
}));

function createSupabaseMock(options?: {
  artifactError?: { message: string } | null;
}) {
  const updateSpy = vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(async () => ({ data: null, error: null }))
    }))
  }));

  return {
    from: vi.fn((table: string) => {
      if (table === "source_artifacts") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: options?.artifactError
                  ? null
                  : {
                      id: "artifact-1",
                      type: "url",
                      label: "New link import",
                      status: "processing",
                      created_at: "2026-04-20T00:00:00.000Z",
                      extracted_places: 0
                    },
                error: options?.artifactError ?? null
              }))
            }))
          })),
          update: updateSpy
        };
      }

      if (table === "import_jobs") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  id: "job-1",
                  status: "processing"
                },
                error: null
              }))
            }))
          })),
          update: updateSpy
        };
      }

      throw new Error(`Unhandled table ${table}`);
    })
  };
}

function createSuccessfulAnalysis() {
  return {
    candidates: [
      {
        name: "Men-ya Inoichi",
        city: "Kyoto",
        country: "Japan",
        category: "restaurants",
        description: "Recovered from reel evidence.",
        tags: ["ramen"],
        address: "Kyoto, Japan",
        latitude: 35.0,
        longitude: 135.7,
        mapsUrl: "https://www.openstreetmap.org/example"
      }
    ],
    diagnostics: [],
    score: {
      score: 5,
      looksTravelRelated: true,
      positiveSignals: ["travel-venue"],
      negativeSignals: []
    },
    evidencePreview: {
      title: "Kyoto hidden gems"
    },
    stages: {
      metadata: { status: "complete", detail: "ok" },
      ytDlp: { status: "complete", detail: "ok" },
      subtitles: { status: "complete", detail: "ok" },
      download: { status: "complete", detail: "ok" },
      frames: { status: "complete", detail: "ok" },
      ocr: { status: "complete", detail: "ok" },
      transcript: { status: "complete", detail: "ok" },
      geocoding: { status: "complete", detail: "ok" },
      languageNormalization: { status: "skipped", detail: "ok" },
      geminiRefinement: { status: "failed", detail: "quota" }
    }
  };
}

describe("processImportSubmission", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockEnsureProfileForUser.mockResolvedValue(undefined);
    mockUpsertDestination.mockResolvedValue("destination-1");
    mockUpsertPlace.mockResolvedValue({
      id: "place-1",
      name: "Men-ya Inoichi"
    });
    mockSearchUnsplashImage.mockResolvedValue({
      imageUrl: "https://images.example.com/place.jpg"
    });
    mockGetProviderStatus.mockReturnValue({
      gemini: "configured",
      googleMaps: "configured",
      unsplash: "configured",
      supabase: "configured",
      resend: "missing"
    });
    mockRecordAuditEvent.mockResolvedValue(undefined);
    mockAppendImportLog.mockResolvedValue(undefined);
  });

  it("returns a successful import payload when the pipeline finds places", async () => {
    mockRunImportPipeline.mockResolvedValue(createSuccessfulAnalysis());

    const { processImportSubmission } = await import("@/lib/import-processing");
    const result = await processImportSubmission({
      supabase: createSupabaseMock() as never,
      user: {
        id: "user-1"
      },
      payload: {
        type: "url",
        content: "https://www.instagram.com/reel/test123",
        destinationHint: "Kyoto"
      },
      ip: "127.0.0.1"
    });

    expect(result.status).toBe(201);
    expect(result.body.job).toEqual(
      expect.objectContaining({
        extractedPlaces: 1,
        label: "Kyoto hidden gems"
      })
    );
    expect(result.body.analysisPreview).toEqual(
      expect.objectContaining({
        travelScore: 5
      })
    );
    expect(result.body.enrichmentPreview).toEqual(
      expect.objectContaining({
        name: "Men-ya Inoichi"
      })
    );
    expect(mockEnsureProfileForUser).toHaveBeenCalled();
    expect(mockUpsertDestination).toHaveBeenCalled();
    expect(mockUpsertPlace).toHaveBeenCalled();
    expect(mockUpsertPlace).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Men-ya Inoichi",
        imageUrl: "https://images.example.com/place.jpg"
      })
    );
    expect(mockAppendImportLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        artifactId: "artifact-1",
        candidateCount: 1
      })
    );
  });

  it("skips invalid candidates instead of failing the whole import", async () => {
    mockRunImportPipeline.mockResolvedValue({
      ...createSuccessfulAnalysis(),
      candidates: [
        {
          name: "Instagram Hong Kong",
          city: "Hong Kong",
          country: "China",
          category: "activities",
          description: "Noisy candidate from caption parsing.",
          tags: ["hong-kong"]
        },
        {
          name: "Hong Kong Disneyland",
          city: "Hong Kong",
          country: "China",
          category: "activities",
          description: "Theme park destination.",
          tags: ["disneyland"],
          address: "Hong Kong Disneyland Resort",
          latitude: 22.3129,
          longitude: 114.0413,
          mapsUrl: "https://www.openstreetmap.org/example"
        }
      ]
    });
    mockUpsertPlace.mockResolvedValueOnce({
      id: "place-2",
      name: "Hong Kong Disneyland"
    });

    const { processImportSubmission } = await import("@/lib/import-processing");
    const result = await processImportSubmission({
      supabase: createSupabaseMock() as never,
      user: {
        id: "user-1"
      },
      payload: {
        type: "url",
        content: "https://www.instagram.com/p/DLFBmZ2sUCx/",
        destinationHint: ""
      },
      ip: "127.0.0.1"
    });

    expect(result.status).toBe(201);
    expect(result.body.job).toEqual(
      expect.objectContaining({
        extractedPlaces: 1
      })
    );
    expect(result.body.analysisPreview).toEqual(
      expect.objectContaining({
        skippedCandidateNames: ["Instagram Hong Kong"]
      })
    );
    expect(mockUpsertPlace).toHaveBeenCalledTimes(1);
    expect(mockUpsertPlace).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Hong Kong Disneyland"
      })
    );
    expect(mockAppendImportLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        candidateCount: 1,
        persistenceFailures: [
          expect.objectContaining({
            candidateName: "Instagram Hong Kong"
          })
        ]
      })
    );
  });

  it("returns a 422 when the pipeline finds no actionable places", async () => {
    mockRunImportPipeline.mockResolvedValue({
      candidates: [],
      diagnostics: [],
      failureReason: "That import does not look travel-related enough to turn into saved places.",
      score: {
        score: -2,
        looksTravelRelated: false,
        positiveSignals: [],
        negativeSignals: ["non-travel-topic"]
      },
      evidencePreview: {},
      stages: {
        metadata: { status: "failed", detail: "none" },
        ytDlp: { status: "failed", detail: "none" },
        subtitles: { status: "failed", detail: "none" },
        download: { status: "failed", detail: "none" },
        frames: { status: "failed", detail: "none" },
        ocr: { status: "failed", detail: "none" },
        transcript: { status: "failed", detail: "none" },
        geocoding: { status: "skipped", detail: "none" },
        languageNormalization: { status: "skipped", detail: "none" },
        geminiRefinement: { status: "skipped", detail: "none" }
      }
    });

    const { processImportSubmission } = await import("@/lib/import-processing");
    const result = await processImportSubmission({
      supabase: createSupabaseMock() as never,
      user: {
        id: "user-1"
      },
      payload: {
        type: "text",
        content: "GRWM makeup haul, amazon finds, use my code",
        destinationHint: ""
      },
      ip: "127.0.0.1"
    });

    expect(result.status).toBe(422);
    expect(result.body).toEqual({
      error: "That import does not look travel-related enough to turn into saved places."
    });
    expect(mockAppendImportLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failure",
        artifactId: "artifact-1",
        candidateCount: 0
      })
    );
  });

  it("returns 503 and logs the failure when analysis crashes", async () => {
    mockRunImportPipeline.mockRejectedValue(new Error("provider offline"));

    const { processImportSubmission } = await import("@/lib/import-processing");
    const result = await processImportSubmission({
      supabase: createSupabaseMock() as never,
      user: {
        id: "user-1"
      },
      payload: {
        type: "url",
        content: "https://www.instagram.com/reel/test123",
        destinationHint: "Kyoto"
      },
      ip: "127.0.0.1"
    });

    expect(result.status).toBe(503);
    expect(result.body).toEqual({
      error: "Zylo could not analyze that import right now."
    });
    expect(mockAppendImportLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failure",
        message: "Zylo could not analyze that import right now.",
        error: "provider offline"
      })
    );
  });

  it("returns 500 when the source artifact cannot be created", async () => {
    const { processImportSubmission } = await import("@/lib/import-processing");
    const result = await processImportSubmission({
      supabase: createSupabaseMock({
        artifactError: {
          message: "insert failed"
        }
      }) as never,
      user: {
        id: "user-1"
      },
      payload: {
        type: "text",
        content: "Kyoto food guide with Men-ya Inoichi and Kiyomizu-dera.",
        destinationHint: "Kyoto"
      },
      ip: "127.0.0.1"
    });

    expect(result.status).toBe(500);
    expect(result.body).toEqual({
      error: "Unable to create import artifact."
    });
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "api",
        severity: "critical"
      })
    );
    expect(mockRunImportPipeline).not.toHaveBeenCalled();
  });

  it("returns 500 when persisting extracted places fails", async () => {
    mockRunImportPipeline.mockResolvedValue(createSuccessfulAnalysis());
    mockUpsertPlace.mockRejectedValue(new Error("write failed"));

    const { processImportSubmission } = await import("@/lib/import-processing");
    const result = await processImportSubmission({
      supabase: createSupabaseMock() as never,
      user: {
        id: "user-1"
      },
      payload: {
        type: "url",
        content: "https://www.instagram.com/reel/test123",
        destinationHint: "Kyoto"
      },
      ip: "127.0.0.1"
    });

    expect(result.status).toBe(500);
    expect(result.body).toEqual({
      error: "Zylo could not save the extracted places."
    });
    expect(mockAppendImportLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failure",
        candidateCount: 1,
        error: expect.stringContaining("Men-ya Inoichi: write failed"),
        persistenceFailures: [
          expect.objectContaining({
            candidateName: "Men-ya Inoichi",
            error: "write failed"
          })
        ]
      })
    );
  });
});
