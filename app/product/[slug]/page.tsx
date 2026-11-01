"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Minus, Plus, ArrowRight, Truck, ShoppingBag, Check, X } from "lucide-react";
import { db } from "@/app/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

const EASE = [0.16, 1, 0.3, 1] as const;
const FREE_SHIPPING_INR = 5000;
const FALLBACK_IMG = "https://iili.io/nwL32Fn.png";
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

interface SizeOption {
  ml: number;
  oz: string;
  price: number;
}

const defaultSizes: SizeOption[] = [
  { ml: 50, oz: "1.7 fl. oz.", price: 11500 },
  { ml: 100, oz: "3.4 fl. oz.", price: 16500 },
];

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  notes: string[];
  tag?: string;
  concentration?: string;
  description?: string;
  images?: string[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

/* Same design tokens as the home + shop pages */
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

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.slug;

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState<SizeOption>(defaultSizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [addedToBag, setAddedToBag] = useState(false);
  const [activeView, setActiveView] = useState(0);
  const [descOpen, setDescOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [storageLoaded, setStorageLoaded] = useState(false);

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

  // Fetch product data and catalog
  useEffect(() => {
    let isMounted = true;

    async function fetchProductData() {
      if (!productId) return;
      try {
        setLoading(true);
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        const allDocsSnap = await getDocs(collection(db, "products"));
        const catalog = allDocsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        if (isMounted) setAllProducts(catalog);

        if (docSnap.exists() && isMounted) {
          const data = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(data);
          if (data.price) {
            setSelectedSize({ ml: 50, oz: "1.7 fl. oz.", price: data.price });
          }

          const related = catalog.filter((p) => p.id !== productId);
          if (isMounted) setRelatedProducts(related.slice(0, 4));
        } else if (isMounted) {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        if (isMounted) setProduct(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProductData();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!storageLoaded) return;
    localStorage.setItem("iwahh_wishlist", JSON.stringify(wishlist));
  }, [wishlist, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded || loading) return;
    localStorage.setItem("iwahh_cart", JSON.stringify(cart));

    const cartDetails = allProducts
      .filter((p) => cart[p.id])
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.id === product?.id ? selectedSize.price : p.price,
        image: p.image || FALLBACK_IMG,
        quantity: cart[p.id],
      }));

    localStorage.setItem("iwahh_cart_items", JSON.stringify(cartDetails));
  }, [cart, allProducts, product, selectedSize, storageLoaded, loading]);

  const toggleWish = (id: string) => {
    setWishlist((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const changeQty = (id: string, d: number) =>
    setCart((c) => {
      const next = { ...c, [id]: (c[id] ?? 0) + d };
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const handleAddToBag = () => {
    if (product) {
      changeQty(product.id, quantity);
      setAddedToBag(true);
      setBagOpen(true);
      setTimeout(() => setAddedToBag(false), 2200);
    }
  };

  const cartItems = allProducts.filter((p) => cart[p.id]);
  const wishlistItems = allProducts.filter((p) => wishlist.includes(p.id));
  const bagCount = cartItems.reduce((n, p) => n + cart[p.id], 0);
  const subtotal = cartItems.reduce((n, p) => n + cart[p.id] * (p.id === product?.id ? selectedSize.price : p.price), 0);
  useEffect(() => {
    setActiveView(0);
    setDescOpen(false);
  }, [productId]);

  /* Gallery: uses product.images when present, otherwise front + two close-up views of the same bottle */
  const mainSrc = product?.image || FALLBACK_IMG;
  const gallery =
    product?.images && product.images.length > 0
      ? product.images.map((src) => ({ src, zoom: 1, pos: "center" }))
      : [
          { src: mainSrc, zoom: 1, pos: "center" },
          { src: mainSrc, zoom: 2.1, pos: "50% 14%" },
          { src: mainSrc, zoom: 2.1, pos: "50% 86%" },
        ];
  const view = gallery[Math.min(activeView, gallery.length - 1)];
  const isWishlisted = product ? wishlist.includes(product.id) : false;

  const drawerClass =
    "panel fixed right-3 top-3 bottom-3 z-50 flex w-[calc(100%-1.5rem)] max-w-sm flex-col overflow-hidden rounded-[1.5rem]";
  const closeBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white";

  if (loading) {
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
        <Link href="/shop" className="btn-primary mt-6 rounded-full px-7 py-3 text-xs font-medium text-white">
          Back to shop
        </Link>
      </div>
    );
  }

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
          <Link href="/shop" className="hidden px-3 transition hover:text-white sm:block">Shop</Link>

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

      {/* ── HERO BAND: bottle + angled shapes on the left, details on the right ── */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 px-3 pt-20 md:px-6 md:pt-24"
      >
        <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1d0809] via-[#130505] to-[#0b0303] md:rounded-[2.5rem]">
          {/* angled shapes (champagne + deep crimson) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-full lg:w-[58%]">
            <div className="absolute inset-0 bg-[#e9cfa9]/[0.13] [clip-path:polygon(0_0,52%_0,0_72%)]" />
            <div className="absolute inset-0 bg-[#5a0a12]/70 [clip-path:polygon(0_100%,100%_14%,100%_46%,30%_100%)]" />
          </div>
          <div className="pointer-events-none absolute left-[12%] top-[28%] h-72 w-72 rounded-full bg-[#b3122a]/25 blur-[110px]" />

          <div className="relative grid grid-cols-1 items-center gap-6 px-5 py-10 md:px-10 md:py-14 lg:grid-cols-2 lg:gap-10">
            {/* Left: bottle + thumbnails */}
            <motion.div variants={fadeInUp} className="flex flex-col items-center">
              <div className="relative h-[20rem] w-full sm:h-[26rem] lg:h-[30rem]">
                <div className="pointer-events-none absolute bottom-3 left-1/2 h-5 w-48 -translate-x-1/2 rounded-full bg-black/70 blur-xl" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeView}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="absolute inset-0 overflow-hidden"
                  >
                    <Image
                      src={view.src}
                      alt={product.name}
                      fill
                      priority
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      className="object-contain object-center drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)] transition-transform duration-500"
                      style={{ transform: `scale(${view.zoom})`, transformOrigin: view.pos }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Thumbnails: soft tiles, active one lifts */}
              <div className="mt-5 flex items-center justify-center gap-3">
                {gallery.map((g, i) => {
                  const on = i === activeView;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveView(i)}
                      aria-label={`Show view ${i + 1}`}
                      aria-pressed={on}
                      className={`relative h-20 w-20 overflow-hidden rounded-2xl transition-all duration-500 sm:h-24 sm:w-24 ${
                        on
                          ? "-translate-y-1 bg-white/[0.12] shadow-[0_18px_40px_rgba(179,18,42,0.4)]"
                          : "bg-white/[0.05] hover:bg-white/[0.09]"
                      }`}
                    >
                      <Image
                        src={g.src}
                        alt=""
                        fill
                        unoptimized
                        sizes="96px"
                        className="object-contain p-2"
                        style={{ transform: `scale(${g.zoom})`, transformOrigin: g.pos }}
                      />
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Right: details */}
            <motion.div variants={fadeInUp} className="flex flex-col lg:pl-6">
              <div className="flex items-center gap-2 text-xs text-white/45">
                <span>{product.category}</span>
                <span>·</span>
                <span>{product.concentration || "Eau de parfum"}</span>
                {product.tag && (
                  <span className="ml-1 rounded-full bg-[#720000]/40 px-2.5 py-0.5 text-[11px] text-[var(--champagne)]">{product.tag}</span>
                )}
              </div>

              <h1 className="mt-3 font-serif text-4xl font-light text-white sm:text-5xl">{product.name}</h1>
              <p className="mt-2 font-serif text-2xl font-light text-[var(--champagne)]">{inr(selectedSize.price)}</p>

              <div className="mt-4 max-w-md">
                <p className={`text-sm font-light leading-relaxed text-white/60 ${descOpen ? "" : "line-clamp-3"}`}>
                  {product.description ||
                    "An immersive olfactory journey designed for climate and presence. Intimate, grounding and quietly unforgettable."}
                </p>
                <button
                  type="button"
                  onClick={() => setDescOpen((o) => !o)}
                  className="mt-1 text-xs text-white/80 underline underline-offset-4 transition hover:text-[var(--champagne)]"
                >
                  {descOpen ? "Show less" : "Read more"}
                </button>
              </div>

              {/* Notes */}
              {(product.notes?.length ?? 0) > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {product.notes!.map((n) => (
                    <span key={n} className="rounded-full bg-white/[0.07] px-3.5 py-1.5 text-xs text-white/75">
                      {n}
                    </span>
                  ))}
                </div>
              )}

              {/* Size: segmented control */}
              <div className="mt-5 inline-flex w-fit items-center rounded-full bg-black/30 p-1">
                {defaultSizes.map((s) => {
                  const isSelected = selectedSize.ml === s.ml;
                  return (
                    <button
                      key={s.ml}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedSize(s)}
                      className={`rounded-full px-5 py-2 text-xs transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-br from-[#a3081c] to-[#720000] font-medium text-white shadow-[0_6px_18px_rgba(114,0,0,0.55)]"
                          : "text-white/55 hover:text-white"
                      }`}
                    >
                      {s.ml} ml
                    </button>
                  );
                })}
              </div>

              {/* Quantity + add to bag + wishlist */}
              <div className="mt-4 flex max-w-md items-stretch gap-2.5">
                <div className="flex items-center gap-1 rounded-full bg-black/30 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-5 text-center font-mono text-xs text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleAddToBag}
                  className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-white"
                >
                  <AnimatePresence mode="wait">
                    {addedToBag ? (
                      <motion.div
                        key="added"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-center gap-2"
                      >
                        <Check size={15} />
                        <span>Added to bag</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-center gap-2"
                      >
                        <span>Add to bag, {inr(selectedSize.price * quantity)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => toggleWish(product.id)}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  aria-pressed={isWishlisted}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/30 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <Heart size={16} className={isWishlisted ? "fill-[#b3122a] text-[#b3122a]" : ""} />
                </motion.button>
              </div>

              {/* Stock + delivery note */}
              <div className="mt-4 max-w-md space-y-1.5 text-xs text-white/45">
                <p className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#86efac]" />
                  <span className="text-[#86efac]">In stock</span>
                  <span>· GST included</span>
                </p>
                <p className="flex items-center gap-2">
                  <Truck size={13} className="shrink-0 text-[var(--champagne)]" />
                  Free pan-India delivery in 3–5 business days
                </p>
                <p>Two discovery samples and gift packaging included. 30-day returns on unopened bottles.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── RELATED PRODUCTS ──────────────────────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <section className="relative z-10 mx-auto max-w-[1160px] px-4 py-16 md:px-10 md:py-24">
          <h2 className="mb-10 text-center font-serif text-2xl font-light text-white md:text-4xl">Related products</h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {relatedProducts.slice(0, 4).map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="group flex flex-col items-center text-center">
                <div className="relative h-44 w-full overflow-hidden rounded-[1.5rem] bg-white/[0.05] shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition-all duration-500 group-hover:-translate-y-1 group-hover:bg-white/[0.09] group-hover:shadow-[0_24px_60px_rgba(179,18,42,0.3)] sm:h-52">
                  <Image
                    src={p.image || FALLBACK_IMG}
                    alt={p.name}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 45vw, 22vw"
                    className="object-contain p-5 drop-shadow-[0_14px_18px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-4 text-sm font-medium text-white">{p.name}</h3>
                <span className="mt-1 text-xs text-white/50">{p.price ? inr(p.price) : ""}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

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
                          <p className="font-mono text-xs text-white/60">{inr(p.price)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => {
                            changeQty(p.id, 1);
                            toggleWish(p.id);
                            setWishlistOpen(false);
                            setBagOpen(true);
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
                      {cartItems.map((p) => {
                        const itemPrice = p.id === product.id ? selectedSize.price : p.price;
                        return (
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
                                <p className="font-mono text-xs text-white">{inr(itemPrice * cart[p.id])}</p>
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
                        );
                      })}
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

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-3 pb-3 md:px-6 md:pb-6">
        <div className="panel mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 rounded-[1.75rem] px-6 py-6 text-xs text-white/40 sm:flex-row md:rounded-[2.25rem] md:px-10">
          <p>© {new Date().getFullYear()} iwahh Maison de Parfum. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition hover:text-white">Privacy policy</Link>
            <Link href="/terms" className="transition hover:text-white">Terms &amp; conditions</Link>
            <span>India, INR ₹</span>
          </div>
        </div>
      </footer>
    </div>
  );
}