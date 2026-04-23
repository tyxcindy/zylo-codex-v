export {};

const mockRunImportPipeline = vi.hoisted(() => vi.fn());

vi.mock("@/lib/import-pipeline", () => ({
  runImportPipeline: mockRunImportPipeline
}));

describe("import benchmark runner", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("evaluates pipeline output against a benchmark fixture", async () => {
    mockRunImportPipeline.mockResolvedValue({
      candidates: [
        {
          name: "Men-ya Inoichi",
          category: "restaurants"
        }
      ],
      diagnostics: ["subtitles recovered"],
      failureReason: undefined,
      stages: {},
      score: {
        score: 6,
        looksTravelRelated: true,
        positiveSignals: ["travel-venue"],
        negativeSignals: []
      },
      evidencePreview: {}
    });

    const { runImportBenchmarkFixture } = await import("@/lib/import-benchmark-runner");
    const result = await runImportBenchmarkFixture({
      id: "fixture-1",
      sourceUrl: "https://www.instagram.com/reel/demo",
      destinationHint: "Kyoto",
      expectedPlaces: [
        {
          name: "Men-ya Inoichi",
          acceptableCategories: ["restaurants"]
        }
      ]
    });

    expect(result).toEqual(
      expect.objectContaining({
        fixtureId: "fixture-1",
        candidateCount: 1,
        matchedExpectedNames: ["Men-ya Inoichi"],
        missingExpectedNames: [],
        unexpectedCandidateNames: [],
        success: true,
        travelScore: 6,
        looksTravelRelated: true
      })
    );
    expect(mockRunImportPipeline).toHaveBeenCalledWith({
      type: "url",
      content: "https://www.instagram.com/reel/demo",
      destinationHint: "Kyoto"
    });
  });

  it("summarizes strict recall, precision, and pass rate across runs", async () => {
    const { summarizeImportBenchmarkRuns } = await import("@/lib/import-benchmark-runner");
    const summary = summarizeImportBenchmarkRuns([
      {
        fixtureId: "fixture-1",
        sourceUrl: "https://example.com/1",
        destinationHint: "Kyoto",
        candidateCount: 2,
        matchedExpectedNames: ["Men-ya Inoichi", "Kiyomizu-dera"],
        missingExpectedNames: [],
        unexpectedCandidateNames: [],
        categoryMismatches: [],
        success: true,
        failureReason: null,
        pipelineError: null,
        diagnostics: [],
        travelScore: 6,
        looksTravelRelated: true,
        elapsedMs: 100
      },
      {
        fixtureId: "fixture-2",
        sourceUrl: "https://example.com/2",
        destinationHint: "Osaka",
        candidateCount: 2,
        matchedExpectedNames: ["Dotonbori"],
        missingExpectedNames: ["Osaka Castle"],
        unexpectedCandidateNames: ["Instagram Osaka"],
        categoryMismatches: [
          {
            expectedName: "Dotonbori",
            candidateName: "Dotonbori",
            actualCategory: "restaurants",
            acceptableCategories: ["activities"]
          }
        ],
        success: false,
        failureReason: "Instagram blocked link extraction on this machine.",
        pipelineError: null,
        diagnostics: [],
        travelScore: 2,
        looksTravelRelated: true,
        elapsedMs: 120
      }
    ]);

    expect(summary).toEqual({
      fixturesRun: 2,
      fixturesPassed: 1,
      expectedPlaceCount: 4,
      matchedExpectedCount: 3,
      missingExpectedCount: 1,
      unexpectedCandidateCount: 1,
      categoryMismatchCount: 1,
      candidateCount: 4,
      recall: 0.75,
      strictPrecision: 0.6,
      strictFixturePassRate: 0.5,
      blockedSourceCount: 1,
      pipelineCrashCount: 0
    });
  });
});
