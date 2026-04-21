import { applyRateLimit, requireOwnership } from "@/lib/security";

describe("security helpers", () => {
  it("blocks requests after the configured rate limit", () => {
    const first = applyRateLimit("test-rate", 2, 5_000);
    const second = applyRateLimit("test-rate", 2, 5_000);
    const third = applyRateLimit("test-rate", 2, 5_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it("enforces ownership checks", () => {
    expect(requireOwnership("user_demo_01", "user_demo_01")).toBe(true);
    expect(requireOwnership("user_demo_01", "someone_else")).toBe(false);
  });
});
