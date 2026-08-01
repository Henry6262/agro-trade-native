import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/auth/",
          "/blog/",
          "/dashboard/",
          "/stablehacks-demo-day",
        ],
      },
    ],
    sitemap: "https://agrotrade.africa/sitemap.xml",
    host: "https://agrotrade.africa",
  };
}
