/* Put this file at app/lib/seoData.ts
   Reads products on the SERVER through Firestore's public REST API (your rules already allow
   public reads on products). Used by the sitemap, llms.txt and the product page metadata. */

import { FIREBASE_PROJECT_ID } from "@/app/lib/site";

export interface SeoProduct {
  id: string;
  name: string;
  category: string;
  price: number; // single price, or the lowest size price
  highPrice: number; // highest size price (same as price when there are no sizes)
  image: string;
  notes: string[];
  description: string;
  inStock: boolean;
  sizes: { ml: number; price: number }[];
  updated?: string; // ISO date from Firestore
}

const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

/* Firestore REST wraps every value in a type tag. This unwraps it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap(v: any): any {
  if (!v || typeof v !== "object") return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return Number(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(unwrap);
  if ("mapValue" in v) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) out[k] = unwrap(val);
    return out;
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(doc: any): SeoProduct {
  const f: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields ?? {})) f[k] = unwrap(v);

  const sizes = ((f.sizes as { ml?: number; price?: number }[]) ?? [])
    .filter((s) => s && Number(s.ml) > 0 && Number(s.price) > 0)
    .map((s) => ({ ml: Number(s.ml), price: Number(s.price) }))
    .sort((a, b) => a.ml - b.ml);
  const prices = sizes.map((s) => s.price);
  const base = Number(f.price) || 0;

  return {
    id: String(doc.name).split("/").pop() as string,
    name: String(f.name ?? ""),
    category: String(f.category ?? ""),
    price: prices.length ? Math.min(...prices) : base,
    highPrice: prices.length ? Math.max(...prices) : base,
    image: String(f.image ?? ""),
    notes: Array.isArray(f.notes) ? (f.notes as string[]).filter(Boolean) : [],
    description: String(f.description ?? ""),
    inStock: f.inStock !== false,
    sizes,
    updated: doc.updateTime,
  };
}

/* All products (empty list if the project id is not set or the request fails) */
export async function getSeoProducts(): Promise<SeoProduct[]> {
  if (!FIREBASE_PROJECT_ID) return [];
  const out: SeoProduct[] = [];
  try {
    let token = "";
    for (let page = 0; page < 10; page++) {
      const url = `${BASE}/products?pageSize=300${token ? `&pageToken=${encodeURIComponent(token)}` : ""}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const json = await res.json();
      for (const d of json.documents ?? []) out.push(toProduct(d));
      token = json.nextPageToken ?? "";
      if (!token) break;
    }
  } catch (e) {
    console.error("SEO: could not load products", e);
  }
  return out.filter((p) => p.name);
}

/* One product. Returns the product, null if it does not exist, or undefined if we could not check. */
export async function getSeoProduct(id: string): Promise<SeoProduct | null | undefined> {
  if (!FIREBASE_PROJECT_ID) return undefined;
  try {
    const res = await fetch(`${BASE}/products/${encodeURIComponent(id)}`, { next: { revalidate: 600 } });
    if (res.status === 404) return null;
    if (!res.ok) return undefined;
    return toProduct(await res.json());
  } catch {
    return undefined;
  }
}
