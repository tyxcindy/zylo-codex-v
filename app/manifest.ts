import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zylo",
    short_name: "Zylo",
    description: "You save it. Zylo plans it.",
    start_url: "/",
    display: "standalone",
    background_color: "#070b13",
    theme_color: "#070b13",
    icons: []
  };
}
