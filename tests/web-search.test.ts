import { searchPlaceContextWeb } from "@/lib/providers/web-search";

describe("searchPlaceContextWeb", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("parses DuckDuckGo HTML result titles, snippets, and resolved URLs", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        `
          <html>
            <body>
              <div class="result results_links results_links_deep web-result">
                <div class="links_main links_deep result__body">
                  <h2 class="result__title">
                    <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fenglish.shanghai.gov.cn%2Fen-CityTour%2Fendless-spiral.html">Five recommended Mobius strip-inspired attractions in Shanghai</a>
                  </h2>
                  <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fenglish.shanghai.gov.cn%2Fen-CityTour%2Fendless-spiral.html">On Pudong New Area's Yaoti Road, the red Giant Double Spiral Tower, known as the &quot;Endless Spiral&quot;, captivates onlookers.</a>
                </div>
              </div>
            </body>
          </html>
        `,
        { status: 200, headers: { "Content-Type": "text/html" } }
      )
    ) as typeof fetch;

    const results = await searchPlaceContextWeb('"Endless Spiral" Shanghai');

    expect(results).toEqual([
      {
        title: "Five recommended Mobius strip-inspired attractions in Shanghai",
        snippet:
          `On Pudong New Area's Yaoti Road, the red Giant Double Spiral Tower, known as the "Endless Spiral", captivates onlookers.`,
        url: "https://english.shanghai.gov.cn/en-CityTour/endless-spiral.html",
        domain: "english.shanghai.gov.cn"
      }
    ]);
  });
});
