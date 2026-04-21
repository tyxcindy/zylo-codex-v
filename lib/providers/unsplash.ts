import { getServerEnv } from "@/lib/env";

export async function searchUnsplashImage(query: string) {
  const { unsplashAccessKey } = getServerEnv();

  if (!unsplashAccessKey) {
    return null;
  }

  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("orientation", "landscape");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${unsplashAccessKey}`,
        "Accept-Version": "v1"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      results?: Array<{
        urls?: { regular?: string };
        user?: { name?: string };
        links?: { html?: string };
      }>;
    };

    const first = data.results?.[0];

    if (!first?.urls?.regular) {
      return null;
    }

    return {
      imageUrl: first.urls.regular,
      photographer: first.user?.name,
      attributionUrl: first.links?.html
    };
  } catch {
    return null;
  }
}
