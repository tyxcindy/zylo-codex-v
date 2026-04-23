export {};

const mockRequireApiUser = vi.hoisted(() => vi.fn());
const mockGenerateAiConciergeReply = vi.hoisted(() => vi.fn());
const mockGetClientIp = vi.hoisted(() => vi.fn());
const mockApplyRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireApiUser: mockRequireApiUser
}));

vi.mock("@/lib/ai-concierge", () => ({
  generateAiConciergeReply: mockGenerateAiConciergeReply
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

describe("POST /api/ai/chat", () => {
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

    const { POST } = await import("@/app/api/ai/chat/route");
    const response = await POST(
      new Request("http://localhost/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Help me find dessert in Tokyo."
        })
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

    const { POST } = await import("@/app/api/ai/chat/route");
    const response = await POST(
      new Request("http://localhost/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Help me find dessert in Tokyo."
        })
      })
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "AI request limit reached."
    });
    expect(mockGenerateAiConciergeReply).not.toHaveBeenCalled();
  });

  it("delegates chat generation to the concierge service", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: { db: "ok" },
      user: { id: "user-1" }
    });
    mockGenerateAiConciergeReply.mockResolvedValue({
      reply: "Try a dessert stop near Omotesando.",
      imageHintHandled: true
    });

    const { POST } = await import("@/app/api/ai/chat/route");
    const response = await POST(
      new Request("http://localhost/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Help me find dessert in Tokyo.",
          imageHint: "cake"
        })
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      reply: "Try a dessert stop near Omotesando.",
      imageHintHandled: true
    });
    expect(mockGenerateAiConciergeReply).toHaveBeenCalledWith({
      supabase: { db: "ok" },
      userId: "user-1",
      ip: "127.0.0.1",
      payload: {
        message: "Help me find dessert in Tokyo.",
        imageHint: "cake"
      }
    });
  });
});
