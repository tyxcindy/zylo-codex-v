export {};

const mockRequireApiUser = vi.hoisted(() => vi.fn());
const mockSavePlannerNotes = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireApiUser: mockRequireApiUser
}));

vi.mock("@/lib/planner-notes", () => ({
  savePlannerNotes: mockSavePlannerNotes
}));

describe("POST /api/profile/planner-notes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 when the user is not signed in", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: {},
      user: null
    });

    const { POST } = await import("@/app/api/profile/planner-notes/route");
    const response = await POST(
      new Request("http://localhost/api/profile/planner-notes", {
        method: "POST",
        body: JSON.stringify({ notes: "Hello" })
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Sign in required."
    });
  });

  it("returns 400 for oversized notes", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: {},
      user: {
        id: "user-1"
      }
    });

    const { POST } = await import("@/app/api/profile/planner-notes/route");
    const response = await POST(
      new Request("http://localhost/api/profile/planner-notes", {
        method: "POST",
        body: JSON.stringify({ notes: "x".repeat(4001) })
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Planner notes must be 4,000 characters or fewer."
    });
    expect(mockSavePlannerNotes).not.toHaveBeenCalled();
  });

  it("delegates successful saves to the service", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: { db: "ok" },
      user: {
        id: "user-1"
      }
    });
    mockSavePlannerNotes.mockResolvedValue({
      ok: true,
      status: 200,
      notes: "Line 1\nLine 2"
    });

    const { POST } = await import("@/app/api/profile/planner-notes/route");
    const response = await POST(
      new Request("http://localhost/api/profile/planner-notes", {
        method: "POST",
        body: JSON.stringify({ notes: "Line 1\r\nLine 2" })
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      notes: "Line 1\nLine 2"
    });
    expect(mockSavePlannerNotes).toHaveBeenCalledWith({
      supabase: { db: "ok" },
      userId: "user-1",
      notes: "Line 1\r\nLine 2"
    });
  });
});
