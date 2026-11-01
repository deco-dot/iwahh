"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Heart, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { MOOD_FAMILIES } from "@/app/lib/products";
import { db } from "@/app/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const EASE = [0.22, 1, 0.36, 1] as const;
const SORTS = ["Featured", "Price: low to high", "Price: high to low", "Name"] as const;
type Sort = (typeof SORTS)[number];

const FREE_SHIPPING_INR = 5000;
const MIN_PRICE_INR = 2000;
const MAX_PRICE_INR = 25000;
const FALLBACK_IMG = "https://iili.io/nwL32Fn.png";
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  notes: string[];
  tag?: string;
  concentration?: string;
}

/* Same design tokens as the home page */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap');
.ix-root {
  font-family: 'Jost', system-ui, sans-serif;
  --bg: #070303; --fg: #f7f2ee; --champagne: #e9cfa9;
  --ink-90: rgba(247,242,238,.95); --ink-60: rgba(247,242,238,.65);
  --ink-50: rgba(247,242,238,.5); --ink-40: rgba(247,242,238,.4);
  --glass: linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.015));
  --panel: linear-gradient(160deg, #1b0808 0%, #0f0404 100%);
}
.ix-root .font-serif { font-family: 'Bodoni Moda','Times New Roman',serif !important; font-weight: 400; }
.ix-root ::selection { background:#720000; color:#fff; }
.ix-root .glass {
  background: var(--glass); border: 1px solid rgba(255,255,255,.09);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 20px 60px rgba(0,0,0,.5);
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
}
.ix-root .panel {
  background: var(--panel); border: 1px solid rgba(179,18,42,.22);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 30px 80px rgba(0,0,0,.55);
}
.ix-root .btn-primary {
  background: linear-gradient(135deg,#a3081c 0%,#720000 60%,#560000 100%);
  box-shadow: 0 10px 30px rgba(114,0,0,.5), inset 0 1px 0 rgba(255,255,255,.22);
  transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s;
}
.ix-root .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(179,18,42,.55), inset 0 1px 0 rgba(255,255,255,.3); }
.ix-root .btn-ghost {
  border: 1px solid rgba(247,242,238,.22); background: rgba(255,255,255,.04);
  transition: background .4s, border-color .4s;
}
.ix-root .btn-ghost:hover { background: rgba(179,18,42,.28); border-color: rgba(179,18,42,.7); }
.ix-root .text-shimmer {
  background: linear-gradient(100deg,#f7f2ee 20%,#e9cfa9 45%,#f7f2ee 70%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ix-root :focus-visible { outline: 2px solid var(--champagne); outline-offset: 3px; }
`;

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [families, setFamilies] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE_INR);
  const [sort, setSort] = useState<Sort>("Featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [storageLoaded, setStorageLoaded] = useState(false);

  const [bagOpen, setBagOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // Fetch products from Firebase Firestore
  useEffect(() => {
    async function fetchProducts() {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const items: Product[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(items);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem("iwahh_wishlist");
      const savedCart = localStorage.getItem("iwahh_cart");
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (error) {
      console.error("Error loading shopping state:", error);
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    localStorage.setItem("iwahh_wishlist", JSON.stringify(wishlist));
  }, [wishlist, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    localStorage.setItem("iwahh_cart", JSON.stringify(cart));

    if (loading) return;
    const cartDetails = products
      .filter((p) => cart[p.id])
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image || FALLBACK_IMG,
        quantity: cart[p.id],
      }));
    localStorage.setItem("iwahh_cart_items", JSON.stringify(cartDetails));
  }, [cart, products, loading, storageLoaded]);

  const toggleFamily = (f: string) => setFamilies((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));

  const toggleWish = (id: string) => {
    setWishlist((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const changeQty = (id: string, d: number) =>
    setCart((c) => {
      const next = { ...c, [id]: (c[id] ?? 0) + d };
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const addToBag = (id: string) => {
    changeQty(id, 1);
    setBagOpen(true);
  };

  const clearFilters = () => {
    setQuery("");
    setFamilies([]);
    setMaxPrice(MAX_PRICE_INR);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          (families.length === 0 || families.includes(p.category)) &&
          p.price <= maxPrice &&
          (!q || [p.name, p.category, ...(p.notes || [])].join(" ").toLowerCase().includes(q))
      )
      .sort((a, b) =>
        sort === "Price: low to high"
          ? a.price - b.price
          : sort === "Price: high to low"
          ? b.price - a.price
          : sort === "Name"
          ? a.name.localeCompare(b.name)
          : 0
      );
  }, [products, query, families, maxPrice, sort]);

  const cartItems = products.filter((p) => cart[p.id]);
  const wishlistItems = products.filter((p) => wishlist.includes(p.id));
  const bagCount = cartItems.reduce((n, p) => n + cart[p.id], 0);
  const subtotal = cartItems.reduce((n, p) => n + cart[p.id] * p.price, 0);
  const hasFilters = !!query || families.length > 0 || maxPrice < MAX_PRICE_INR;

  const filterPanel = (
    <div className="space-y-6">
      <label className="relative block">
        <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or note"
          className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-white/30 focus:border-[#b3122a]"
        />
      </label>

      <div>
        <p className="mb-3 text-xs text-[var(--champagne)]">Scent family</p>
        <div className="flex flex-wrap gap-1.5">
          {MOOD_FAMILIES.map((f) => {
            const on = families.includes(f.name);
            return (
              <button
                key={f.name}
                type="button"
                aria-pressed={on}
                onClick={() => toggleFamily(f.name)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  on
                    ? "bg-gradient-to-br from-[#a3081c] to-[#720000] font-medium text-white shadow-[0_6px_18px_rgba(114,0,0,0.5)]"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {f.icon} {f.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-xs text-[var(--champagne)]">Max price</p>
          <span className="font-serif text-base text-white">{inr(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={MIN_PRICE_INR}
          max={MAX_PRICE_INR}
          step={500}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#b3122a]"
          aria-label="Maximum price"
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/30">
          <span>{inr(MIN_PRICE_INR)}</span>
          <span>{inr(MAX_PRICE_INR)}</span>
        </div>
      </div>

      {hasFilters && (
        <button type="button" onClick={clearFilters} className="rounded-full bg-white/5 px-4 py-2 text-xs text-[var(--champagne)] transition hover:bg-white/10">
          Clear all filters
        </button>
      )}
    </div>
  );

  /* Floating drawer shell shared by bag + wishlist */
  const drawerClass =
    "panel fixed right-3 top-3 bottom-3 z-50 flex w-[calc(100%-1.5rem)] max-w-sm flex-col overflow-hidden rounded-[1.5rem]";
  const closeBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white";

  return (
    <div className="ix-root min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased selection:bg-[#720000] selection:text-white">
      <style>{STYLES}</style>

      {/* Ambient crimson aura */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(179,18,42,0.2),transparent)]" />

      {/* ── FLOATING PILL NAV ─────────────────────────────────────────────── */}
      <nav className="glass fixed left-1/2 top-3 z-40 flex h-12 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 items-center justify-between rounded-full px-2.5 pl-5 text-xs text-[var(--ink-60)] md:h-14 md:pl-6">
        <Link href="/" className="font-serif text-lg tracking-[0.4em] text-white transition-colors hover:text-[var(--champagne)] md:text-xl">
          IWAHH
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/shop" className="hidden px-3 text-white sm:block">Shop</Link>

          <button
            onClick={() => setWishlistOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 transition hover:bg-white/10 hover:text-white"
          >
            <Heart size={13} className={wishlist.length > 0 ? "fill-[#b3122a] text-[#b3122a]" : "text-[var(--champagne)]"} />
            <span className="hidden sm:inline">Wishlist</span>
            {wishlist.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b3122a] px-1 font-mono text-[10px] text-white">
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setBagOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 transition hover:bg-[#720000]/60 hover:text-white"
          >
            <ShoppingBag size={13} className="text-[var(--champagne)]" />
            <span className="hidden sm:inline">Bag</span>
            {bagCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b3122a] px-1 font-mono text-[10px] text-white">
                {bagCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="relative z-10 px-4 pb-8 pt-28 md:px-10 md:pt-32">
        <div className="mx-auto flex max-w-[1160px] flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-serif text-sm italic text-[var(--champagne)]">The iwahh collection</p>
            <h1 className="text-shimmer mt-1 font-serif text-4xl font-light leading-[1.05] sm:text-6xl">All fragrances</h1>
          </div>
          <p className="max-w-xs text-xs font-light leading-relaxed text-[var(--ink-50)]">
            Artisan botanical distillations crafted for climate and presence across India. Genderless by nature, personal by design.
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-[1160px] gap-8 px-4 pb-20 md:px-10 lg:grid-cols-[230px_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <div className="glass sticky top-24 rounded-[1.5rem] p-5">{filterPanel}</div>
        </aside>

        <section>
          {/* Toolbar */}
          <div className="glass mb-8 flex items-center justify-between gap-3 rounded-full py-2 pl-2 pr-3 text-xs text-white/50">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
                className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10 lg:hidden"
              >
                <SlidersHorizontal size={13} className="text-[var(--champagne)]" /> Filters
              </button>
              <span className="pl-2 lg:pl-4">
                {filtered.length} {filtered.length === 1 ? "fragrance" : "fragrances"}
              </span>
            </div>
            <label className="flex items-center gap-2 text-white/70">
              <span className="hidden sm:inline">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-full border border-white/10 bg-[#140606] px-3 py-1.5 text-xs text-white outline-none focus:border-[#b3122a]"
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Mobile filters */}
          <AnimatePresence initial={false}>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="overflow-hidden lg:hidden"
              >
                <div className="glass mb-8 rounded-[1.5rem] p-5">{filterPanel}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="py-24 text-center text-xs text-white/40">Loading collection…</div>
          ) : (
            <>
              {/* ── PRODUCT GRID: borderless cards, transparent bottles ── */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 sm:gap-x-8">
                {filtered.map((p, i) => {
                  const wish = wishlist.includes(p.id);
                  return (
                    <motion.article
                      layout
                      key={p.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.55, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
                      className="group relative flex flex-col items-center text-center"
                    >
                      {/* soft blurred glow behind the bottle (no edge) */}
                      <div className="pointer-events-none absolute left-1/2 top-[34%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b3122a]/20 opacity-50 blur-[60px] transition-opacity duration-700 group-hover:opacity-100" />

                      <div className="relative h-52 w-full sm:h-64">
                        <Link href={`/product/${p.id}`} aria-label={p.name} className="absolute inset-0">
                          <Image
                            src={p.image || FALLBACK_IMG}
                            alt={p.name}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-contain object-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-105"
                          />
                        </Link>

                        {p.tag && (
                          <span className="glass absolute left-0 top-0 z-10 rounded-full px-2.5 py-1 text-[10px] text-[var(--champagne)]">
                            {p.tag}
                          </span>
                        )}

                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => toggleWish(p.id)}
                          aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
                          aria-pressed={wish}
                          className="glass absolute right-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:text-white"
                        >
                          <Heart size={14} className={wish ? "fill-[#b3122a] text-[#b3122a]" : ""} />
                        </motion.button>
                      </div>

                      <div className="relative z-10 mt-4 flex w-full flex-col items-center">
                        <p className="text-[11px] text-[var(--ink-40)]">{p.category}</p>
                        <h2 className="mt-1 font-serif text-lg font-light text-white sm:text-xl">
                          <Link href={`/product/${p.id}`}>{p.name}</Link>
                        </h2>
                        <p className="mt-1 max-w-[14rem] text-xs font-light text-[var(--ink-50)]">{p.notes?.join(", ")}</p>

                        <div className="mt-3 flex items-center gap-3">
                          <span className="font-mono text-sm text-white">{inr(p.price)}</span>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => addToBag(p.id)}
                            className="btn-primary flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white"
                          >
                            <Plus size={12} /> Add to bag
                          </motion.button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="py-24 text-center">
                  <p className="font-serif text-2xl font-light text-white">No fragrances match.</p>
                  <p className="mt-2 text-xs text-white/50">Try a different family, a higher price or a shorter search.</p>
                  <button type="button" onClick={clearFilters} className="btn-primary mt-6 rounded-full px-6 py-3 text-xs font-medium text-white">
                    Clear all filters
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* ── WISHLIST DRAWER ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {wishlistOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWishlistOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            />
            <motion.aside
              role="dialog"
              aria-label="Your wishlist"
              initial={{ x: "105%" }}
              animate={{ x: 0 }}
              exit={{ x: "105%" }}
              transition={{ duration: 0.6, ease: EASE }}
              className={drawerClass}
            >
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="font-serif text-xl text-white">
                  Your wishlist <span className="text-sm text-white/40">({wishlistItems.length})</span>
                </h2>
                <button onClick={() => setWishlistOpen(false)} aria-label="Close wishlist" className={closeBtn}>
                  <X size={16} />
                </button>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <Heart size={24} className="text-[#b3122a]" />
                  </span>
                  <p className="font-serif text-xl text-white">Your wishlist is empty</p>
                  <button onClick={() => setWishlistOpen(false)} className="btn-primary rounded-full px-6 py-3 text-xs font-medium text-white">
                    Explore the collection
                  </button>
                </div>
              ) : (
                <ul className="flex-1 space-y-3 overflow-y-auto px-5 pb-5">
                  {wishlistItems.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-16 w-12 shrink-0">
                          <Image src={p.image || FALLBACK_IMG} alt={p.name} fill unoptimized className="object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-serif text-base text-white">{p.name}</p>
                          <p className="font-mono text-xs text-[var(--ink-60)]">{inr(p.price)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => {
                            addToBag(p.id);
                            toggleWish(p.id);
                          }}
                          className="btn-primary rounded-full px-3 py-1.5 text-[11px] font-medium text-white"
                        >
                          Move to bag
                        </button>
                        <button onClick={() => toggleWish(p.id)} aria-label={`Remove ${p.name}`} className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white">
                          <X size={13} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── BAG DRAWER ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {bagOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBagOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            />
            <motion.aside
              role="dialog"
              aria-label="Your bag"
              initial={{ x: "105%" }}
              animate={{ x: 0 }}
              exit={{ x: "105%" }}
              transition={{ duration: 0.6, ease: EASE }}
              className={drawerClass}
            >
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="font-serif text-xl text-white">
                  Your bag <span className="text-sm text-white/40">({bagCount})</span>
                </h2>
                <button onClick={() => setBagOpen(false)} aria-label="Close bag" className={closeBtn}>
                  <X size={16} />
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <ShoppingBag size={24} className="text-[#b3122a]" />
                  </span>
                  <p className="font-serif text-xl text-white">Your bag is empty</p>
                  <button onClick={() => setBagOpen(false)} className="btn-primary rounded-full px-6 py-3 text-xs font-medium text-white">
                    Keep browsing
                  </button>
                </div>
              ) : (
                <>
                  {/* Free shipping progress */}
                  <div className="mx-5 mb-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs">
                    <p className="text-white/70">
                      {subtotal >= FREE_SHIPPING_INR
                        ? "You’ve unlocked complimentary pan-India shipping."
                        : `Add ${inr(FREE_SHIPPING_INR - subtotal)} more for complimentary shipping.`}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        animate={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_INR) * 100)}%` }}
                        transition={{ duration: 0.6, ease: EASE }}
                        className="h-full rounded-full bg-gradient-to-r from-[#720000] to-[#e9cfa9]"
                      />
                    </div>
                  </div>

                  <ul className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
                    <AnimatePresence initial={false}>
                      {cartItems.map((p) => (
                        <motion.li
                          key={p.id}
                          layout
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 30 }}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5"
                        >
                          <div className="relative h-16 w-12 shrink-0">
                            <Image src={p.image || FALLBACK_IMG} alt={p.name} fill unoptimized sizes="48px" className="object-contain" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-2">
                              <p className="truncate font-serif text-base text-white">{p.name}</p>
                              <p className="font-mono text-xs text-white">{inr(p.price * cart[p.id])}</p>
                            </div>
                            <p className="text-[11px] text-white/40">{p.concentration || "Eau de parfum"}</p>
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1 text-white/70">
                              <button onClick={() => changeQty(p.id, -1)} aria-label={`Remove one ${p.name}`} className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white">
                                <Minus size={12} />
                              </button>
                              <span className="min-w-4 text-center font-mono text-xs text-white">{cart[p.id]}</span>
                              <button onClick={() => changeQty(p.id, 1)} aria-label={`Add one ${p.name}`} className="flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white">
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>

                  <div className="m-3 rounded-[1.25rem] border border-white/10 bg-black/30 p-4">
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-xs text-white/60">Subtotal</span>
                      <span className="font-mono text-base text-white">{inr(subtotal)}</span>
                    </div>
                    <p className="mb-4 text-[11px] text-white/35">Two complimentary samples with every order. GST included.</p>
                    <Link href="/checkout" className="btn-primary flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium text-white">
                      Proceed to checkout <ArrowRight size={14} />
                    </Link>
                  </div>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}