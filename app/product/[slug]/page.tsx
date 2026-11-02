"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Truck, ShoppingBag, Check } from "lucide-react";
import { useProducts, useCart } from "@/app/lib/useStore";
import { FALLBACK_IMG, fromPrice, hasSizes, inr, isInStock, sizesOf } from "@/app/lib/store";
import BagDrawer from "@/app/components/BagDrawer";

const EASE = [0.16, 1, 0.3, 1] as const;

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

/* Same design tokens as the home + shop pages */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap');
.ix-root {
  font-family: 'Jost', system-ui, sans-serif;
  --bg: #070303; --fg: #f7f2ee; --champagne: #e9cfa9;
  --ink-60: rgba(247,242,238,.65);
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
  transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s, opacity .3s;
}
.ix-root .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(179,18,42,.55), inset 0 1px 0 rgba(255,255,255,.3); }
.ix-root :focus-visible { outline: 2px solid var(--champagne); outline-offset: 3px; }
`;

export default function ProductClient({ params }: PageProps) {
  /* Resolve the route param without suspending */
  const [productId, setProductId] = useState<string | null>(null);
  useEffect(() => {
    Promise.resolve(params).then((resolved) => setProductId(resolved.slug));
  }, [params]);

  const { products, loading } = useProducts(); // live: stock and prices update by themselves
  const { lines, count, subtotal, add, changeQty } = useCart(products, !loading);

  const product = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);
  const related = useMemo(() => products.filter((p) => p.id !== productId).slice(0, 4), [products, productId]);

  const [selectedMl, setSelectedMl] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToBag, setAddedToBag] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setSelectedMl(null);
    setDescOpen(false);
  }, [productId]);

  if (loading || !productId) {
    return (
      <div className="ix-root flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--fg)]">
        <style>{STYLES}</style>
        <p className="text-xs text-white/40">Loading fragrance…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="ix-root flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 text-center text-[var(--fg)]">
        <style>{STYLES}</style>
        <h1 className="font-serif text-3xl font-light text-white">Fragrance not found</h1>
        <p className="mt-2 text-xs text-white/50">This fragrance may have been archived.</p>
        <Link href="/shop" className="btn-primary mt-6 rounded-full px-7 py-3.5 text-sm font-medium text-white">
          Back to shop
        </Link>
      </div>
    );
  }

  /* Sizes, price and stock for what is on screen */
  const sizes = sizesOf(product);
  const activeSize = sizes.find((s) => s.ml === selectedMl) ?? sizes[0];
  const price = activeSize ? activeSize.price : product.price;
  const inStock = isInStock(product);
  const total = price * quantity;

  const handleAdd = () => {
    if (!inStock) return;
    add(product, activeSize?.ml, quantity);
    setAddedToBag(true);
    setBagOpen(true);
    setTimeout(() => setAddedToBag(false), 2200);
  };

  const AddLabel = ({ short = false }: { short?: boolean }) => (
    <AnimatePresence mode="wait" initial={false}>
      {!inStock ? (
        <motion.span key="out">Out of stock</motion.span>
      ) : addedToBag ? (
        <motion.span key="added" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center gap-2">
          <Check size={15} /> Added
        </motion.span>
      ) : (
        <motion.span key="add" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
          {short ? "Add to bag" : `Add to bag, ${inr(total)}`}
        </motion.span>
      )}
    </AnimatePresence>
  );

  return (
    <div className="ix-root min-h-screen bg-[var(--bg)] pb-28 text-[var(--fg)] antialiased selection:bg-[#720000] selection:text-white lg:pb-0">
      <style>{STYLES}</style>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(179,18,42,0.2),transparent)]" />

      {/* Floating pill nav */}
      <nav className="glass fixed left-1/2 top-3 z-40 flex h-12 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 items-center justify-between rounded-full px-2.5 pl-5 text-xs text-[var(--ink-60)] md:h-14 md:pl-6">
        <Link href="/" className="font-serif text-lg tracking-[0.4em] text-white transition-colors hover:text-[var(--champagne)] md:text-xl">
          IWAHH
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/shop" className="px-3 py-2 transition hover:text-white">Shop</Link>
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

      {/* Hero band */}
      <motion.section initial="hidden" animate="visible" variants={staggerContainer} className="relative z-10 px-3 pt-[4.5rem] md:px-6 md:pt-24">
        <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#1d0809] via-[#130505] to-[#0b0303] md:rounded-[2.5rem]">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-full lg:w-[58%]">
            <div className="absolute inset-0 bg-[#e9cfa9]/[0.13] [clip-path:polygon(0_0,52%_0,0_72%)]" />
            <div className="absolute inset-0 bg-[#5a0a12]/70 [clip-path:polygon(0_100%,100%_14%,100%_46%,30%_100%)]" />
          </div>
          <div className="pointer-events-none absolute left-[12%] top-[20%] h-64 w-64 rounded-full bg-[#b3122a]/25 blur-[100px]" />

          <div className="relative grid grid-cols-1 items-center gap-2 px-5 pb-8 pt-6 md:px-10 md:py-14 lg:grid-cols-2 lg:gap-10">
            {/* Bottle */}
            <motion.div variants={fadeInUp} className="flex flex-col items-center">
              <div className="relative h-[17rem] w-full sm:h-[26rem] lg:h-[32rem]">
                <div className="pointer-events-none absolute bottom-2 left-1/2 h-5 w-44 -translate-x-1/2 rounded-full bg-black/70 blur-xl" />
                <Image
                  src={product.image || FALLBACK_IMG}
                  alt={product.name}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className={`object-contain object-center drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)] ${inStock ? "" : "opacity-50 grayscale"}`}
                />
                {!inStock && (
                  <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-red-500/25 px-4 py-1.5 text-xs font-medium text-red-100 ring-1 ring-red-400/40 backdrop-blur">
                    Out of stock
                  </span>
                )}
              </div>
            </motion.div>

            {/* Details */}
            <motion.div variants={fadeInUp} className="flex flex-col lg:pl-6">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
                <span>{product.category}</span>
                <span>·</span>
                <span>{product.concentration || "Eau de parfum"}</span>
                {product.tag && (
                  <span className="ml-1 rounded-full bg-[#720000]/40 px-2.5 py-0.5 text-[11px] text-[var(--champagne)]">{product.tag}</span>
                )}
              </div>

              <h1 className="mt-2 font-serif text-3xl font-light text-white sm:text-5xl">{product.name}</h1>
              <p className="mt-1.5 font-serif text-2xl font-light text-[var(--champagne)]">
                {inr(price)}
                {activeSize && <span className="ml-2 font-sans text-sm text-white/40">{activeSize.ml} ml</span>}
              </p>

              <div className="mt-3 max-w-md">
                <p className={`text-sm font-light leading-relaxed text-white/60 ${descOpen ? "" : "line-clamp-3"}`}>
                  {product.description ||
                    "An immersive olfactory journey designed for climate and presence. Intimate, grounding and quietly unforgettable."}
                </p>
                <button
                  type="button"
                  onClick={() => setDescOpen((o) => !o)}
                  className="mt-1 py-1 text-xs text-white/80 underline underline-offset-4 transition hover:text-[var(--champagne)]"
                >
                  {descOpen ? "Show less" : "Read more"}
                </button>
              </div>

              {(product.notes?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {product.notes.map((n) => (
                    <span key={n} className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs text-white/75">
                      {n}
                    </span>
                  ))}
                </div>
              )}

              {/* Sizes */}
              {hasSizes(product) && (
                <div className="mt-5 max-w-md">
                  <p className="mb-2 pl-1 text-xs text-white/50">Size</p>
                  <div role="radiogroup" aria-label="Bottle size" className="grid grid-cols-3 gap-2">
                    {sizes.map((s) => {
                      const on = s.ml === activeSize?.ml;
                      return (
                        <button
                          key={s.ml}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setSelectedMl(s.ml)}
                          className={`flex min-h-[3.5rem] flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all duration-300 ${
                            on
                              ? "bg-gradient-to-br from-[#a3081c] to-[#720000] text-white shadow-[0_8px_22px_rgba(114,0,0,0.5)]"
                              : "bg-white/[0.06] text-white/65 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className="text-sm font-medium">{s.ml} ml</span>
                          <span className="text-[11px] opacity-75">{inr(s.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity (+ add button on desktop) */}
              <div className="mt-5 flex max-w-md items-center gap-3">
                <div className="flex items-center gap-1 rounded-full bg-black/30 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="min-w-6 text-center font-mono text-sm text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!inStock}
                  className="btn-primary hidden h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 lg:flex"
                >
                  <AddLabel />
                </button>
              </div>

              {/* Stock + notes */}
              <div className="mt-4 max-w-md space-y-1.5 text-xs text-white/45">
                <p className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "animate-pulse bg-[#86efac]" : "bg-red-400"}`} />
                  <span className={inStock ? "text-[#86efac]" : "text-red-300"}>{inStock ? "In stock" : "Out of stock"}</span>
                  <span>· GST included</span>
                </p>
                <p className="flex items-center gap-2">
                  <Truck size={13} className="shrink-0 text-[var(--champagne)]" />
                  Delivery across India in 3–5 business days
                </p>
                <p>Two discovery samples and gift packaging included. 30-day returns on unopened bottles.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Related products: swipe on mobile, grid on desktop */}
      {related.length > 0 && (
        <section className="relative z-10 mx-auto max-w-[1160px] px-4 py-12 md:px-10 md:py-24">
          <h2 className="mb-6 text-center font-serif text-2xl font-light text-white md:mb-10 md:text-4xl">Related products</h2>

          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
            {related.map((p) => {
              const ok = isInStock(p);
              return (
                <Link key={p.id} href={`/product/${p.id}`} className="group flex w-40 shrink-0 snap-start flex-col items-center text-center md:w-auto">
                  <div className="relative h-44 w-full overflow-hidden rounded-[1.5rem] bg-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition-all duration-500 group-hover:-translate-y-1 group-hover:bg-white/[0.09] sm:h-52">
                    <Image
                      src={p.image || FALLBACK_IMG}
                      alt={p.name}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 160px, 22vw"
                      className={`object-contain p-5 drop-shadow-[0_14px_18px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out group-hover:scale-105 ${ok ? "" : "opacity-45 grayscale"}`}
                    />
                    {!ok && (
                      <span className="absolute left-2 top-2 rounded-full bg-red-500/25 px-2.5 py-1 text-[10px] text-red-100 ring-1 ring-red-400/30">Out of stock</span>
                    )}
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-white">{p.name}</h3>
                  <span className="mt-0.5 text-xs text-white/50">
                    {hasSizes(p) ? "From " : ""}
                    {inr(fromPrice(p))}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 px-3 pb-3 md:px-6 md:pb-6">
        <div className="panel mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 rounded-[1.75rem] px-6 py-6 text-xs text-white/40 sm:flex-row md:rounded-[2.25rem] md:px-10">
          <p>© 2026 iwahh Maison de Parfum. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="py-1 transition hover:text-white">Privacy policy</Link>
            <Link href="/terms" className="py-1 transition hover:text-white">Terms &amp; conditions</Link>
            <Link href="/shipping-returns" className="py-1 transition hover:text-white">Shipping &amp; returns</Link>
            <span>India, INR ₹</span>
          </div>
        </div>
      </footer>

      {/* Mobile sticky buy bar: price always visible, one tap to add */}
      <div
        className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-full py-1.5 pl-5 pr-1.5 lg:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[11px] text-white/45">
            {product.name}
            {activeSize ? `, ${activeSize.ml} ml` : ""}
            {quantity > 1 ? ` x${quantity}` : ""}
          </p>
          <p className="font-mono text-sm text-[var(--champagne)]">{inr(total)}</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock}
          className="btn-primary flex h-12 shrink-0 items-center justify-center rounded-full px-6 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <AddLabel short />
        </button>
      </div>

      <BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} lines={lines} count={count} subtotal={subtotal} changeQty={changeQty} />
    </div>
  );
}