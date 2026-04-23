import { normalizePlannerNotes, savePlannerNotes } from "@/lib/planner-notes";

describe("planner notes service", () => {
  it("normalizes Windows newlines", () => {
    expect(normalizePlannerNotes("Line 1\r\nLine 2")).toBe("Line 1\nLine 2");
  });

  it("saves planner notes successfully", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });

    const result = await savePlannerNotes({
      supabase: {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq
          }))
        }))
      } as never,
      userId: "user-1",
      notes: "Line 1\r\nLine 2"
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      notes: "Line 1\nLine 2"
    });
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns a migration conflict when planner_notes is missing remotely", async () => {
    const result = await savePlannerNotes({
      supabase: {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              error: {
                message: 'column "planner_notes" does not exist'
              }
            })
          }))
        }))
      } as never,
      userId: "user-1",
      notes: "Hello"
    });

    expect(result).toEqual({
      ok: false,
      status: 409,
      error: "Planner notes need one SQL migration before they can save remotely."
    });
  });

  it("returns a generic server error for other failures", async () => {
    const result = await savePlannerNotes({
      supabase: {
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              error: {
                message: "write failed"
              }
            })
          }))
        }))
      } as never,
      userId: "user-1",
      notes: "Hello"
    });

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "Could not save planner notes."
    });
  });
});
