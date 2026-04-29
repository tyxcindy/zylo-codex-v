export {};

describe("import pipeline media", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.ZYLO_YTDLP_COOKIES_FILE;
    delete process.env.ZYLO_YTDLP_COOKIE_FILES;
    delete process.env.ZYLO_YTDLP_COOKIE_BROWSERS;
    delete process.env.ZYLO_YTDLP_DISABLE_BROWSER_COOKIES;
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", {
      value: originalPlatform
    });
    vi.doUnmock("node:fs");
  });

  it("passes the certificate-bypass flag to yt-dlp metadata fetches", async () => {
    const { buildYtDlpArgs } = await import("@/lib/import-pipeline-media");
    const args = buildYtDlpArgs("https://www.instagram.com/p/DDg7HR5TfGy/", {
      dumpSingleJson: true,
      skipDownload: true,
      noCheckCertificates: true
    });

    expect(args).toEqual([
      "https://www.instagram.com/p/DDg7HR5TfGy/",
      "--dump-single-json",
      "--skip-download",
      "--no-check-certificates"
    ]);
  });

  it("adds browser-cookie retry attempts after an instagram auth error", async () => {
    const { buildYtDlpAttempts } = await import("@/lib/import-pipeline-media");
    const attempts = buildYtDlpAttempts(
      "https://www.instagram.com/p/DLFBmZ2sUCx/",
      {
        dumpSingleJson: true,
        skipDownload: true,
        noCheckCertificates: true,
        noWarnings: true
      },
      "Requested content is not available, rate-limit reached or login required. Use --cookies-from-browser"
    );

    expect(attempts[0]).toEqual(
      expect.objectContaining({
        label: "direct"
      })
    );
    expect(attempts.slice(1)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: expect.stringContaining("cookies:"),
          flags: expect.objectContaining({
            cookiesFromBrowser: expect.any(String)
          })
        })
      ])
    );
  });

  it("adds configured cookie-file retries before browser-cookie retries for social URLs", async () => {
    process.env.ZYLO_YTDLP_COOKIE_FILES =
      "instagram=/tmp/instagram-cookies.txt,tiktok=/tmp/tiktok-cookies.txt,all=/tmp/shared-cookies.txt";

    const { buildYtDlpAttempts } = await import("@/lib/import-pipeline-media");
    const attempts = buildYtDlpAttempts(
      "https://www.tiktok.com/@demo/video/123",
      {
        dumpSingleJson: true,
        skipDownload: true,
        noCheckCertificates: true,
        noWarnings: true
      },
      "login required"
    );

    expect(attempts.slice(0, 3)).toEqual([
      expect.objectContaining({
        label: "direct"
      }),
      expect.objectContaining({
        label: "cookie-file:tiktok:/tmp/tiktok-cookies.txt",
        flags: expect.objectContaining({
          cookies: "/tmp/tiktok-cookies.txt"
        })
      }),
      expect.objectContaining({
        label: "cookie-file:all:/tmp/shared-cookies.txt",
        flags: expect.objectContaining({
          cookies: "/tmp/shared-cookies.txt"
        })
      })
    ]);
    expect(attempts.at(-1)).toEqual(
      expect.objectContaining({
        label: expect.stringContaining("cookies:")
      })
    );
  });

  it("expands plain chrome browser probing into discovered Chrome profiles on macOS", async () => {
    vi.doMock("node:fs", async () => {
      const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
      return {
        ...actual,
        readFileSync: vi.fn(() =>
          JSON.stringify({
            profile: {
              last_used: "Profile 5",
              info_cache: {
                Default: {},
                "Profile 2": {},
                "Profile 5": {}
              }
            }
          })
        )
      };
    });
    Object.defineProperty(process, "platform", {
      value: "darwin"
    });
    process.env.ZYLO_YTDLP_COOKIE_BROWSERS = "chrome";

    const { buildYtDlpAttempts } = await import("@/lib/import-pipeline-media");
    const attempts = buildYtDlpAttempts(
      "https://www.instagram.com/p/DQoxEeJgbUa/",
      {
        dumpSingleJson: true,
        skipDownload: true,
        noCheckCertificates: true,
        noWarnings: true
      },
      "login required"
    );

    expect(attempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "cookies:chrome",
          flags: expect.objectContaining({
            cookiesFromBrowser: "chrome"
          })
        }),
        expect.objectContaining({
          label: "cookies:chrome:Profile 5",
          flags: expect.objectContaining({
            cookiesFromBrowser: "chrome:Profile 5"
          })
        }),
        expect.objectContaining({
          label: "cookies:chrome:Default",
          flags: expect.objectContaining({
            cookiesFromBrowser: "chrome:Default"
          })
        })
      ])
    );
    expect(
      attempts.findIndex((attempt) => attempt.label === "cookies:chrome:Profile 5")
    ).toBeLessThan(
      attempts.findIndex((attempt) => attempt.label === "cookies:chrome:Default")
    );
  });

  it("keeps cookie-file retries enabled even when browser-cookie probing is disabled", async () => {
    process.env.ZYLO_YTDLP_COOKIES_FILE = "/tmp/all-cookies.txt";
    process.env.ZYLO_YTDLP_DISABLE_BROWSER_COOKIES = "1";

    const { buildYtDlpAttempts } = await import("@/lib/import-pipeline-media");
    const attempts = buildYtDlpAttempts(
      "https://www.instagram.com/p/DLFBmZ2sUCx/",
      {
        dumpSingleJson: true,
        skipDownload: true,
        noCheckCertificates: true,
        noWarnings: true
      },
      "login required"
    );

    expect(attempts).toEqual([
      expect.objectContaining({
        label: "direct"
      }),
      expect.objectContaining({
        label: "cookie-file:all:/tmp/all-cookies.txt",
        flags: expect.objectContaining({
          cookies: "/tmp/all-cookies.txt"
        })
      })
    ]);
  });

  it("classifies instagram auth errors explicitly", async () => {
    const { isYtDlpAuthError } = await import("@/lib/import-pipeline-media");

    expect(
      isYtDlpAuthError(
        "ERROR: [Instagram] Requested content is not available, rate-limit reached or login required. Use --cookies-from-browser"
      )
    ).toBe(true);
    expect(isYtDlpAuthError("network timeout")).toBe(false);
  });

  it("surfaces cookie-backed retries after a direct auth failure has already been attempted", async () => {
    process.env.ZYLO_YTDLP_COOKIES_FILE = "/tmp/all-cookies.txt";
    const { getPendingYtDlpAttempts } = await import("@/lib/import-pipeline-media");
    const attempts = getPendingYtDlpAttempts({
      url: "https://www.instagram.com/p/DLFBmZ2sUCx/",
      flags: {
        dumpSingleJson: true,
        skipDownload: true,
        noCheckCertificates: true,
        noWarnings: true
      },
      priorError:
        "Requested content is not available, rate-limit reached or login required. Use --cookies-from-browser",
      attemptedLabels: ["direct"]
    });

    expect(attempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "cookie-file:all:/tmp/all-cookies.txt",
          flags: expect.objectContaining({
            cookies: "/tmp/all-cookies.txt"
          })
        }),
        expect.objectContaining({
          label: expect.stringContaining("cookies:"),
          flags: expect.objectContaining({
            cookiesFromBrowser: expect.any(String)
          })
        })
      ])
    );
    expect(attempts.some((attempt) => attempt.label === "direct")).toBe(false);
  });
});
