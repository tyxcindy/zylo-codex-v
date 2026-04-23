export {};

const mockRecordAuditEvent = vi.hoisted(() => vi.fn());
const mockAskGemini = vi.hoisted(() => vi.fn());

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mockRecordAuditEvent
}));

vi.mock("@/lib/providers/gemini", () => ({
  askGemini: mockAskGemini
}));

import {
  buildFallbackConciergeReply,
  formatTasteProfileSummary,
  generateAiConciergeReply
} from "@/lib/ai-concierge";

describe("ai concierge service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordAuditEvent.mockResolvedValue(undefined);
  });

  it("formats the taste profile summary deterministically", () => {
    expect(
      formatTasteProfileSummary({
        priorities: ["walkability", "design"],
        favorite_cuisines: ["Japanese", "Coffee"],
        avoids: ["chains"]
      })
    ).toBe(
      "walkability, design | favorite cuisines: Japanese, Coffee | avoids: chains"
    );
  });

  it("builds a fallback reply when Gemini does not answer", () => {
    expect(
      buildFallbackConciergeReply({
        tripTitle: "Tokyo Weekend",
        favoriteCuisines: ["Japanese", "Coffee"]
      })
    ).toContain("Tokyo Weekend");
  });

  it("returns a live Gemini reply when available", async () => {
    mockAskGemini.mockResolvedValue("Try a dessert stop near Omotesando.");

    const { generateAiConciergeReply } = await import("@/lib/ai-concierge");
    const result = await generateAiConciergeReply({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "trips") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: "trip-1", title: "Tokyo Weekend" }
                    })
                  }))
                }))
              }))
            };
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    priorities: ["walkability"],
                    favorite_cuisines: ["Japanese", "Coffee"],
                    avoids: ["chains"]
                  }
                })
              }))
            }))
          };
        })
      } as never,
      userId: "user-1",
      ip: "127.0.0.1",
      payload: {
        tripId: "trip-1",
        message: "Need dessert after coffee.",
        imageHint: "cake"
      }
    });

    expect(result).toEqual({
      reply: "Try a dessert stop near Omotesando.",
      imageHintHandled: true
    });
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ai",
        message: "AI concierge response generated"
      })
    );
  });

  it("falls back when Gemini returns null", async () => {
    mockAskGemini.mockResolvedValue(null);

    const { generateAiConciergeReply } = await import("@/lib/ai-concierge");
    const result = await generateAiConciergeReply({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "trips") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null
                    })
                  }))
                }))
              }))
            };
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    priorities: [],
                    favorite_cuisines: ["Japanese"],
                    avoids: []
                  }
                })
              }))
            }))
          };
        })
      } as never,
      userId: "user-1",
      ip: "127.0.0.1",
      payload: {
        message: "Need dessert after coffee."
      }
    });

    expect(result.reply).toContain("your saved library");
    expect(result.imageHintHandled).toBe(false);
  });
});
