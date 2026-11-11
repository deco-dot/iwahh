/* Put this file at app/robots.ts  →  served at /robots.txt */
import type { MetadataRoute } from "next";
import { SITE } from "@/app/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Search engines and AI assistants may read the public shop.
        // To keep a specific AI crawler out, add another rule here, e.g.
        // { userAgent: "GPTBot", disallow: "/" }
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/checkout", "/api/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
