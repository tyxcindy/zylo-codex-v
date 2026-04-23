import { isSafeExternalUrl, sanitizePlainText } from "@/lib/security";

type UrlMetadata = {
  title: string | null;
  description: string | null;
  pageText: string | null;
  rawText: string | null;
};

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

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

function extractFirstSection(html: string, tag: string) {
  return html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? null;
}

function extractReadablePageText(html: string) {
  const primary =
    extractFirstSection(html, "article") ??
    extractFirstSection(html, "main") ??
    html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ??
    html;

  const chunks = Array.from(
    primary.matchAll(/<(p|h1|h2|h3|li)\b[^>]*>([\s\S]*?)<\/\1>/gi),
    (match) => normalizeImportedText(stripHtml(match[2] ?? ""))
  ).filter((chunk): chunk is string => Boolean(chunk));

  const filtered = chunks.filter((chunk) => {
    const normalized = chunk.toLowerCase();

    if (normalized === "contents" || normalized === "toggle") {
      return false;
    }

    if (
      normalized.startsWith("leave a comment") ||
      normalized.startsWith("save my name, email") ||
      normalized.startsWith("@2026 - ")
    ) {
      return false;
    }

    return chunk.length >= 24;
  });

  if (filtered.length > 0) {
    return filtered.slice(0, 40).join("\n\n").slice(0, 6000) || null;
  }

  return normalizeImportedText(stripHtml(primary))?.slice(0, 3000) ?? null;
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

function extractInstagramShortcode(url: string) {
  return url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([^/?#]+)/i)?.[1] ?? null;
}

function mergeUniqueTextParts(parts: Array<string | null | undefined>) {
  const uniqueParts: string[] = [];

  for (const part of parts) {
    const normalized = normalizeImportedText(part ?? "");
    if (!normalized) {
      continue;
    }

    if (uniqueParts.some((existing) => existing.includes(normalized) || normalized.includes(existing))) {
      continue;
    }

    uniqueParts.push(normalized);
  }

  return uniqueParts.join("\n\n").trim() || null;
}

async function fetchInstagramEmbedCaption(url: string) {
  const shortcode = extractInstagramShortcode(url);

  if (!shortcode) {
    return null;
  }

  try {
    const response = await fetch(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const captionHtml =
      html.match(
        /<div class="Caption">[\s\S]*?<a class="CaptionUsername"[\s\S]*?<\/a><br\s*\/?><br\s*\/?>([\s\S]*?)<div class="CaptionComments">/i
      )?.[1] ?? null;

    if (!captionHtml) {
      return null;
    }

    return normalizeImportedText(
      decodeHtmlEntities(
        captionHtml
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<a\b[^>]*>/gi, "")
          .replace(/<\/a>/gi, "")
      )
    );
  } catch {
    return null;
  }
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  if (!isSafeExternalUrl(url)) {
    return { title: null, description: null, pageText: null, rawText: null };
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
    const instagramEmbedCaption = /instagram\.com/i.test(url)
      ? await fetchInstagramEmbedCaption(url)
      : null;
    const html = response.ok ? await response.text() : "";
    const title = normalizeImportedText(extractMeta(html, "og:title") ?? extractTitle(html) ?? "");
    const description = mergeUniqueTextParts([
      extractMeta(html, "og:description") ?? extractMeta(html, "description") ?? "",
      instagramEmbedCaption
    ]);
    const pageText = mergeUniqueTextParts([extractReadablePageText(html), instagramEmbedCaption]);
    const rawText = mergeUniqueTextParts([title, description, pageText]);

    return { title, description, pageText, rawText };
  } catch {
    return { title: null, description: null, pageText: null, rawText: null };
  } finally {
    clearTimeout(timeout);
  }
}
