export {};

const mockExecFile = vi.hoisted(() => vi.fn());
const mockAccess = vi.hoisted(() => vi.fn());
const mockMkdtemp = vi.hoisted(() => vi.fn());
const mockReaddir = vi.hoisted(() => vi.fn());
const mockReadFile = vi.hoisted(() => vi.fn());
const mockRm = vi.hoisted(() => vi.fn());
const mockYtDlp = vi.hoisted(() => vi.fn());
const mockYtDlpExec = vi.hoisted(() => vi.fn());
const mockFetchUrlMetadata = vi.hoisted(() => vi.fn());
const mockLookupPlaceSummary = vi.hoisted(() => vi.fn());
const mockLookupPlaceSummaryFree = vi.hoisted(() => vi.fn());
const mockReverseLookupPlaceSummaryFree = vi.hoisted(() => vi.fn());
const mockLookupPlaceSummaryPhoton = vi.hoisted(() => vi.fn());
const mockSearchPlaceContextWeb = vi.hoisted(() => vi.fn());
const mockExtractPlacesWithGemini = vi.hoisted(() => vi.fn());
const mockTranslateCandidatesToEnglish = vi.hoisted(() => vi.fn());
const mockCreateWorker = vi.hoisted(() => vi.fn());

vi.mock("node:child_process", async () => {
  const actual = await vi.importActual<typeof import("node:child_process")>("node:child_process");
  return {
    ...actual,
    execFile: mockExecFile
  };
});

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    access: mockAccess,
    mkdtemp: mockMkdtemp,
    readdir: mockReaddir,
    readFile: mockReadFile,
    rm: mockRm
  };
});

vi.mock("yt-dlp-exec", () => ({
  default: mockYtDlp,
  exec: mockYtDlpExec
}));

vi.mock("@/lib/url-metadata", () => ({
  fetchUrlMetadata: mockFetchUrlMetadata
}));

vi.mock("@/lib/providers/google-places", () => ({
  lookupPlaceSummary: mockLookupPlaceSummary
}));

vi.mock("@/lib/providers/nominatim", () => ({
  lookupPlaceSummaryFree: mockLookupPlaceSummaryFree,
  reverseLookupPlaceSummaryFree: mockReverseLookupPlaceSummaryFree
}));

vi.mock("@/lib/providers/photon", () => ({
  lookupPlaceSummaryPhoton: mockLookupPlaceSummaryPhoton
}));

vi.mock("@/lib/providers/web-search", () => ({
  searchPlaceContextWeb: mockSearchPlaceContextWeb
}));

vi.mock("@/lib/providers/gemini", async () => {
  const actual = await vi.importActual<typeof import("@/lib/providers/gemini")>(
    "@/lib/providers/gemini"
  );
  return {
    ...actual,
    extractPlacesWithGemini: mockExtractPlacesWithGemini,
    translateCandidatesToEnglish: mockTranslateCandidatesToEnglish
  };
});

vi.mock("tesseract.js", () => ({
  createWorker: mockCreateWorker
}));

describe("runImportPipeline", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.ZYLO_YTDLP_DISABLE_BROWSER_COOKIES;
    delete process.env.ZYLO_ENABLE_GOLD_SET_DEMO_IMPORTS;

    mockMkdtemp.mockResolvedValue("/tmp/zylo-import");
    mockReaddir.mockResolvedValue([]);
    mockReadFile.mockResolvedValue("");
    mockRm.mockResolvedValue(undefined);
    mockAccess.mockRejectedValue(new Error("missing"));
    mockExecFile.mockImplementation((...args: unknown[]) => {
      const callback = args.at(-1) as ((error: Error | null, stdout?: string, stderr?: string) => void);
      callback(null, "", "");
    });
    mockExtractPlacesWithGemini.mockResolvedValue([]);
    mockTranslateCandidatesToEnglish.mockResolvedValue([]);
    mockLookupPlaceSummary.mockResolvedValue(null);
    mockLookupPlaceSummaryFree.mockResolvedValue(null);
    mockLookupPlaceSummaryPhoton.mockResolvedValue([]);
    mockReverseLookupPlaceSummaryFree.mockResolvedValue(null);
    mockSearchPlaceContextWeb.mockResolvedValue([]);
  });

  it("uses free parsing plus geocoding for text imports", async () => {
    mockLookupPlaceSummaryFree.mockImplementation(async (query: string) => {
      if (query.includes("Men-ya Inoichi")) {
        return {
          name: "Men-ya Inoichi",
          city: "Kyoto",
          country: "Japan",
          formattedAddress: "Men-ya Inoichi, Kyoto, Japan",
          location: {
            latitude: 35.0,
            longitude: 135.7
          },
          mapsUrl: "https://www.openstreetmap.org/example",
          typeName: "restaurant"
        };
      }

      return null;
    });

    const { runImportPipeline } = await import("@/lib/import-pipeline");
    const result = await runImportPipeline({
      type: "text",
      content: "Kyoto food guide: Men-ya Inoichi for ramen and Kiyomizu-dera at sunset.",
      destinationHint: "Kyoto"
    });

    expect(result.score.looksTravelRelated).toBe(true);
    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        name: "Men-ya Inoichi",
        city: "Kyoto",
        country: "Japan",
        verificationSource: "nominatim"
      })
    );
    expect(result.stages.metadata.status).toBe("complete");
    expect(result.stages.geminiRefinement.status).toBe("complete");
    expect(result.stages.geocoding.status).toBe("complete");
    expect(result.stages.languageNormalization.status).toBe("skipped");
  });

  it("exposes the local whisper helper paths", async () => {
    const { getWhisperScriptPath, resolveWhisperPythonPath } = await import(
      "@/lib/import-pipeline"
    );

    expect(await resolveWhisperPythonPath()).toContain(".venv/bin/python");
    expect(getWhisperScriptPath()).toContain("scripts/transcribe_audio.py");
  });

  it("classifies blocked social-link failures from resolveImportFailureReason", async () => {
    const { resolveImportFailureReason } = await import("@/lib/import-pipeline");

    expect(
      resolveImportFailureReason({
        combinedText: "Instagram",
        diagnostics: [
          "yt-dlp metadata failed: Command failed: /path/to/yt-dlp https://www.instagram.com/p/DLFBmZ2sUCx/ --dump-single-json ERROR: [Instagram]"
        ],
        looksTravelRelated: false,
        normalizedCandidateCount: 0,
        sourceUrl: "https://www.instagram.com/p/DLFBmZ2sUCx/"
      })
    ).toBe(
      "Instagram blocked link extraction on this machine. Zylo needs auth cookies (browser session or exported cookie file) or pasted transcript text for this reel."
    );
  });

  it("uses a TikTok-specific blocked-link message when TikTok extraction is access-limited", async () => {
    const { resolveImportFailureReason } = await import("@/lib/import-pipeline");

    expect(
      resolveImportFailureReason({
        combinedText: "TikTok",
        diagnostics: [
          "yt-dlp metadata failed: Command failed: /path/to/yt-dlp https://www.tiktok.com/@demo/video/123 ERROR: [TikTok] login required"
        ],
        looksTravelRelated: false,
        normalizedCandidateCount: 0,
        sourceUrl: "https://www.tiktok.com/@demo/video/123"
      })
    ).toBe(
      "TikTok blocked link extraction on this machine. Zylo needs auth cookies (browser session or exported cookie file) or pasted transcript text for this reel."
    );
  });

  it("scores chinese reel descriptions as travel evidence without needing english metadata", async () => {
    const { extractRuleBasedPlaceSeeds, scoreTravelEvidence } = await import(
      "@/lib/import-analysis"
    );

    const description = `高雄最新！全台唯一的海上遊艇超跑！竟然有跟杜拜一樣的海上超跑，太特別啦😍
下次來高雄又有新的行程可以安排了！！！
去之前一定要先預約！
📍高雄。艇萌玩家
集合地點：高雄市苓雅區海邊路31號
#高雄景點 #高雄旅遊 #高雄旅行`;

    const score = scoreTravelEvidence({
      text: description,
      destinationHint: ""
    });
    const seeds = extractRuleBasedPlaceSeeds({
      text: description,
      destinationHint: "",
      maxSeeds: 8
    });

    expect(score.looksTravelRelated).toBe(true);
    expect(score.score).toBeGreaterThanOrEqual(2);
    expect(seeds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "艇萌玩家"
        })
      ])
    );
  });


  it("falls back to Google Places when free geocoding misses a candidate", async () => {
    mockLookupPlaceSummaryFree.mockResolvedValue(null);
    mockExtractPlacesWithGemini.mockResolvedValue([
      {
        name: "Fuglen Tokyo",
        city: "Tokyo",
        country: "Japan",
        category: "cafes",
        description: "Coffee stop in Shibuya.",
        tags: ["coffee"]
      }
    ]);
    mockLookupPlaceSummary.mockImplementation(async (query: string) => {
      if (!query.includes("Fuglen Tokyo")) {
        return null;
      }

      return {
        formattedAddress: "Fuglen Tokyo, Shibuya City, Tokyo, Japan",
        location: {
          latitude: 35.6595,
          longitude: 139.6995
        },
        googleMapsUri: "https://maps.google.com/?cid=fuglen"
      };
    });

    const { runImportPipeline } = await import("@/lib/import-pipeline");
    const result = await runImportPipeline({
      type: "text",
      content: "Tokyo coffee guide: Fuglen Tokyo for espresso before the museum run.",
      destinationHint: "Tokyo"
    });

    expect(result.candidates).toContainEqual(
      expect.objectContaining({
        name: "Fuglen Tokyo",
        verificationSource: "google",
        address: "Fuglen Tokyo, Shibuya City, Tokyo, Japan"
      })
    );
    expect(mockLookupPlaceSummary).toHaveBeenCalled();
  });

  it("keeps high-signal roundup destinations when the evidence is a structured travel list", async () => {
    mockLookupPlaceSummaryFree.mockImplementation(async (query: string) => {
      if (query.includes("Rome")) {
        return {
          name: "Rome",
          city: "Rome",
          country: "Italy",
          formattedAddress: "Rome, Metropolitan City of Rome Capital, Italy",
          location: { latitude: 41.9028, longitude: 12.4964 },
          mapsUrl: "https://www.openstreetmap.org/rome",
          typeName: "city"
        };
      }

      if (query.includes("Venice")) {
        return {
          name: "Venice",
          city: "Venice",
          country: "Italy",
          formattedAddress: "Venice, Metropolitan City of Venice, Italy",
          location: { latitude: 45.4408, longitude: 12.3155 },
          mapsUrl: "https://www.openstreetmap.org/venice",
          typeName: "city"
        };
      }

      return null;
    });

    const { runImportPipeline } = await import("@/lib/import-pipeline");
    const result = await runImportPipeline({
      type: "text",
      content: `1. (Photo Spots, Activities); Amalfi Coast
2. (Activities); Rome
3. (Activities, Photo Spots); Venice`,
      destinationHint: "Italy"
    });

    expect(result.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Rome",
          city: "Rome",
          country: "Italy",
          verificationSource: "nominatim"
        }),
        expect.objectContaining({
          name: "Venice",
          city: "Venice",
          country: "Italy",
          verificationSource: "nominatim"
        })
      ])
    );
  });

  it("returns a concrete failure reason when travel hints cannot be verified", async () => {
    mockLookupPlaceSummaryFree.mockResolvedValue(null);
    mockLookupPlaceSummary.mockResolvedValue(null);

    const { runImportPipeline } = await import("@/lib/import-pipeline");
    const result = await runImportPipeline({
      type: "text",
      content: "Kyoto travel guide: Kichi Kichi Omurice for dinner and Philosopher's Path at sunrise.",
      destinationHint: "Kyoto"
    });

    expect(result.score.looksTravelRelated).toBe(true);
    expect(result.candidates).toEqual([]);
    expect(result.failureReason).toBe("Zylo found hints, but could not verify concrete visitable places.");
    expect(result.stages.geocoding.status).toBe("failed");
  });

  it(
    "fails closed on auth-blocked instagram links when only thin metadata is available",
    async () => {
      process.env.ZYLO_YTDLP_DISABLE_BROWSER_COOKIES = "1";
      mockFetchUrlMetadata.mockResolvedValue({
        title: "Shenzhen hidden stone wall",
        description: "Quick reel teaser",
        pageText: null,
        rawText: "Shenzhen hidden stone wall"
      });
      mockLookupPlaceSummaryFree.mockImplementation(async (query: string) => {
        if (!query.includes("Shenzhen")) {
          return null;
        }

        return {
          name: "Shenzhen",
          city: "Shenzhen",
          country: "China",
          formattedAddress: "Shenzhen, Guangdong, China",
          location: {
            latitude: 22.5431,
            longitude: 114.0579
          },
          mapsUrl: "https://www.openstreetmap.org/shenzhen",
          typeName: "city"
        };
      });
      mockExecFile.mockImplementation((...args: unknown[]) => {
        const callback = args.at(-1) as ((error: Error | null, stdout?: string, stderr?: string) => void);
        const commandError = Object.assign(new Error("login required"), {
          stderr:
            "ERROR: [Instagram] Requested content is not available, rate-limit reached or login required. Use --cookies-from-browser"
        });
        callback(commandError);
      });

      const { runImportPipeline } = await import("@/lib/import-pipeline");
      const result = await runImportPipeline({
        type: "url",
        content: "https://www.instagram.com/p/DQRR-UjCWlw/",
        destinationHint: "Shenzhen"
      });

      expect(result.candidates).toEqual([]);
      expect(result.failureReason).toBe(
        "Instagram blocked link extraction on this machine. Zylo needs auth cookies (browser session or exported cookie file) or pasted transcript text for this reel."
      );
      expect(result.stages.geocoding).toEqual({
        status: "failed",
        detail:
          "Skipped candidate verification because the social link was auth-blocked and only thin metadata was recovered."
      });
    },
    15_000
  );

  it(
    "uses curated demo candidates for known gold-set links when demo fallback is enabled",
    async () => {
      process.env.ZYLO_YTDLP_DISABLE_BROWSER_COOKIES = "1";
      process.env.ZYLO_ENABLE_GOLD_SET_DEMO_IMPORTS = "1";
      mockFetchUrlMetadata.mockResolvedValue({
        title: "Hong Kong seafood reel",
        description: "Quick teaser",
        pageText: null,
        rawText: "Hong Kong seafood reel"
      });
      mockExecFile.mockImplementation((...args: unknown[]) => {
        const callback = args.at(-1) as ((error: Error | null, stdout?: string, stderr?: string) => void);
        const commandError = Object.assign(new Error("login required"), {
          stderr:
            "ERROR: [Instagram] Requested content is not available, rate-limit reached or login required. Use --cookies-from-browser"
        });
        callback(commandError);
      });

      const { runImportPipeline } = await import("@/lib/import-pipeline");
      const result = await runImportPipeline({
        type: "url",
        content: "https://www.instagram.com/p/DQoxEeJgbUa/",
        destinationHint: "Hong Kong"
      });

      expect(result.candidates).toEqual([
        expect.objectContaining({
          name: "Crab Master 8",
          city: "Hong Kong",
          country: "China",
          category: "restaurants",
          verificationSource: "context"
        })
      ]);
      expect(result.failureReason).toBeUndefined();
      expect(result.diagnostics).toEqual(
        expect.arrayContaining([
          expect.stringContaining("demo fallback: matched curated gold-set link")
        ])
      );
      expect(result.stages.geocoding).toEqual({
        status: "complete",
        detail: "Loaded 1 curated demo place(s) for this known gold-set link."
      });
    },
    15_000
  );

  it("does not let an optional destination hint fabricate a generic place candidate", async () => {
    mockLookupPlaceSummaryFree.mockResolvedValue(null);
    mockLookupPlaceSummary.mockResolvedValue(null);

    const { runImportPipeline } = await import("@/lib/import-pipeline");
    const result = await runImportPipeline({
      type: "text",
      content: "Instagram",
      destinationHint: "Hong Kong"
    });

    expect(result.score.looksTravelRelated).toBe(false);
    expect(result.score.score).toBe(0);
    expect(result.candidates).toEqual([]);
    expect(result.failureReason).toBe(
      "That import does not look travel-related enough to turn into saved places."
    );
  });

  it(
    "uses extracted article body text for blog URL imports instead of only thin metadata",
    async () => {
      mockFetchUrlMetadata.mockResolvedValue({
        title: "24 Hours in Hong Kong",
        description: "A sample day around the city.",
      pageText: [
        "Start your morning at the Goldfish Market before heading to the Yuen Po Street Bird Market.",
        "Then visit the famous Man‑Mo Temple, ride the Peak Tram to Victoria Peak, and end the day at Temple Street Night Market."
      ].join("\n\n"),
      rawText: "24 Hours in Hong Kong"
    });
    mockLookupPlaceSummaryFree.mockImplementation(async (query: string) => {
      if (query.includes("Goldfish Market")) {
        return {
          name: "Goldfish Market",
          city: "Hong Kong",
          country: "China",
          formattedAddress: "Goldfish Market, Tung Choi Street, Hong Kong",
          location: { latitude: 22.3193, longitude: 114.1694 },
          mapsUrl: "https://www.openstreetmap.org/goldfish-market",
          typeName: "market"
        };
      }

      if (query.includes("Man-Mo Temple")) {
        return {
          name: "Man Mo Temple",
          city: "Hong Kong",
          country: "China",
          formattedAddress: "Man Mo Temple, Hollywood Road, Hong Kong",
          location: { latitude: 22.2839, longitude: 114.1501 },
          mapsUrl: "https://www.openstreetmap.org/man-mo-temple",
          typeName: "temple"
        };
      }

      if (query.includes("Victoria Peak")) {
        return {
          name: "Victoria Peak",
          city: "Hong Kong",
          country: "China",
          formattedAddress: "Victoria Peak, Hong Kong",
          location: { latitude: 22.2759, longitude: 114.1455 },
          mapsUrl: "https://www.openstreetmap.org/victoria-peak",
          typeName: "viewpoint"
        };
      }

      return null;
    });

    const { runImportPipeline } = await import("@/lib/import-pipeline");
    const result = await runImportPipeline({
      type: "url",
      content: "https://travelersitch.com/24-hours-in-hong-kong/",
      destinationHint: "Hong Kong"
    });

    expect(result.score.looksTravelRelated).toBe(true);
    expect(result.evidencePreview.pageText).toContain("Goldfish Market");
    expect(result.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Goldfish Market" }),
        expect.objectContaining({ name: "Man-Mo Temple" }),
        expect.objectContaining({ name: "Victoria Peak" })
      ])
    );
    },
    20_000
  );

  it("normalizes chinese verified places into english-facing candidates", async () => {
    mockLookupPlaceSummaryFree.mockResolvedValue({
      name: "富锦树台菜香槟",
      city: "台北",
      country: "台湾",
      formattedAddress: "Taipei, Taiwan",
      location: {
        latitude: 25.0,
        longitude: 121.5
      },
      mapsUrl: "https://www.openstreetmap.org/example",
      typeName: "restaurant"
    });
    mockExtractPlacesWithGemini.mockResolvedValue([
      {
        name: "富锦树台菜香槟",
        city: "台北",
        country: "台湾",
        category: "restaurants",
        description: "台菜餐厅",
        tags: ["台菜", "餐厅"]
      }
    ]);
    mockTranslateCandidatesToEnglish.mockResolvedValue([
      {
        index: 0,
        name: "Fujin Tree Taiwanese Cuisine & Champagne",
        city: "Taipei",
        country: "Taiwan",
        category: "restaurants",
        description: "Taiwanese restaurant in Taipei.",
        tags: ["taiwanese food", "restaurant"]
      }
    ]);

    const { runImportPipeline } = await import("@/lib/import-pipeline");
    const result = await runImportPipeline({
      type: "text",
      content: "台北美食攻略：富锦树台菜香槟很值得去。",
      destinationHint: "台北"
    });

    expect(result.score.looksTravelRelated).toBe(true);
    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        name: "Fujin Tree Taiwanese Cuisine & Champagne",
        city: "Taipei",
        country: "Taiwan",
        description: expect.stringContaining("Original Chinese name: 富锦树台菜香槟.")
      })
    );
    expect(result.stages.languageNormalization.status).toBe("complete");
  });
});
