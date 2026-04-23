export {};

const mockRequireApiUser = vi.hoisted(() => vi.fn());
const mockQueueImportSubmission = vi.hoisted(() => vi.fn());
const mockGetClientIp = vi.hoisted(() => vi.fn());
const mockRecordAuditEvent = vi.hoisted(() => vi.fn());
const mockApplyRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireApiUser: mockRequireApiUser
}));

vi.mock("@/lib/import-processing", () => ({
  queueImportSubmission: mockQueueImportSubmission
}));

vi.mock("@/lib/request", () => ({
  getClientIp: mockGetClientIp
}));

vi.mock("@/lib/audit", () => ({
  recordAuditEvent: mockRecordAuditEvent
}));

vi.mock("@/lib/security", async () => {
  const actual = await vi.importActual<typeof import("@/lib/security")>("@/lib/security");
  return {
    ...actual,
    applyRateLimit: mockApplyRateLimit
  };
});

function createImportRequest(body: unknown) {
  return new Request("http://localhost/api/imports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/imports", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockGetClientIp.mockReturnValue("127.0.0.1");
    mockApplyRateLimit.mockReturnValue({ allowed: true });
    mockRecordAuditEvent.mockResolvedValue(undefined);
  });

  it("returns 401 when the user is not authenticated", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: {},
      user: null
    });

    const { POST } = await import("@/app/api/imports/route");
    const response = await POST(
      createImportRequest({
        type: "text",
        content: "Kyoto food guide with Men-ya Inoichi and Kiyomizu-dera.",
        destinationHint: "Kyoto"
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Authentication required."
    });
    expect(mockQueueImportSubmission).not.toHaveBeenCalled();
  });

  it("returns 400 when the payload is invalid", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: {},
      user: {
        id: "user-1"
      }
    });

    const { POST } = await import("@/app/api/imports/route");
    const response = await POST(
      createImportRequest({
        type: "url",
        content: "http://localhost/private",
        destinationHint: "Kyoto"
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      errors: ["Only public http(s) URLs are allowed."]
    });
    expect(mockApplyRateLimit).not.toHaveBeenCalled();
  });

  it("accepts imports when the destination is missing", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: {},
      user: {
        id: "user-1"
      }
    });
    mockQueueImportSubmission.mockResolvedValue({
      status: 202,
      body: {
        job: {
          id: "artifact-1",
          extractedPlaces: 0,
          status: "queued"
        },
        statusUrl: "/api/imports/artifact-1"
      }
    });

    const { POST } = await import("@/app/api/imports/route");
    const response = await POST(
      createImportRequest({
        type: "url",
        content: "https://www.instagram.com/p/DLFBmZ2sUCx/",
        destinationHint: ""
      })
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({
      job: {
        id: "artifact-1",
        extractedPlaces: 0,
        status: "queued"
      },
      statusUrl: "/api/imports/artifact-1"
    });
    expect(mockQueueImportSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          type: "url",
          content: "https://www.instagram.com/p/DLFBmZ2sUCx/",
          destinationHint: ""
        }
      })
    );
  });

  it("returns 429 when the import rate limit triggers", async () => {
    mockRequireApiUser.mockResolvedValue({
      supabase: {},
      user: {
        id: "user-1"
      }
    });
    mockApplyRateLimit.mockReturnValue({
      allowed: false
    });

    const { POST } = await import("@/app/api/imports/route");
    const response = await POST(
      createImportRequest({
        type: "text",
        content: "Kyoto food guide with Men-ya Inoichi and Kiyomizu-dera.",
        destinationHint: "Kyoto"
      })
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "Too many import attempts. Try again shortly."
    });
    expect(mockQueueImportSubmission).not.toHaveBeenCalled();
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "security",
        severity: "warn"
      })
    );
  });

  it("delegates successful imports to the processing service", async () => {
    const supabase = {};
    const user = {
      id: "user-1"
    };
    mockRequireApiUser.mockResolvedValue({
      supabase,
      user
    });
    mockQueueImportSubmission.mockResolvedValue({
      status: 202,
      body: {
        job: {
          id: "artifact-1",
          extractedPlaces: 1,
          status: "queued"
        },
        statusUrl: "/api/imports/artifact-1"
      }
    });

    const { POST } = await import("@/app/api/imports/route");
    const response = await POST(
      createImportRequest({
        type: "url",
        content: "https://www.instagram.com/reel/test123",
        destinationHint: "Kyoto"
      })
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({
      job: {
        id: "artifact-1",
        extractedPlaces: 1,
        status: "queued"
      },
      statusUrl: "/api/imports/artifact-1"
    });
    expect(mockQueueImportSubmission).toHaveBeenCalledWith({
      supabase,
      user,
      payload: {
        type: "url",
        content: "https://www.instagram.com/reel/test123",
        destinationHint: "Kyoto"
      },
      ip: "127.0.0.1"
    });
  });
});
