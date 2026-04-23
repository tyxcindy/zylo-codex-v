import {
  getAppUrl,
  getBaseUrl,
  getClientIp,
  maskEmail,
  safeRedirectPath
} from "@/lib/request";

describe("request helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the first forwarded IP address", () => {
    const ip = getClientIp(
      new Request("https://zylo.app/api/test", {
        headers: {
          "x-forwarded-for": "203.0.113.10, 198.51.100.4"
        }
      })
    );

    expect(ip).toBe("203.0.113.10");
  });

  it("falls back to alternate IP headers and unknown", () => {
    expect(
      getClientIp({
        get(name: string) {
          return name === "cf-connecting-ip" ? "198.51.100.8" : null;
        }
      })
    ).toBe("198.51.100.8");

    expect(
      getClientIp({
        get() {
          return null;
        }
      })
    ).toBe("unknown");
  });

  it("builds the base URL from forwarded host and protocol", () => {
    const url = getBaseUrl({
      get(name: string) {
        const values: Record<string, string> = {
          "x-forwarded-proto": "https",
          "x-forwarded-host": "app.zylo.test"
        };
        return values[name] ?? null;
      }
    });

    expect(url).toBe("https://app.zylo.test");
  });

  it("defaults localhost hosts to http", () => {
    const url = getBaseUrl({
      get(name: string) {
        return name === "host" ? "localhost:3000" : null;
      }
    });

    expect(url).toBe("http://localhost:3000");
  });

  it("prefers explicit app URLs and trims trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://zylo.app/");
    vi.stubEnv("APP_BASE_URL", "https://ignored.example");

    const url = getAppUrl(new Headers({ host: "localhost:3000" }));

    expect(url).toBe("https://zylo.app");
  });

  it("falls back to the Vercel production URL when present", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL", "zylo.vercel.app");

    const url = getAppUrl(new Headers({ host: "localhost:3000" }));

    expect(url).toBe("https://zylo.vercel.app");
  });

  it("allows only safe internal redirect paths", () => {
    expect(safeRedirectPath("/dashboard?tab=map", "/dashboard")).toBe("/dashboard?tab=map");
    expect(safeRedirectPath("https://evil.example", "/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.example", "/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath(undefined, "/dashboard")).toBe("/dashboard");
  });

  it("masks email addresses without leaking invalid values", () => {
    expect(maskEmail("founder@zylo.app")).toBe("fo***@zylo.app");
    expect(maskEmail("invalid")).toBe("unknown");
  });
});
