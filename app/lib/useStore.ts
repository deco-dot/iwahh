"use client";

/* Put this file at app/lib/useStore.ts */

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { FALLBACK_IMG, isInStock, lineKey, parseKey, priceFor, type CartLine, type StoreProduct } from "@/app/lib/store";

/* Live product list: when you change stock or a price in admin, the shop and
   product pages update by themselves, no refresh needed. */
export function useProducts() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "products"),
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StoreProduct));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading products:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { products, loading };
}

/* Bag saved in the browser. Items are keyed by product + size.
   Only items that are in stock count toward the total and go to checkout. */
export function useCart(products: StoreProduct[], productsReady: boolean) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("iwahh_cart");
      if (saved) setCart(JSON.parse(saved));
      localStorage.removeItem("iwahh_wishlist"); // wishlist was removed
    } catch (e) {
      console.error("Error loading bag:", e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("iwahh_cart", JSON.stringify(cart));
  }, [cart, loaded]);

  const lines: CartLine[] = useMemo(() => {
    const out: CartLine[] = [];
    for (const [key, qty] of Object.entries(cart)) {
      const { id, ml } = parseKey(key);
      const product = products.find((p) => p.id === id);
      if (!product || qty <= 0) continue;
      out.push({ key, product, ml, qty, price: priceFor(product, ml), inStock: isInStock(product) });
    }
    return out;
  }, [cart, products]);

  const buyable = useMemo(() => lines.filter((l) => l.inStock), [lines]);
  const count = buyable.reduce((n, l) => n + l.qty, 0);
  const subtotal = buyable.reduce((n, l) => n + l.qty * l.price, 0);

  /* What the checkout page reads */
  useEffect(() => {
    if (!loaded || !productsReady) return;
    const items = buyable.map((l) => ({
      id: l.key,
      name: l.ml ? `${l.product.name} (${l.ml} ml)` : l.product.name,
      price: l.price,
      image: l.product.image || FALLBACK_IMG,
      quantity: l.qty,
    }));
    localStorage.setItem("iwahh_cart_items", JSON.stringify(items));
  }, [buyable, loaded, productsReady]);

  const add = useCallback((product: StoreProduct, ml?: number, qty = 1) => {
    if (!isInStock(product)) return;
    const key = lineKey(product.id, ml);
    setCart((c) => ({ ...c, [key]: (c[key] ?? 0) + qty }));
  }, []);

  const changeQty = useCallback((key: string, d: number) => {
    setCart((c) => {
      const next = { ...c, [key]: (c[key] ?? 0) + d };
      if (next[key] <= 0) delete next[key];
      return next;
    });
  }, []);

  return { lines, count, subtotal, add, changeQty };
}