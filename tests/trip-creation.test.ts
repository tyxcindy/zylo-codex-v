export {};

const mockRecordAuditEvent = vi.hoisted(() => vi.fn());

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mockRecordAuditEvent
}));

describe("trip creation service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockRecordAuditEvent.mockResolvedValue(undefined);
  });

  it("creates a trip for an owned destination", async () => {
    const { createTrip } = await import("@/lib/trip-creation");
    const result = await createTrip({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "destinations") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: "dest-1" }
                    })
                  }))
                }))
              }))
            };
          }

          if (table === "trips") {
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "trip-1",
                      destination_id: "dest-1",
                      title: "Kyoto Weekend",
                      status: "draft",
                      vibe: "Food crawl",
                      travelers: 2
                    },
                    error: null
                  })
                }))
              }))
            };
          }

          throw new Error(`Unhandled table ${table}`);
        })
      } as never,
      userId: "user-1",
      ip: "127.0.0.1",
      payload: {
        destinationId: "dest-1",
        title: "Kyoto Weekend",
        vibe: "Food crawl",
        travelers: 2
      }
    });

    expect(result).toEqual({
      ok: true,
      status: 201,
      trip: expect.objectContaining({
        id: "trip-1",
        title: "Kyoto Weekend"
      })
    });
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "api",
        message: "Trip created"
      })
    );
  });

  it("returns 404 when the destination is not owned by the user", async () => {
    const { createTrip } = await import("@/lib/trip-creation");
    const result = await createTrip({
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
      ip: "127.0.0.1",
      payload: {
        destinationId: "dest-404",
        title: "Kyoto Weekend",
        vibe: "Food crawl",
        travelers: 2
      }
    });

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "Destination not found."
    });
  });

  it("returns 500 when trip insertion fails", async () => {
    const { createTrip } = await import("@/lib/trip-creation");
    const result = await createTrip({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "destinations") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: "dest-1" }
                    })
                  }))
                }))
              }))
            };
          }

          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "insert failed" }
                })
              }))
            }))
          };
        })
      } as never,
      userId: "user-1",
      ip: "127.0.0.1",
      payload: {
        destinationId: "dest-1",
        title: "Kyoto Weekend",
        vibe: "Food crawl",
        travelers: 2
      }
    });

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "Unable to create trip."
    });
    expect(mockRecordAuditEvent).not.toHaveBeenCalled();
  });
});
