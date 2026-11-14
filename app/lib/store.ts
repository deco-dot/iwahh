/* Shared helpers for the shop, product page, bag and checkout.
   Put this file at app/lib/store.ts */

export const FALLBACK_IMG = "https://iili.io/nwL32Fn.png";

/* Quick-add presets in admin. Custom sizes can be any ml value. */
export const SIZE_OPTIONS: number[] = [100, 200, 300];

export const inr = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

export interface SizeOption {
  ml: number;
  price: number; // offer / selling price
  mrp?: number; // original price, shown crossed out
}

export interface StoreProduct {
  id: string;
  name: string;
  category: string;
  price: number; // single price, or the lowest size price
  mrp?: number | null; // original price for single-price products
  image: string;
  notes: string[];
  tag?: string;
  concentration?: string;
  description?: string;
  inStock?: boolean; // missing = in stock
  sizes?: SizeOption[]; // any ml value, each with its own price
}

export interface CartLine {
  key: string; // product id, or "id::ml" when a size is chosen
  product: StoreProduct;
  ml?: number;
  qty: number;
  price: number; // price of one bottle
  inStock: boolean;
}

export const isInStock = (p: StoreProduct) => p.inStock !== false;

export const sizesOf = (p: StoreProduct): SizeOption[] =>
  (p.sizes ?? []).filter((s) => s && s.ml > 0 && s.price > 0).sort((a, b) => a.ml - b.ml);

export const hasSizes = (p: StoreProduct) => sizesOf(p).length > 0;

/* The price shown on cards: lowest size price, or the single price */
export const fromPrice = (p: StoreProduct) => {
  const s = sizesOf(p);
  return s.length ? Math.min(...s.map((x) => x.price)) : p.price;
};

export const priceFor = (p: StoreProduct, ml?: number) => sizesOf(p).find((s) => s.ml === ml)?.price ?? fromPrice(p);

/* Original (crossed-out) price that goes with fromPrice(p), or undefined if no offer */
export const fromMrp = (p: StoreProduct): number | undefined => {
  const s = sizesOf(p);
  const cheapest = s.length ? s.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const price = cheapest ? cheapest.price : p.price;
  const mrp = cheapest ? cheapest.mrp : p.mrp ?? undefined;
  return mrp && mrp > price ? mrp : undefined;
};

export const discountPct = (price: number, mrp?: number) =>
  mrp && mrp > price ? Math.round((1 - price / mrp) * 100) : 0;

export const lineKey = (id: string, ml?: number) => (ml ? `${id}::${ml}` : id);

export const parseKey = (key: string): { id: string; ml?: number } => {
  const i = key.lastIndexOf("::");
  if (i < 0) return { id: key };
  const ml = Number(key.slice(i + 2));
  return ml > 0 ? { id: key.slice(0, i), ml } : { id: key };
};