export {};

const mockApplyRateLimit = vi.hoisted(() => vi.fn());
const mockGetClientIp = vi.hoisted(() => vi.fn());
const mockGetAppUrl = vi.hoisted(() => vi.fn());
const mockRecordAuditEvent = vi.hoisted(() => vi.fn());
const mockSignUpWithEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/security", async () => {
  const actual = await vi.importActual<typeof import("@/lib/security")>("@/lib/security");
  return {
    ...actual,
    applyRateLimit: mockApplyRateLimit
  };
});

vi.mock("@/lib/request", async () => {
  const actual = await vi.importActual<typeof import("@/lib/request")>("@/lib/request");
  return {
    ...actual,
    getClientIp: mockGetClientIp,
    getAppUrl: mockGetAppUrl
  };
});

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mockRecordAuditEvent
}));

vi.mock("@/lib/auth-sign-up", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-sign-up")>("@/lib/auth-sign-up");
  return {
    ...actual,
    signUpWithEmail: mockSignUpWithEmail
  };
});

describe("POST /api/auth/sign-up", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockApplyRateLimit.mockReturnValue({
      allowed: true,
      remaining: 2,
      resetAt: Date.now() + 60_000
    });
    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockGetAppUrl.mockReturnValue("http://localhost:3005");
    mockRecordAuditEvent.mockResolvedValue(undefined);
  });

  it("rejects invalid JSON bodies", async () => {
    const { POST } = await import("@/app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: "{"
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid request."
    });
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it("returns the first validation error for invalid payloads", async () => {
    const { POST } = await import("@/app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName: "C",
          email: "bad-email",
          password: "short"
        })
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Enter a valid email address."
    });
    expect(mockApplyRateLimit).not.toHaveBeenCalled();
  });

  it("returns a success payload for new accounts", async () => {
    mockSignUpWithEmail.mockResolvedValue({
      ok: true,
      status: 201,
      message: "Account created. Check your email to verify your address before signing in.",
      userId: "user-1"
    });

    const { POST } = await import("@/app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName: " Cindy ",
          email: "CINDYT07+test4@mit.edu",
          password: "StrongPassword123"
        })
      })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      message: "Account created. Check your email to verify your address before signing in."
    });
    expect(mockSignUpWithEmail).toHaveBeenCalledWith({
      appUrl: "http://localhost:3005",
      displayName: "Cindy",
      email: "cindyt07+test4@mit.edu",
      password: "StrongPassword123"
    });
  });

  it("returns 409 when the email is already registered", async () => {
    mockSignUpWithEmail.mockResolvedValue({
      ok: false,
      status: 409,
      message: "This email is already registered. Sign in instead or reset your password."
    });

    const { POST } = await import("@/app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName: "Cindy",
          email: "cindyt07+test3@mit.edu",
          password: "StrongPassword123"
        })
      })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "This email is already registered. Sign in instead or reset your password."
    });
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "auth",
        severity: "warn"
      })
    );
  });

  it("returns 429 when the signup rate limit triggers", async () => {
    mockApplyRateLimit.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60_000
    });

    const { POST } = await import("@/app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName: "Cindy",
          email: "cindy@example.com",
          password: "StrongPassword123"
        })
      })
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "Too many sign-up attempts. Try again later."
    });
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "security",
        severity: "warn"
      })
    );
  });

  it("returns 500 when the signup helper throws", async () => {
    mockSignUpWithEmail.mockRejectedValue(new Error("database offline"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { POST } = await import("@/app/api/auth/sign-up/route");
    const response = await POST(
      new Request("http://localhost/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName: "Cindy",
          email: "cindy@example.com",
          password: "StrongPassword123"
        })
      })
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to create account."
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
