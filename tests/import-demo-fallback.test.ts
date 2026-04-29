export {};

describe("import demo fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.ZYLO_ENABLE_GOLD_SET_DEMO_IMPORTS;
  });

  it("maps known gold-set links into curated demo candidates when enabled", async () => {
    process.env.ZYLO_ENABLE_GOLD_SET_DEMO_IMPORTS = "1";

    const { buildGoldSetDemoCandidates } = await import("@/lib/import-demo-fallback");
    const candidates = buildGoldSetDemoCandidates("https://www.instagram.com/p/DQoxEeJgbUa/");

    expect(candidates).toEqual([
      expect.objectContaining({
        name: "Crab Master 8",
        city: "Hong Kong",
        country: "China",
        category: "restaurants",
        verificationSource: "context",
        tags: expect.arrayContaining(["demo-import", "gold-set"])
      })
    ]);
  });

  it("returns no demo candidates when the flag is disabled", async () => {
    const { buildGoldSetDemoCandidates } = await import("@/lib/import-demo-fallback");
    expect(buildGoldSetDemoCandidates("https://www.instagram.com/p/DQoxEeJgbUa/")).toEqual([]);
  });
});
