export {};

const mockTranslateCandidatesToEnglish = vi.hoisted(() => vi.fn());

vi.mock("@/lib/providers/gemini", async () => {
  const actual = await vi.importActual<typeof import("@/lib/providers/gemini")>(
    "@/lib/providers/gemini"
  );

  return {
    ...actual,
    translateCandidatesToEnglish: mockTranslateCandidatesToEnglish
  };
});

import {
  appendOriginalChineseName,
  containsChineseCharacters,
  normalizeCandidatesForEnglish
} from "@/lib/import-language";
import type { PipelineStages } from "@/lib/import-pipeline-types";

describe("import language normalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects chinese characters", () => {
    expect(containsChineseCharacters("富锦树")).toBe(true);
    expect(containsChineseCharacters("Taipei")).toBe(false);
  });

  it("appends the original chinese name to english descriptions", () => {
    expect(
      appendOriginalChineseName({
        description: "Taiwanese restaurant in Taipei.",
        translatedName: "Fujin Tree Taiwanese Cuisine & Champagne",
        originalName: "富锦树台菜香槟"
      })
    ).toBe(
      "Taiwanese restaurant in Taipei. Original Chinese name: 富锦树台菜香槟."
    );
  });

  it("normalizes chinese candidates into english-facing saved records", async () => {
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

    const stages: PipelineStages = {
      metadata: { status: "skipped", detail: "Not run." },
      ytDlp: { status: "skipped", detail: "Not run." },
      subtitles: { status: "skipped", detail: "Not run." },
      download: { status: "skipped", detail: "Not run." },
      frames: { status: "skipped", detail: "Not run." },
      ocr: { status: "skipped", detail: "Not run." },
      transcript: { status: "skipped", detail: "Not run." },
      geocoding: { status: "skipped", detail: "Not run." },
      languageNormalization: { status: "skipped", detail: "Not run." },
      geminiRefinement: { status: "skipped", detail: "Not run." }
    };

    const normalized = await normalizeCandidatesForEnglish({
      candidates: [
        {
          name: "富锦树台菜香槟",
          city: "台北",
          country: "台湾",
          category: "restaurants",
          description: "台菜餐厅",
          tags: ["台菜", "餐厅"],
          address: "Taipei, Taiwan",
          latitude: 25.0,
          longitude: 121.5,
          mapsUrl: "https://maps.example",
          verificationSource: "google"
        }
      ],
      diagnostics: [],
      stages
    });

    expect(normalized[0]).toEqual(
      expect.objectContaining({
        name: "Fujin Tree Taiwanese Cuisine & Champagne",
        city: "Taipei",
        country: "Taiwan",
        description: expect.stringContaining("Original Chinese name: 富锦树台菜香槟."),
        tags: ["taiwanese food", "restaurant"]
      })
    );
    expect(stages.languageNormalization.status).toBe("complete");
  });
});
