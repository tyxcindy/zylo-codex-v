export {};

describe("import pipeline media", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.ZYLO_YTDLP_COOKIES_FILE;
    delete process.env.ZYLO_YTDLP_COOKIE_FILES;
    delete process.env.ZYLO_YTDLP_COOKIE_BROWSERS;
    delete process.env.ZYLO_YTDLP_DISABLE_BROWSER_COOKIES;
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
