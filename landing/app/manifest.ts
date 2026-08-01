import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgriTek — Raspberry Exception Desk",
    short_name: "AgriTek",
    description:
      "Private pilot for controlled raspberry replacement-load coordination into Spain.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C0904",
    theme_color: "#E8C870",
    orientation: "portrait",
    categories: ["business", "productivity"],
    lang: "en",
    icons: [
      {
        src: "/favicon-16.png",
        sizes: "16x16",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
