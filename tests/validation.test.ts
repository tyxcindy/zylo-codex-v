import {
  authSignUpSchema,
  importSchema,
  parseWithSchema
} from "@/lib/validation";

describe("importSchema", () => {
  it("accepts a valid import payload", () => {
    const result = parseWithSchema(importSchema, {
      type: "url",
      content: "https://example.com/tokyo-food-reel"
    });

    expect(result.success).toBe(true);
  });

  it("rejects content that is too short", () => {
    const result = parseWithSchema(importSchema, {
      type: "text",
      content: "short"
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain("enough detail");
    }
  });

  it("rejects unsafe local URLs", () => {
    const result = parseWithSchema(importSchema, {
      type: "url",
      content: "http://localhost:3000/private"
    });

    expect(result.success).toBe(false);
  });
});

describe("authSignUpSchema", () => {
  it("requires a strong password", () => {
    const result = parseWithSchema(authSignUpSchema, {
      email: "hello@example.com",
      password: "weakpass",
      displayName: "Maya",
      homeCity: "New York"
    });

    expect(result.success).toBe(false);
  });

  it("accepts a strong password", () => {
    const result = parseWithSchema(authSignUpSchema, {
      email: "hello@example.com",
      password: "VeryStrong123",
      displayName: "Maya",
      homeCity: "New York"
    });

    expect(result.success).toBe(true);
  });
});
