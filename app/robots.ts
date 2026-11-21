import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"]
    },
    sitemap: "https://mayank198010.github.io/PDF-EDITOR/sitemap.xml",
    host: "https://mayank198010.github.io"
  };
}
