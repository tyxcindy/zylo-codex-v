export {};

const mockRequireApiUser = vi.hoisted(() => vi.fn());
const mockGenerateTripDraft = vi.hoisted(() => vi.fn());
const mockGetClientIp = vi.hoisted(() => vi.fn());
const mockApplyRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireApiUser: mockRequireApiUser
}));

vi.mock("@/lib/trip-generation", () => ({
  generateTripDraft: mockGenerateTripDraft
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

describe("POST /api/trips/[id]/generate", () => {
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

    const { POST } = await import("@/app/api/trips/[id]/generate/route");
    const response = await POST(
      new Request("http://localhost/api/trips/trip-1/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Build me a day plan in Kyoto."
        })
      }),
      { params: Promise.resolve({ id: "trip-1" }) }
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

    const { POST } = await import("@/app/api/trips/[id]/generate/route");
    const response = await POST(
      new Request("http://localhost/api/trips/trip-1/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Build me a day plan in Kyoto."
        })
      }),
      { params: Promise.resolve({ id: "trip-1" }) }
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "AI generation rate limit exceeded."
    });
    expect(mockGenerateTripDraft).not.toHaveBeenCalled();
  });

  it("delegates generation to the trip-generation service", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: { db: "ok" },
      user: { id: "user-1" }
    });
    mockGenerateTripDraft.mockResolvedValue({
      ok: true,
      status: 200,
      trip: { id: "trip-1", status: "ready" },
      message: "Trip draft generated."
    });

    const { POST } = await import("@/app/api/trips/[id]/generate/route");
    const response = await POST(
      new Request("http://localhost/api/trips/trip-1/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: "Build me a day plan in Kyoto."
        })
      }),
      { params: Promise.resolve({ id: "trip-1" }) }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      trip: { id: "trip-1", status: "ready" },
      message: "Trip draft generated."
    });
    expect(mockGenerateTripDraft).toHaveBeenCalledWith({
      supabase: { db: "ok" },
      userId: "user-1",
      tripId: "trip-1",
      ip: "127.0.0.1",
      payload: {
        prompt: "Build me a day plan in Kyoto."
      }
    });
  });
});
