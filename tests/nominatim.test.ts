describe("lookupPlaceSummaryFree", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("maps a Nominatim hit into Zylo's free place summary shape", async () => {
    vi.resetModules();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          name: "Men-ya Inoichi",
          display_name: "Men-ya Inoichi, Kyoto, Kyoto Prefecture, Japan",
          lat: "35.001",
          lon: "135.768",
          class: "amenity",
          type: "restaurant",
          address: {
            city: "Kyoto",
            country: "Japan"
          }
        }
      ]
    } as Response);

    const { lookupPlaceSummaryFree } = await import("@/lib/providers/nominatim");
    const result = await lookupPlaceSummaryFree("Men-ya Inoichi, Kyoto");

    expect(result).toEqual(
      expect.objectContaining({
        name: "Men-ya Inoichi",
        city: "Kyoto",
        country: "Japan",
        className: "amenity",
        typeName: "restaurant"
      })
    );
  });

  it("returns null when Nominatim does not provide a usable city/country result", async () => {
    vi.resetModules();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: "Somewhere",
          lat: "12.3",
          lon: "45.6",
          address: {}
        }
      ]
    } as Response);

    const { lookupPlaceSummaryFree } = await import("@/lib/providers/nominatim");
    await expect(lookupPlaceSummaryFree("Somewhere")).resolves.toBeNull();
  });
});
