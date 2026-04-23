export {};

const mockRecordAuditEvent = vi.hoisted(() => vi.fn());

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mockRecordAuditEvent
}));

import { buildPlaceStateUpdates, updatePlaceSaveState } from "@/lib/place-save-state";

describe("place save-state service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordAuditEvent.mockResolvedValue(undefined);
  });

  it("builds only the provided updates", () => {
    expect(buildPlaceStateUpdates({ isVisited: true })).toEqual({ is_visited: true });
    expect(buildPlaceStateUpdates({ isInTrip: false })).toEqual({ is_in_trip: false });
    expect(buildPlaceStateUpdates({})).toEqual({});
  });

  it("returns the updated place and records an audit event", async () => {
    const place = { id: "place-1", is_visited: true, is_in_trip: false };

    const result = await updatePlaceSaveState({
      supabase: {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: place,
                    error: null
                  })
                }))
              }))
            }))
          }))
        }))
      } as never,
      userId: "user-1",
      placeId: "place-1",
      ip: "127.0.0.1",
      isVisited: true
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      place
    });
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "api",
        message: "Place save state updated"
      })
    );
  });

  it("returns not found when no place is updated", async () => {
    const result = await updatePlaceSaveState({
      supabase: {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "missing" }
                  })
                }))
              }))
            }))
          }))
        }))
      } as never,
      userId: "user-1",
      placeId: "missing",
      ip: "127.0.0.1",
      isInTrip: true
    });

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "Place not found."
    });
    expect(mockRecordAuditEvent).not.toHaveBeenCalled();
  });
});
