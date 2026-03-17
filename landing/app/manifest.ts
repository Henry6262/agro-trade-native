import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgroTrade — Secure Agricultural Trading",
    short_name: "AgroTrade",
    description:
      "Blockchain-secured escrow for agricultural commodity trades. Zero blind trust. From the Balkans to the Middle East and Asia.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C0904",
    theme_color: "#E8C870",
    orientation: "portrait",
    categories: ["business", "finance", "productivity"],
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
