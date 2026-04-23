type WebSearchResult = {
  title: string;
  snippet: string;
  url: string;
  domain: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveDuckDuckGoUrl(rawUrl: string) {
  const decoded = decodeHtml(rawUrl)
    .replace(/^\/\//, "https://")
    .trim();

  try {
    const url = new URL(decoded, "https://duckduckgo.com");
    const redirectTarget = url.searchParams.get("uddg");
    const finalUrl = redirectTarget ? decodeURIComponent(redirectTarget) : url.toString();
    const finalParsedUrl = new URL(finalUrl);
    return {
      url: finalParsedUrl.toString(),
      domain: finalParsedUrl.hostname.replace(/^www\./, "")
    };
  } catch {
    return null;
  }
}

export async function searchPlaceContextWeb(query: string) {
  if (!query.trim()) {
    return [] satisfies WebSearchResult[];
  }

  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!response.ok) {
      return [] satisfies WebSearchResult[];
    }

    const html = await response.text();
    const results = Array.from(
      html.matchAll(
        /<div class="result[^"]*?">[\s\S]*?<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi
      )
    )
      .map((match) => {
        const resolvedUrl = resolveDuckDuckGoUrl(match[1] ?? "");

        if (!resolvedUrl) {
          return null;
        }

        return {
          title: decodeHtml(match[2] ?? ""),
          snippet: decodeHtml(match[3] ?? ""),
          url: resolvedUrl.url,
          domain: resolvedUrl.domain
        } satisfies WebSearchResult;
      })
      .filter((result): result is WebSearchResult => Boolean(result))
      .filter((result) => result.title && result.snippet)
      .slice(0, 5);

    return results;
  } catch {
    return [] satisfies WebSearchResult[];
  }
}
