export {};

const mockRecordAuditEvent = vi.hoisted(() => vi.fn());

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mockRecordAuditEvent
}));

describe("trip generation service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockRecordAuditEvent.mockResolvedValue(undefined);
  });

  it("returns 404 when the trip does not exist", async () => {
    const { generateTripDraft } = await import("@/lib/trip-generation");
    const result = await generateTripDraft({
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null
                })
              }))
            }))
          }))
        }))
      } as never,
      userId: "user-1",
      tripId: "trip-404",
      ip: "127.0.0.1",
      payload: {
        prompt: "Build me a day plan in Kyoto."
      }
    });

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "Trip not found."
    });
  });

  it("creates the first day when the trip has no days yet", async () => {
    const tripDaysInsert = vi.fn().mockResolvedValue(undefined);
    const tripUpdateEq = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue(undefined)
    }));

    const { generateTripDraft } = await import("@/lib/trip-generation");
    const result = await generateTripDraft({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "trips") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: "trip-1",
                        destination_id: "dest-1",
                        title: "Kyoto Weekend",
                        status: "draft"
                      }
                    })
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: tripUpdateEq
              }))
            };
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({
                    data: []
                  })
                }))
              }))
            })),
            insert: tripDaysInsert
          };
        })
      } as never,
      userId: "user-1",
      tripId: "trip-1",
      ip: "127.0.0.1",
      payload: {
        prompt: "Build me a day plan in Kyoto."
      }
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      trip: {
        id: "trip-1",
        destination_id: "dest-1",
        title: "Kyoto Weekend",
        status: "ready"
      },
      message:
        "Trip draft generated. This beta route creates a first itinerary day and marks the trip ready."
    });
    expect(tripDaysInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Generated day 1"
      })
    );
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "ai",
        message: "Trip generation requested"
      })
    );
  });

  it("does not create another day when one already exists", async () => {
    const tripDaysInsert = vi.fn();

    const { generateTripDraft } = await import("@/lib/trip-generation");
    await generateTripDraft({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "trips") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: "trip-1",
                        destination_id: "dest-1",
                        title: "Kyoto Weekend",
                        status: "draft"
                      }
                    })
                  }))
                }))
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn().mockResolvedValue(undefined)
                }))
              }))
            };
          }

          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ id: "day-1" }]
                  })
                }))
              }))
            })),
            insert: tripDaysInsert
          };
        })
      } as never,
      userId: "user-1",
      tripId: "trip-1",
      ip: "127.0.0.1",
      payload: {
        prompt: "Build me a day plan in Kyoto."
      }
    });

    expect(tripDaysInsert).not.toHaveBeenCalled();
  });
});
