import { isSafeExternalUrl, sanitizePlainText } from "@/lib/security";

type UrlMetadata = {
  title: string | null;
  description: string | null;
  rawText: string | null;
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeImportedText(value: string | null) {
  if (!value) {
    return null;
  }

  const decoded = sanitizePlainText(decodeHtmlEntities(value))
    .replace(/^\s*\d[\d.,KMB]*\s+likes?,?\s+\d[\d.,KMB]*\s+comments?\s*-\s*/i, "")
    .replace(/\s+#/g, "\n#")
    .trim();

  return decoded || null;
}

function extractMeta(html: string, key: string) {
  const propertyRegex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const contentRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`,
    "i"
  );

  return propertyRegex.exec(html)?.[1] ?? contentRegex.exec(html)?.[1] ?? null;
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? null;
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  if (!isSafeExternalUrl(url)) {
    return { title: null, description: null, rawText: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!response.ok) {
      return { title: null, description: null, rawText: null };
    }

    const html = await response.text();
    const title = normalizeImportedText(extractMeta(html, "og:title") ?? extractTitle(html) ?? "");
    const description = normalizeImportedText(
      extractMeta(html, "og:description") ?? extractMeta(html, "description") ?? ""
    );
    const rawText = [title, description].filter(Boolean).join("\n\n").trim() || null;

    return { title, description, rawText };
  } catch {
    return { title: null, description: null, rawText: null };
  } finally {
    clearTimeout(timeout);
  }
}
