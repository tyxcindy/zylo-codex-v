export {};

const mockLookupPlaceSummary = vi.hoisted(() => vi.fn());
const mockLookupPlaceSummaryFree = vi.hoisted(() => vi.fn());
const mockReverseLookupPlaceSummaryFree = vi.hoisted(() => vi.fn());
const mockLookupPlaceSummaryPhoton = vi.hoisted(() => vi.fn());
const mockSearchPlaceContextWeb = vi.hoisted(() => vi.fn());
const mockExtractPlacesWithGemini = vi.hoisted(() => vi.fn());

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
    extractPlacesWithGemini: mockExtractPlacesWithGemini
  };
});

describe("verifyCandidates", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockLookupPlaceSummary.mockResolvedValue(null);
    mockLookupPlaceSummaryPhoton.mockResolvedValue([]);
    mockLookupPlaceSummaryFree.mockResolvedValue(null);
    mockReverseLookupPlaceSummaryFree.mockResolvedValue(null);
    mockSearchPlaceContextWeb.mockResolvedValue([]);
    mockExtractPlacesWithGemini.mockResolvedValue([]);
  });

  it("rejects junk candidates that geocode to unrelated destinations", async () => {
    mockLookupPlaceSummaryFree.mockResolvedValue({
      name: "Explore 24",
      city: "Bordeaux",
      country: "France",
      formattedAddress: "Explore 24, Bordeaux, France",
      location: {
        latitude: 44.8378,
        longitude: -0.5792
      },
      mapsUrl: "https://www.openstreetmap.org/example",
      typeName: "attraction"
    });

    const { verifyCandidates } = await import("@/lib/import-pipeline-candidates");
    const candidates = await verifyCandidates([
      {
        name: "Explore 24",
        city: "",
        country: "",
        category: "activities",
        description: "Recovered from saved reel evidence.",
        tags: ["explore"]
      }
    ]);

    expect(candidates).toEqual([]);
  });

  it("keeps concrete candidates whose geocoded result matches the extracted place", async () => {
    mockLookupPlaceSummaryFree.mockResolvedValue({
      name: "Victoria Peak",
      city: "Hong Kong",
      country: "China",
      formattedAddress: "Victoria Peak, Hong Kong, China",
      location: {
        latitude: 22.2759,
        longitude: 114.1455
      },
      mapsUrl: "https://www.openstreetmap.org/example",
      typeName: "viewpoint"
    });

    const { verifyCandidates } = await import("@/lib/import-pipeline-candidates");
    const candidates = await verifyCandidates([
      {
        name: "Victoria Peak",
        city: "",
        country: "",
        category: "scenic spots",
        description: "Recovered from saved reel evidence.",
        tags: ["peak"]
      }
    ]);

    expect(candidates).toEqual([
      expect.objectContaining({
        name: "Victoria Peak",
        city: "Hong Kong",
        country: "China",
        verificationSource: "nominatim"
      })
    ]);
  });

  it("uses Photon as a second free verifier when Nominatim misses a matching place", async () => {
    mockLookupPlaceSummaryPhoton.mockResolvedValue([
      {
        name: "Meilin Mountain Country Park",
        city: "Shenzhen",
        country: "China",
        formattedAddress: "Meilin Mountain Country Park, Futian, Shenzhen, China",
        location: {
          latitude: 22.5749,
          longitude: 114.0088
        },
        mapsUrl: "https://www.openstreetmap.org/example",
        typeName: "national_park",
        className: "boundary"
      }
    ]);

    const { verifyCandidates } = await import("@/lib/import-pipeline-candidates");
    const candidates = await verifyCandidates([
      {
        name: "Meilin Mountain Park 梅林山公园",
        city: "",
        country: "",
        category: "activities",
        description: "Recovered from pinned travel evidence.",
        tags: ["shenzhen"],
        queryHint: "Futian, Shenzhen"
      }
    ]);

    expect(candidates).toEqual([
      expect.objectContaining({
        name: "Meilin Mountain Country Park",
        city: "Shenzhen",
        country: "China",
        verificationSource: "photon",
        category: "scenic spots"
      })
    ]);
  });

  it("fills city and country from reverse geocoding when the Google fallback is the only verifier", async () => {
    mockLookupPlaceSummary.mockResolvedValue({
      displayName: { text: "Fujin Tree Taiwanese Cuisine & Champagne" },
      formattedAddress: "Fujin Tree Taiwanese Cuisine & Champagne, Taipei, Taiwan",
      location: {
        latitude: 25.0419,
        longitude: 121.5573
      },
      googleMapsUri: "https://maps.google.com/?cid=fujin"
    });
    mockReverseLookupPlaceSummaryFree.mockResolvedValue({
      name: "Fujin Tree Taiwanese Cuisine & Champagne",
      city: "Taipei",
      country: "Taiwan",
      district: "Songshan",
      region: "Taipei",
      formattedAddress: "Taipei, Taiwan",
      location: {
        latitude: 25.0419,
        longitude: 121.5573
      },
      mapsUrl: "https://www.openstreetmap.org/example"
    });

    const { verifyCandidates } = await import("@/lib/import-pipeline-candidates");
    const candidates = await verifyCandidates([
      {
        name: "富锦树台菜香槟",
        city: "",
        country: "",
        category: "restaurants",
        description: "台菜餐厅",
        tags: ["taipei"]
      }
    ]);

    expect(candidates).toEqual([
      expect.objectContaining({
        city: "Taipei",
        country: "Taiwan",
        verificationSource: "google"
      })
    ]);
  });

  it("keeps pinned bilingual place candidates when locality context is strong but geocoders miss them", async () => {
    mockLookupPlaceSummaryFree.mockImplementation(async (query: string) => {
      if (query.includes("Shenzhen")) {
        return {
          name: "Shenzhen",
          city: "Shenzhen",
          country: "China",
          formattedAddress: "Shenzhen, Guangdong, China",
          location: {
            latitude: 22.5431,
            longitude: 114.0579
          },
          mapsUrl: "https://www.openstreetmap.org/example",
          typeName: "city"
        };
      }

      return null;
    });

    const { verifyCandidates } = await import("@/lib/import-pipeline-candidates");
    const candidates = await verifyCandidates([
      {
        name: "Baimei Stone 白眉石",
        city: "",
        country: "",
        category: "photo spots",
        description: "Recovered from pinned travel evidence: 📍Baimei Stone白眉石，Meilin Mountain Park 梅林山公园, Futian, Shenzhen",
        tags: ["shenzhen"],
        queryHint: "Futian, Shenzhen"
      }
    ]);

    expect(candidates).toEqual([
      expect.objectContaining({
        name: "Baimei Stone 白眉石",
        city: "Shenzhen",
        country: "China",
        verificationSource: "context"
      })
    ]);
  });

  it("uses web context search to keep landmark-style OCR candidates when geocoders miss them", async () => {
    mockLookupPlaceSummaryFree.mockImplementation(async (query: string) => {
      if (query.includes("Shanghai")) {
        return {
          name: "Shanghai",
          city: "Shanghai",
          country: "China",
          formattedAddress: "Shanghai, China",
          location: {
            latitude: 31.2304,
            longitude: 121.4737
          },
          mapsUrl: "https://www.openstreetmap.org/example",
          typeName: "city"
        };
      }

      return null;
    });
    mockSearchPlaceContextWeb.mockResolvedValue([
      {
        title: "Five recommended Mobius strip-inspired attractions in Shanghai",
        snippet:
          'On Pudong New Area\'s Yaoti Road, the red Giant Double Spiral Tower, known as the "Endless Spiral", captivates onlookers with its mesmerizing design.',
        url: "https://english.shanghai.gov.cn/en-CityTour/endless-spiral",
        domain: "english.shanghai.gov.cn"
      }
    ]);

    const { verifyCandidates } = await import("@/lib/import-pipeline-candidates");
    const candidates = await verifyCandidates([
      {
        name: "Endless Spiral",
        city: "",
        country: "",
        category: "activities",
        description: "Recovered from saved reel evidence: SHANGHAI endless spiral",
        tags: ["shanghai"],
        queryHint: "Shanghai"
      }
    ]);

    expect(candidates).toEqual([
      expect.objectContaining({
        name: "Endless Spiral",
        city: "Shanghai",
        country: "China",
        verificationSource: "context"
      })
    ]);
  });
});
