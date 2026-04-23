export {};

const mockRequireApiUser = vi.hoisted(() => vi.fn());
const mockUpdatePlaceSaveState = vi.hoisted(() => vi.fn());
const mockGetClientIp = vi.hoisted(() => vi.fn());
const mockApplyRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireApiUser: mockRequireApiUser
}));

vi.mock("@/lib/place-save-state", () => ({
  updatePlaceSaveState: mockUpdatePlaceSaveState
}));

vi.mock("@/lib/request", () => ({
  getClientIp: mockGetClientIp
}));

vi.mock("@/lib/security", async () => {
  const actual = await vi.importActual<typeof import("@/lib/security")>("@/lib/security");
  return {
    ...actual,
    applyRateLimit: mockApplyRateLimit
  };
});

describe("POST /api/places/[id]/save-state", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockApplyRateLimit.mockReturnValue({ allowed: true });
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: {},
      user: null
    });

    const { POST } = await import("@/app/api/places/[id]/save-state/route");
    const response = await POST(
      new Request("http://localhost/api/places/place-1/save-state", {
        method: "POST",
        body: JSON.stringify({ isVisited: true })
      }),
      { params: Promise.resolve({ id: "place-1" }) }
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required."
    });
  });

  it("returns 429 when rate-limited", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: {},
      user: { id: "user-1" }
    });
    mockApplyRateLimit.mockReturnValue({ allowed: false });

    const { POST } = await import("@/app/api/places/[id]/save-state/route");
    const response = await POST(
      new Request("http://localhost/api/places/place-1/save-state", {
        method: "POST",
        body: JSON.stringify({ isVisited: true })
      }),
      { params: Promise.resolve({ id: "place-1" }) }
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "Rate limit exceeded."
    });
    expect(mockUpdatePlaceSaveState).not.toHaveBeenCalled();
  });

  it("delegates updates to the save-state service", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: { db: "ok" },
      user: { id: "user-1" }
    });
    mockUpdatePlaceSaveState.mockResolvedValue({
      ok: true,
      status: 200,
      place: { id: "place-1", is_visited: true }
    });

    const { POST } = await import("@/app/api/places/[id]/save-state/route");
    const response = await POST(
      new Request("http://localhost/api/places/place-1/save-state", {
        method: "POST",
        body: JSON.stringify({ isVisited: true })
      }),
      { params: Promise.resolve({ id: "place-1" }) }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      place: { id: "place-1", is_visited: true }
    });
    expect(mockUpdatePlaceSaveState).toHaveBeenCalledWith({
      supabase: { db: "ok" },
      userId: "user-1",
      placeId: "place-1",
      ip: "127.0.0.1",
      isVisited: true,
      isInTrip: undefined
    });
  });
});
