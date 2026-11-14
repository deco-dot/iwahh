"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { MOOD_FAMILIES } from "@/app/lib/products";
import { useProducts, useCart } from "@/app/lib/useStore";
import { FALLBACK_IMG, fromPrice, fromMrp, discountPct, hasSizes, inr, isInStock } from "@/app/lib/store";
import BagDrawer from "@/app/components/BagDrawer";

const EASE = [0.22, 1, 0.36, 1] as const;
const SORTS = ["Featured", "Price: low to high", "Price: high to low", "Name"] as const;
type Sort = (typeof SORTS)[number];

/* Same design tokens as the home page */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap');
.ix-root {
  font-family: 'Jost', system-ui, sans-serif;
  --bg: #070303; --fg: #f7f2ee; --champagne: #e9cfa9;
  --ink-60: rgba(247,242,238,.65); --ink-50: rgba(247,242,238,.5); --ink-40: rgba(247,242,238,.4);
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
.ix-root .text-shimmer {
  background: linear-gradient(100deg,#f7f2ee 20%,#e9cfa9 45%,#f7f2ee 70%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ix-root select option { background: #140606; color: #fff; }
.ix-root :focus-visible { outline: 2px solid var(--champagne); outline-offset: 3px; }
`;

export default function ShopPage() {
  const { products, loading } = useProducts(); // live: stock and prices update by themselves
  const { lines, count, subtotal, add, changeQty } = useCart(products, !loading);

  const [query, setQuery] = useState("");
  const [families, setFamilies] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null); // null = no limit
  const [hideOut, setHideOut] = useState(false);
  const [sort, setSort] = useState<Sort>("Featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  /* slider range follows your real prices */
  const priceMax = useMemo(() => {
    const top = Math.max(0, ...products.map(fromPrice));
    return Math.max(5000, Math.ceil(top / 1000) * 1000);
  }, [products]);
  const limit = Math.min(maxPrice ?? priceMax, priceMax);

  const hasFilters = !!query || families.length > 0 || hideOut || (maxPrice !== null && maxPrice < priceMax);
  const clearFilters = () => {
    setQuery("");
    setFamilies([]);
    setMaxPrice(null);
    setHideOut(false);
  };
  const toggleFamily = (f: string) => setFamilies((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          (families.length === 0 || families.includes(p.category)) &&
          fromPrice(p) <= limit &&
          (!hideOut || isInStock(p)) &&
          (!q || [p.name, p.category, ...(p.notes || [])].join(" ").toLowerCase().includes(q))
      )
      .sort((a, b) =>
        sort === "Price: low to high"
          ? fromPrice(a) - fromPrice(b)
          : sort === "Price: high to low"
          ? fromPrice(b) - fromPrice(a)
          : sort === "Name"
          ? a.name.localeCompare(b.name)
          : 0
      );
  }, [products, query, families, limit, hideOut, sort]);

  const filterPanel = (
    <div className="space-y-6">
      <label className="relative block">
        <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or note"
          className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[#b3122a] sm:py-2.5 sm:text-xs"
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
                className={`rounded-full px-3.5 py-2 text-xs transition ${
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
          <span className="font-serif text-base text-white">{inr(limit)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={priceMax}
          step={500}
          value={limit}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#b3122a]"
          aria-label="Maximum price"
        />
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-xs text-white/70">
        Hide out of stock
        <input type="checkbox" checked={hideOut} onChange={(e) => setHideOut(e.target.checked)} className="h-4 w-4 accent-[#b3122a]" />
      </label>

      {hasFilters && (
        <button type="button" onClick={clearFilters} className="rounded-full bg-white/5 px-4 py-2 text-xs text-[var(--champagne)] transition hover:bg-white/10">
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="ix-root min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased selection:bg-[#720000] selection:text-white">
      <style>{STYLES}</style>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(179,18,42,0.2),transparent)]" />

      {/* Floating pill nav */}
      <nav className="glass fixed left-1/2 top-3 z-40 flex h-12 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 items-center justify-between rounded-full px-2.5 pl-5 text-xs text-[var(--ink-60)] md:h-14 md:pl-6">
        <Link href="/" className="font-serif text-lg tracking-[0.4em] text-white transition-colors hover:text-[var(--champagne)] md:text-xl">
          IWAHH
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/shop" className="hidden px-3 text-white sm:block">Shop</Link>
          <button
            onClick={() => setBagOpen(true)}
            aria-label={`Open bag, ${count} items`}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-[#720000]/60 hover:text-white"
          >
            <ShoppingBag size={14} className="text-[var(--champagne)]" />
            <span>Bag</span>
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b3122a] px-1 font-mono text-[10px] text-white">{count}</span>
            )}
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="relative z-10 px-4 pb-6 pt-24 md:px-10 md:pb-8 md:pt-32">
        <div className="mx-auto flex max-w-[1160px] flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="font-serif text-sm italic text-[var(--champagne)]">The iwahh collection</p>
            <h1 className="text-shimmer mt-1 font-serif text-4xl font-light leading-[1.05] sm:text-6xl">All fragrances</h1>
          </div>
          <p className="max-w-xs text-xs font-light leading-relaxed text-[var(--ink-50)]">
            Artisan botanical distillations crafted for climate and presence across India.
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
          <div className="glass mb-6 flex items-center justify-between gap-3 rounded-full py-2 pl-2 pr-3 text-xs text-white/50">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
                className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2.5 text-xs text-white/80 transition hover:bg-white/10 lg:hidden"
              >
                <SlidersHorizontal size={13} className="text-[var(--champagne)]" /> Filters
                {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-[#b3122a]" />}
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
                className="max-w-[9.5rem] rounded-full border border-white/10 bg-[#140606] px-3 py-2 text-xs text-white outline-none focus:border-[#b3122a]"
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
                <div className="glass mb-6 rounded-[1.5rem] p-5">{filterPanel}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="py-24 text-center text-xs text-white/40">Loading collection…</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-8 md:grid-cols-3">
                {filtered.map((p, i) => {
                  const inStock = isInStock(p);
                  const sized = hasSizes(p);
                  const mrp = fromMrp(p);
                  const off = discountPct(fromPrice(p), mrp);
                  return (
                    <motion.article
                      layout
                      key={p.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
                      className="group relative flex flex-col items-center text-center"
                    >
                      <div className="pointer-events-none absolute left-1/2 top-[34%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b3122a]/20 opacity-50 blur-[60px] transition-opacity duration-700 group-hover:opacity-100" />

                      <div className="relative h-48 w-full sm:h-64">
                        <Link href={`/product/${p.id}`} aria-label={p.name} className="absolute inset-0">
                          <Image
                            src={p.image || FALLBACK_IMG}
                            alt={p.name}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className={`object-contain object-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-105 ${
                              inStock ? "" : "opacity-45 grayscale"
                            }`}
                          />
                        </Link>

                        {!inStock ? (
                          <span className="absolute left-0 top-0 z-10 rounded-full bg-red-500/20 px-2.5 py-1 text-[10px] font-medium text-red-200 ring-1 ring-red-400/30">
                            Out of stock
                          </span>
                        ) : (
                          p.tag && (
                            <span className="glass absolute left-0 top-0 z-10 rounded-full px-2.5 py-1 text-[10px] text-[var(--champagne)]">
                              {p.tag}
                            </span>
                          )
                        )}

                        {inStock && off > 0 && (
                          <span className="absolute right-0 top-0 z-10 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-medium text-emerald-200 ring-1 ring-emerald-400/30">
                            {off}% off
                          </span>
                        )}
                      </div>

                      <div className="relative z-10 mt-3 flex w-full flex-col items-center">
                        <p className="text-[11px] text-[var(--ink-40)]">{p.category}</p>
                        <h2 className="mt-0.5 font-serif text-lg font-light text-white sm:text-xl">
                          <Link href={`/product/${p.id}`}>{p.name}</Link>
                        </h2>
                        <p className="mt-1 line-clamp-1 max-w-[14rem] text-xs font-light text-[var(--ink-50)]">{p.notes?.join(", ")}</p>

                        <p className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 font-mono text-sm text-white">
                          {sized && <span className="font-sans text-[11px] text-white/45">From</span>}
                          {inr(fromPrice(p))}
                          {mrp && <span className="text-xs text-white/35 line-through decoration-white/50">{inr(mrp)}</span>}
                        </p>

                        <div className="mt-3">
                          {!inStock ? (
                            <span className="inline-block rounded-full bg-white/10 px-5 py-2.5 text-xs text-white/50">Out of stock</span>
                          ) : sized ? (
                            <Link href={`/product/${p.id}`} className="btn-primary inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-medium text-white">
                              Select size
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                add(p);
                                setBagOpen(true);
                              }}
                              className="btn-primary inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-medium text-white"
                            >
                              <Plus size={12} /> Add to bag
                            </button>
                          )}
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

      <BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} lines={lines} count={count} subtotal={subtotal} changeQty={changeQty} />
    </div>
  );
}