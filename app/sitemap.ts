/* Put this file at app/sitemap.ts  →  served at /sitemap.xml
   Lists the main pages plus one entry per product, read live from your database,
   so a new product appears here by itself. */
import type { MetadataRoute } from "next";
import { SITE, SITE_UPDATED } from "@/app/lib/site";
import { getSeoProducts } from "@/app/lib/seoData";

const PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/shipping-returns", priority: 0.4, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getSeoProducts();

  const pages: MetadataRoute.Sitemap = PAGES.map((p) => ({
    url: `${SITE.url}${p.path === "/" ? "" : p.path}`,
    lastModified: SITE_UPDATED,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const items: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE.url}/product/${encodeURIComponent(p.id)}`,
    lastModified: p.updated ?? SITE_UPDATED,
    changeFrequency: "weekly",
    priority: 0.8,
    ...(p.image.startsWith("https://") ? { images: [p.image] } : {}),
  }));

  return [...pages, ...items];
}
