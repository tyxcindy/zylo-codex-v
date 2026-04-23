import { fetchUrlMetadata } from "@/lib/url-metadata";

describe("fetchUrlMetadata", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("extracts readable article body text from travel blogs", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        `
          <html>
            <head>
              <title>24 Hours in Hong Kong</title>
              <meta name="description" content="A sample day in Hong Kong" />
            </head>
            <body>
              <article>
                <h1>24 Hours in Hong Kong</h1>
                <p>Start your morning at the Goldfish Market before heading to the Yuen Po Street Bird Market.</p>
                <p>Then visit the famous Man‑Mo Temple and ride the Peak Tram to Victoria Peak.</p>
                <p>Finish with Temple Street Night Market and the Star Ferry at sunset.</p>
              </article>
            </body>
          </html>
        `,
        {
          status: 200,
          headers: { "Content-Type": "text/html" }
        }
      )
    ) as typeof fetch;

    const result = await fetchUrlMetadata("https://travelersitch.com/24-hours-in-hong-kong/");

    expect(result.title).toBe("24 Hours in Hong Kong");
    expect(result.description).toBe("A sample day in Hong Kong");
    expect(result.pageText).toContain("Goldfish Market");
    expect(result.pageText).toContain("Man‑Mo Temple");
    expect(result.pageText).toContain("Victoria Peak");
    expect(result.rawText).toContain("Temple Street Night Market");
  });

  it("extracts Instagram caption text from the public embed fallback when page metadata is thin", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          `
            <html>
              <head>
                <title>Instagram</title>
              </head>
              <body>
                <main>Instagram</main>
              </body>
            </html>
          `,
          { status: 200, headers: { "Content-Type": "text/html" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          `
            <html>
              <body>
                <div class="Caption">
                  <a class="CaptionUsername" href="https://www.instagram.com/hongkong.explore/">hongkong.explore</a><br /><br />
                  Hong Kong is where every corner sparks wonder.<br /><br />
                  Take the Peak Tram to Victoria Peak, explore K11 MUSEA, and visit Hong Kong Disneyland.
                  <div class="CaptionComments">View all comments</div>
                </div>
              </body>
            </html>
          `,
          { status: 200, headers: { "Content-Type": "text/html" } }
        )
      );

    global.fetch = fetchMock as typeof fetch;

    const result = await fetchUrlMetadata("https://www.instagram.com/p/DLFBmZ2sUCx/");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.description).toContain("Hong Kong is where every corner sparks wonder");
    expect(result.pageText).toContain("Victoria Peak");
    expect(result.rawText).toContain("Hong Kong Disneyland");
  });
});
