export {};

const mockRequireApiUser = vi.hoisted(() => vi.fn());
const mockCreateTrip = vi.hoisted(() => vi.fn());
const mockGetClientIp = vi.hoisted(() => vi.fn());
const mockApplyRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireApiUser: mockRequireApiUser
}));

vi.mock("@/lib/trip-creation", () => ({
  createTrip: mockCreateTrip
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

describe("POST /api/trips", () => {
  const validPayload = {
    destinationId: "550e8400-e29b-41d4-a716-446655440000",
    title: "Kyoto Weekend",
    vibe: "Food crawl",
    travelers: 2
  };

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

    const { POST } = await import("@/app/api/trips/route");
    const response = await POST(
      new Request("http://localhost/api/trips", {
        method: "POST",
        body: JSON.stringify(validPayload)
      })
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

    const { POST } = await import("@/app/api/trips/route");
    const response = await POST(
      new Request("http://localhost/api/trips", {
        method: "POST",
        body: JSON.stringify(validPayload)
      })
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "Too many trip requests."
    });
    expect(mockCreateTrip).not.toHaveBeenCalled();
  });

  it("delegates trip creation to the service", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: { db: "ok" },
      user: { id: "user-1" }
    });
    mockCreateTrip.mockResolvedValue({
      ok: true,
      status: 201,
      trip: { id: "trip-1", title: "Kyoto Weekend" }
    });

    const { POST } = await import("@/app/api/trips/route");
    const response = await POST(
      new Request("http://localhost/api/trips", {
        method: "POST",
        body: JSON.stringify(validPayload)
      })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      trip: { id: "trip-1", title: "Kyoto Weekend" }
    });
    expect(mockCreateTrip).toHaveBeenCalledWith({
      supabase: { db: "ok" },
      userId: "user-1",
      ip: "127.0.0.1",
      payload: {
        destinationId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Kyoto Weekend",
        vibe: "Food crawl",
        travelers: 2
      }
    });
  });
});
