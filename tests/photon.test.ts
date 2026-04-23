import { lookupPlaceSummaryPhoton } from "@/lib/providers/photon";

describe("lookupPlaceSummaryPhoton", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("parses Photon results into free place summaries", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          features: [
            {
              properties: {
                name: "Yuen Po Street Bird Garden",
                district: "Mong Kok",
                city: "Hong Kong",
                state: "Hong Kong",
                country: "China",
                osm_key: "amenity",
                osm_value: "marketplace"
              },
              geometry: {
                coordinates: [114.1738, 22.3259]
              }
            }
          ]
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    ) as typeof fetch;

    const summaries = await lookupPlaceSummaryPhoton("Yuen Po Street Bird Market Hong Kong");

    expect(summaries).toEqual([
      expect.objectContaining({
        name: "Yuen Po Street Bird Garden",
        city: "Hong Kong",
        country: "China",
        typeName: "marketplace",
        className: "amenity"
      })
    ]);
  });
});
