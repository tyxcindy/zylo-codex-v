export {};

const mockCallGemini = vi.hoisted(() => vi.fn());

vi.mock("@/lib/providers/gemini-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/providers/gemini-client")>(
    "@/lib/providers/gemini-client"
  );

  return {
    ...actual,
    callGemini: mockCallGemini
  };
});

import { defaultLocale } from "@/lib/i18n";
import { formatTasteProfileSummary, buildFallbackConciergeReply } from "@/lib/ai-concierge";
import {
  buildConciergePrompt,
  buildPlaceExtractionPrompt,
  buildPlaceTranslationPrompt
} from "@/lib/providers/gemini-prompts";
import {
  askGemini,
  extractPlacesWithGemini,
  GeminiProviderError,
  translateCandidatesToEnglish
} from "@/lib/providers/gemini";

describe("gemini prompts and provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a locale-aware concierge prompt", () => {
    const prompt = buildConciergePrompt({
      message: "Find dessert in Tokyo",
      tripTitle: "Tokyo weekend",
      tasteProfileSummary: "coffee, dessert",
      replyLocale: "zh-CN"
    });

    expect(prompt).toContain("Reply in Simplified Chinese.");
    expect(prompt).toContain("Tokyo weekend");
  });

  it("builds a strict extraction prompt", () => {
    const prompt = buildPlaceExtractionPrompt({
      type: "text",
      content: "Men-ya Inoichi in Kyoto",
      destinationHint: "Kyoto"
    });

    expect(prompt).toContain('Return strict JSON only with shape { "places": ExtractedPlaceCandidate[] }.');
    expect(prompt).toContain("Destination hint: Kyoto");
  });

  it("builds a translation prompt for chinese place candidates", () => {
    const prompt = buildPlaceTranslationPrompt([
      {
        name: "富锦树台菜香槟",
        city: "台北",
        country: "台湾",
        description: "台菜餐厅",
        tags: ["台菜", "餐厅"]
      }
    ]);

    expect(prompt).toContain("Translate or romanize Simplified Chinese and Traditional Chinese");
    expect(prompt).toContain("富锦树台菜香槟");
  });

  it("parses extracted places from Gemini JSON", async () => {
    mockCallGemini.mockResolvedValue(
      JSON.stringify({
        places: [
          {
            name: "Men-ya Inoichi",
            city: "Kyoto",
            country: "Japan",
            category: "restaurants",
            description: "Ramen stop",
            tags: ["ramen"]
          }
        ]
      })
    );

    await expect(
      extractPlacesWithGemini({
        type: "text",
        content: "Try Men-ya Inoichi in Kyoto."
      })
    ).resolves.toEqual([
      expect.objectContaining({
        name: "Men-ya Inoichi",
        city: "Kyoto"
      })
    ]);
  });

  it("throws when Gemini is unavailable for extraction", async () => {
    mockCallGemini.mockResolvedValue(null);

    await expect(
      extractPlacesWithGemini({
        type: "text",
        content: "Try Men-ya Inoichi in Kyoto."
      })
    ).rejects.toBeInstanceOf(GeminiProviderError);
  });

  it("returns null when chat parsing fails", async () => {
    mockCallGemini.mockResolvedValue("not json");

    await expect(
      askGemini({
        message: "Find dessert in Tokyo",
        tasteProfileSummary: "dessert",
        replyLocale: defaultLocale
      })
    ).resolves.toBeNull();
  });

  it("parses translated place candidates from Gemini JSON", async () => {
    mockCallGemini.mockResolvedValue(
      JSON.stringify({
        places: [
          {
            index: 0,
            name: "Fujin Tree Taiwanese Cuisine & Champagne",
            city: "Taipei",
            country: "Taiwan",
            description: "Taiwanese restaurant.",
            tags: ["taiwanese food", "restaurant"]
          }
        ]
      })
    );

    await expect(
      translateCandidatesToEnglish([
        {
          name: "富锦树台菜香槟",
          city: "台北",
          country: "台湾",
          category: "restaurants",
          description: "台菜餐厅",
          tags: ["台菜", "餐厅"]
        }
      ])
    ).resolves.toEqual([
      expect.objectContaining({
        index: 0,
        name: "Fujin Tree Taiwanese Cuisine & Champagne",
        city: "Taipei"
      })
    ]);
  });

  it("formats concierge fallbacks in Chinese when needed", () => {
    expect(
      formatTasteProfileSummary(
        {
          priorities: ["walkability"],
          favorite_cuisines: ["Japanese"],
          avoids: ["chains"]
        },
        "zh-CN"
      )
    ).toContain("喜欢的料理");

    expect(
      buildFallbackConciergeReply({
        tripTitle: "Tokyo weekend",
        favoriteCuisines: ["Japanese"],
        locale: "zh-CN"
      })
    ).toContain("口味偏好");
  });
});
