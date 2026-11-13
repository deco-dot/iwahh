"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollProgress } from "@/app/components/ScrollFX";
import BagDrawer from "@/app/components/BagDrawer";
import { PRODUCTS as DEFAULT_PRODUCTS } from "@/app/lib/products";
import { useProducts, useCart } from "@/app/lib/useStore";
import { fromPrice, hasSizes, inr, isInStock, type StoreProduct } from "@/app/lib/store";
import { Plus, ShoppingBag, Droplets, FlaskConical, ShieldCheck, ArrowRight, Check } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Frame sequence ────────────────────────────────────────────────── */
const TOTAL_FRAMES = 239; // frame_000000.webp … frame_000238.webp
const FRAME_ORIGIN = "https://mdpldfpxetgmrtjhcjxr.supabase.co";
const FRAME_DIR = `${FRAME_ORIGIN}/storage/v1/object/public/bottle-frame/`;
const frameUrl = (i: number) => `${FRAME_DIR}frame_${String(i).padStart(6, "0")}.webp`;

const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

/* ── Slow-connection check ─────────────────────────────────────────────
   The scroll animation downloads ~240 images. On a slow connection, a saver
   mode, an old phone or no network we skip it and show only the first image.
   This runs before the animation starts, and again while it plays. */
type Connection = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, cb: () => void) => void;
  removeEventListener?: (type: string, cb: () => void) => void;
};
const getConnection = (): Connection | undefined =>
  typeof navigator === "undefined" ? undefined : (navigator as unknown as { connection?: Connection }).connection;

function canAnimate(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (!navigator.onLine) return false;
  const c = getConnection();
  if (c?.saveData) return false;
  if (c?.effectiveType && ["slow-2g", "2g", "3g"].includes(c.effectiveType)) return false;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  if (memory && memory <= 2) return false;
  return true;
}

/* ── Design tokens + custom CSS ────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap');

.ix-root {
  font-family: 'Jost', system-ui, sans-serif;
  --bg: #070303;
  --fg: #f7f2ee;
  --champagne: #e9cfa9;
  --ink-90: rgba(247, 242, 238, 0.95);
  --ink-60: rgba(247, 242, 238, 0.65);
  --ink-50: rgba(247, 242, 238, 0.5);
  --ink-40: rgba(247, 242, 238, 0.4);
  --glass: linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.015));
  --panel: linear-gradient(160deg, #1b0808 0%, #0f0404 100%);
}
.ix-root .font-serif { font-family: 'Bodoni Moda', 'Times New Roman', serif !important; font-weight: 400; }
.ix-root ::selection { background: #720000; color: #fff; }

.ix-root .glass {
  background: var(--glass);
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.5);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.ix-root .panel {
  background: var(--panel);
  border: 1px solid rgba(179, 18, 42, 0.22);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 80px rgba(0,0,0,0.55);
}
.ix-root .btn-primary {
  background: linear-gradient(135deg, #a3081c 0%, #720000 60%, #560000 100%);
  box-shadow: 0 10px 30px rgba(114,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22);
  transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s;
}
.ix-root .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(179,18,42,0.55), inset 0 1px 0 rgba(255,255,255,0.3); }
.ix-root .btn-ghost {
  border: 1px solid rgba(247,242,238,0.22);
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(10px);
  transition: background .4s, border-color .4s, transform .4s cubic-bezier(.22,1,.36,1);
}
.ix-root .btn-ghost:hover { background: rgba(179,18,42,0.28); border-color: rgba(179,18,42,0.7); transform: translateY(-2px); }
.ix-root .grain::after {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .06; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.ix-root .text-shimmer {
  background: linear-gradient(100deg, #f7f2ee 20%, #e9cfa9 45%, #f7f2ee 70%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

/* Hero sizing. svh = the visible screen height (no jump when a phone's address bar moves);
   vh is the fallback. Animated hero scroll length: desktop 400, tablet 550, phone 800. */
.ix-root .hero-vh { height: 100vh; height: 100svh; }
.ix-root .hero-wrap { height: 400vh; }
@media (max-width: 1023px) { .ix-root .hero-wrap { height: 550vh; } }
@media (max-width: 767px)  { .ix-root .hero-wrap { height: 800vh; } }
@supports (height: 1svh) {
  .ix-root .hero-wrap { height: 400svh; }
  @media (max-width: 1023px) { .ix-root .hero-wrap { height: 550svh; } }
  @media (max-width: 767px)  { .ix-root .hero-wrap { height: 800svh; } }
}
.ix-root :focus-visible { outline: 2px solid var(--champagne); outline-offset: 3px; }
`;

function CodeBottle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 90" fill="none" stroke="currentColor" strokeWidth="1.2" className={className} aria-hidden="true">
      <rect x="20" y="6" width="20" height="4" rx="2" className="fill-[#b3122a] stroke-none" />
      <rect x="22" y="10" width="16" height="16" rx="3" className="fill-[#720000] stroke-none" />
      <rect x="25" y="26" width="10" height="5" className="fill-[#720000] stroke-none" />
      <rect x="11" y="31" width="38" height="55" rx="9" />
      <rect x="15" y="50" width="30" height="32" rx="6" className="fill-current stroke-none" opacity="0.12" />
      <rect x="22" y="58" width="16" height="12" rx="3" className="fill-[var(--fg)] stroke-none" opacity="0.85" />
      <line x1="30" y1="31" x2="30" y2="80" opacity="0.25" />
    </svg>
  );
}

function SmoothScroll() {
  useEffect(() => {
    // Phones and reduced-motion users keep normal native scrolling
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const lenis = new Lenis({ lerp: 0.07, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}

/* ── Hero picture ─────────────────────────────────────────────────────
   Always shows the first frame as a normal image (fast, and visible to search engines).
   When the connection is good, a canvas on top plays the scroll animation. If the
   connection is slow, the device lags or the network drops, it calls onSlow() and the
   page falls back to the still image only. */
function HeroVisual({ animated, onSlow }: { animated: boolean; onSlow: () => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | undefined)[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const frameRef = useRef({ index: 0 }); // animated by GSAP
  const metaRef = useRef({ total: TOTAL_FRAMES, last: -1 });
  const onSlowRef = useRef(onSlow);
  onSlowRef.current = onSlow;

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // nearest frame that has finished loading, so the bottle never freezes or blanks
    const { total } = metaRef.current;
    const loaded = loadedRef.current;
    let use = -1;
    for (let d = 0; d < total; d++) {
      const a = index - d;
      const b = index + d;
      if (a >= 0 && loaded[a]) { use = a; break; }
      if (b < total && loaded[b]) { use = b; break; }
    }
    if (use < 0) return;
    const img = framesRef.current[use];
    if (!img || img.naturalWidth === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(canvas.offsetWidth * dpr);
    const H = Math.round(canvas.offsetHeight * dpr);
    const resized = canvas.width !== W || canvas.height !== H;
    if (resized) {
      canvas.width = W;
      canvas.height = H;
    }
    if (!resized && metaRef.current.last === use) return;
    metaRef.current.last = use;

    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight); // cover-fit
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
  }, []);

  /* Load the frames: coarse first (every 8th), then fill in, a few at a time.
     Phones load every 2nd frame (half the data). */
  useEffect(() => {
    if (!animated) return;

    const step = isPhone() ? 2 : 1;
    const total = Math.ceil(TOTAL_FRAMES / step);
    metaRef.current = { total, last: -1 };
    framesRef.current = new Array(total);
    loadedRef.current = new Array(total).fill(false);

    const order: number[] = [];
    const seen = new Set<number>();
    for (const gap of [8, 4, 2, 1]) {
      for (let i = 0; i < total; i += gap) {
        if (!seen.has(i)) {
          seen.add(i);
          order.push(i);
        }
      }
    }

    const coarseTotal = Math.ceil(total / 8);
    let coarseLoaded = 0;
    let errors = 0;
    let cancelled = false;
    let flagged = false;
    let next = 0;
    let active = 0;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const MAX_PARALLEL = step === 2 ? 4 : 8;

    const slow = () => {
      if (flagged || cancelled) return;
      flagged = true;
      onSlowRef.current();
    };

    const pump = () => {
      while (!cancelled && active < MAX_PARALLEL && next < order.length) {
        const i = order[next++];
        const img: HTMLImageElement = new (window as any).Image();
        img.decoding = "async";
        active++;
        const done = () => {
          active--;
          pump();
        };
        img.onload = () => {
          framesRef.current[i] = img;
          loadedRef.current[i] = true;
          if (i % 8 === 0) coarseLoaded++;
          drawFrame(Math.round(frameRef.current.index));
          done();
        };
        img.onerror = () => {
          if (++errors >= 8) slow();
          done();
        };
        img.src = frameUrl(i * step);
      }
    };

    const start = () => {
      if (cancelled) return;
      // if the first batch of frames is not in within 8 seconds, the connection is too slow
      watchdog = setTimeout(() => {
        if (coarseLoaded < coarseTotal) slow();
      }, 8000);
      pump();
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      if (watchdog) clearTimeout(watchdog);
      window.removeEventListener("load", start);
      framesRef.current = [];
      loadedRef.current = [];
    };
  }, [animated, drawFrame]);

  /* Scroll position picks the frame */
  useGSAP(
    () => {
      if (!animated) return;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      ScrollTrigger.config({ ignoreMobileResize: true }); // ignore the phone address bar moving

      const phone = isPhone();
      const total = Math.ceil(TOTAL_FRAMES / (phone ? 2 : 1));
      let lastT = 0;
      let lagCount = 0;

      const tween = gsap.to(frameRef.current, {
        index: total - 1,
        ease: "none",
        onUpdate() {
          drawFrame(Math.round(frameRef.current.index));

          // laggy device: many slow updates in a row while scrolling → fall back to the still image
          const now = performance.now();
          const dt = now - lastT;
          lastT = now;
          if (dt > 90 && dt < 1000) lagCount++;
          else if (dt < 50) lagCount = Math.max(0, lagCount - 1);
          if (lagCount > 25) {
            lagCount = 0;
            onSlowRef.current();
          }
        },
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          scrub: phone ? 1.2 : 0.5, // higher = smoother glide
          invalidateOnRefresh: true,
        },
      });

      const onResize = () => {
        metaRef.current.last = -1;
        drawFrame(Math.round(frameRef.current.index));
      };
      window.addEventListener("resize", onResize);

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: wrapperRef, dependencies: [animated], revertOnUpdate: true }
  );

  return (
    <div ref={wrapperRef} className={`relative w-full ${animated ? "hero-wrap" : "hero-vh"}`}>
      <div className="hero-vh sticky top-0 w-full overflow-hidden">
        {/* First frame: the only picture on slow connections */}
        <Image
          src={frameUrl(0)}
          alt="IWAHH eau de parfum bottle in dark red light"
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-center"
        />
        {animated && <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />}

        {/* Scrims */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(7,3,3,0.65)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#070303] via-[#070303]/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-gradient-to-b from-[#070303]/85 to-transparent" />
      </div>
    </div>
  );
}

/* ── Product card: no box, no border. Transparent bottle floats on the page ── */
function ProductCard({ prod, onAdd, tall = false }: { prod: StoreProduct; onAdd: (p: StoreProduct) => void; tall?: boolean }) {
  const notes = prod.notes?.slice(0, 3).join(", ") || prod.category;
  const inStock = isInStock(prod);
  const sized = hasSizes(prod);

  return (
    <article className="product-card group relative flex flex-col items-center text-center">
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b3122a]/20 opacity-50 blur-[70px] transition-opacity duration-700 group-hover:opacity-100" />

      <Link href={`/product/${prod.id}`} className={`relative block w-full ${tall ? "h-60 md:h-80" : "h-52 md:h-72"}`}>
        {prod.image ? (
          <Image
            src={prod.image}
            alt={`${prod.name} perfume bottle`}
            fill
            unoptimized
            sizes="(max-width: 768px) 80vw, 30vw"
            className={`object-contain object-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-105 ${
              inStock ? "" : "opacity-45 grayscale"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CodeBottle className="h-32 w-20 text-[var(--fg)] opacity-80" />
          </div>
        )}
        {!inStock && (
          <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-red-500/20 px-3 py-1 text-[10px] font-medium text-red-200 ring-1 ring-red-400/30">
            Out of stock
          </span>
        )}
      </Link>

      <div className="relative z-10 mt-4 flex w-full flex-col items-center">
        <h3 className="font-serif text-xl text-[var(--fg)]">
          <Link href={`/product/${prod.id}`}>{prod.name}</Link>
        </h3>
        <p className="mt-1 max-w-[16rem] text-xs font-light text-[var(--ink-50)]">{notes}</p>

        <p className="mt-3 font-mono text-sm tracking-wide text-[var(--fg)]">
          {sized && <span className="mr-1 font-sans text-[11px] text-white/45">From</span>}
          {inr(fromPrice(prod))}
        </p>

        <div className="mt-3">
          {!inStock ? (
            <span className="inline-block rounded-full bg-white/10 px-5 py-2.5 text-xs text-white/50">Out of stock</span>
          ) : sized ? (
            <Link href={`/product/${prod.id}`} className="btn-primary inline-flex items-center rounded-full px-5 py-2.5 text-xs font-medium text-white">
              Select size
            </Link>
          ) : (
            <button onClick={() => onAdd(prod)} className="btn-primary flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-medium text-white">
              <Plus size={12} aria-hidden="true" />
              Add to bag
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

const PILLARS = [
  {
    icon: Droplets,
    title: "Ethical sourcing",
    text: "Centifolia blossoms and delicate botanicals, hand-harvested at first light in Grasse before the sun touches the soil.",
  },
  {
    icon: FlaskConical,
    title: "Cold distillation",
    text: "Gentle extraction in custom copper stills protects the volatile soul and nuances of each natural botanical.",
  },
  {
    icon: ShieldCheck,
    title: "Vault maturation",
    text: "Blends rest in temperature-controlled dark chambers for weeks, softening edges into skin-like warmth.",
  },
];

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live products (stock and prices follow Admin) and a bag that is saved for checkout
  const { products: liveProducts, loading } = useProducts();
  const products: StoreProduct[] = liveProducts.length > 0 ? liveProducts : (DEFAULT_PRODUCTS as unknown as StoreProduct[]);
  const { lines, count, subtotal, add, changeQty } = useCart(products, !loading);

  const [bagOpen, setBagOpen] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  /* Hero: starts as the still first image. Upgrades to the scroll animation only on a good
     connection, and drops back to the still image if things get slow or laggy. */
  const [animated, setAnimated] = useState(false);
  const jumpRef = useRef(false);

  const downgrade = useCallback(() => {
    const showcase = document.getElementById("showcase");
    // if the visitor is in the middle of the hero, move them to the next section instead of leaving them lost
    if (showcase && window.scrollY > 80 && window.scrollY < showcase.offsetTop) jumpRef.current = true;
    setAnimated(false);
  }, []);

  useEffect(() => {
    if (canAnimate()) setAnimated(true);
    const connection = getConnection();
    const onChange = () => {
      if (!canAnimate()) downgrade();
    };
    connection?.addEventListener?.("change", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      connection?.removeEventListener?.("change", onChange);
      window.removeEventListener("offline", onChange);
    };
  }, [downgrade]);

  // The hero changed height: recalculate every scroll effect below it
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (!animated && jumpRef.current) {
        jumpRef.current = false;
        document.getElementById("showcase")?.scrollIntoView();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [animated]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const addToCart = (p: StoreProduct) => {
    add(p);
    setAddedToast(p.name);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setAddedToast(null), 2500);
  };

  /* Reveal for content sections */
  useGSAP(
    () => {
      const q = gsap.utils.selector(rootRef) as (sel: string) => HTMLElement[];

      q(".cinematic-text").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 35, filter: "blur(4px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%" } }
        );
      });

      const cards = q(".product-card");
      gsap.set(cards, { opacity: 0, y: 40 });
      ScrollTrigger.batch(cards, {
        start: "top 90%",
        onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.15 }),
      });
    },
    { scope: rootRef }
  );

  /* Hero text fades in on load */
  useGSAP(
    () => {
      gsap.fromTo(
        ".hero-text-overlay",
        { opacity: 0, y: 30, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.6, ease: "power3.out", stagger: 0.15, delay: 0.2 }
      );
    },
    { scope: rootRef }
  );

  const topShowcase = products.slice(0, 2);
  const bottomShowcase = products.length >= 5 ? products.slice(2, 5) : products.slice(0, 3);

  return (
    <div ref={rootRef} className="ix-root bg-[var(--bg)] text-[var(--fg)] antialiased selection:bg-[#720000] selection:text-white">
      <style>{STYLES}</style>
      {/* Start connecting to the image host early so the first picture shows sooner */}
      <link rel="preconnect" href={FRAME_ORIGIN} crossOrigin="anonymous" />

      <SmoothScroll />
      <ScrollProgress />

      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-white px-4 py-2 text-sm text-black focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(179,18,42,0.2),transparent)]" />

      {/* Added-to-bag toast: full width at the bottom on phones */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="glass fixed bottom-4 left-3 right-3 z-[45] mx-auto flex max-w-sm items-center gap-3 rounded-full py-2.5 pl-2.5 pr-3 text-sm text-white md:left-auto md:right-8 md:mx-0"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#720000]">
              <Check size={15} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 truncate">
              <strong className="font-medium">{addedToast}</strong> added to bag
            </span>
            <button onClick={() => setBagOpen(true)} className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-xs transition hover:bg-white/20">
              View bag
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Main"
        className="glass fixed left-1/2 top-3 z-40 flex h-12 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 items-center justify-between rounded-full px-2.5 pl-5 text-xs text-[var(--ink-60)] md:h-14 md:pl-6"
      >
        <Link href="/shop" className="py-2 transition-colors hover:text-white">
          Shop
        </Link>
        <Link href="/" aria-label="IWAHH home" className="font-serif text-lg tracking-[0.4em] text-white transition-colors hover:text-[var(--champagne)] md:text-xl">
          IWAHH
        </Link>
        <button
          onClick={() => setBagOpen(true)}
          aria-label={`Open bag, ${count} items`}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-[#720000]/60 hover:text-white"
        >
          <ShoppingBag size={15} className="text-[var(--champagne)]" aria-hidden="true" />
          <span>Bag</span>
          {count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b3122a] px-1 font-mono text-[10px] text-white">{count}</span>}
        </button>
      </nav>

      <main id="main">
        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative w-full" aria-label="IWAHH">
          <HeroVisual animated={animated} onSlow={downgrade} />

          <div className="hero-vh pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col items-center justify-end pb-20 text-center">
            <div className="pointer-events-auto flex flex-col items-center px-4">
              <h1 className="hero-text-overlay text-shimmer select-none font-serif text-[16vw] font-light leading-none tracking-[0.12em] drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] md:text-[7vw]">
                IWAHH
                <span className="sr-only"> small-batch eau de parfum, delivered across India</span>
              </h1>
              <p className="hero-text-overlay mt-4 max-w-xs text-sm font-light text-[var(--ink-60)] md:max-w-sm md:text-base">
                The most addictive fragrance was never in a bottle.
              </p>
              <div className="hero-text-overlay mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link href="#showcase" className="btn-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-xs font-medium text-white">
                  Discover the collection
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link href="/shop" className="btn-ghost rounded-full px-7 py-3.5 text-xs text-white">
                  Shop
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── SHOWCASE ────────────────────────────────────────────────────── */}
        <section
          id="showcase"
          aria-labelledby="showcase-title"
          className="relative z-10 w-full bg-gradient-to-b from-[#070303] via-[#0d0404] to-[#070303] px-4 pb-16 pt-20 md:px-10 md:pb-20 md:pt-24"
        >
          <div className="mx-auto max-w-[1160px]">
            <div className="cinematic-text mb-10 text-center md:mb-14">
              <h2 id="showcase-title" className="font-serif text-3xl font-light text-[var(--fg)] md:text-5xl">
                Splendid luxury
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-sm font-light text-[var(--ink-60)]">
                Two signatures from the current reserve, each poured in numbered batches.
              </p>
            </div>

            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-6">
              <div className="cinematic-text glass relative flex flex-col justify-center overflow-hidden rounded-[1.5rem] p-6 md:p-7 lg:col-span-4">
                <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#b3122a]/30 blur-[70px]" />
                <h3 className="relative font-serif text-2xl leading-[1.15] text-[var(--fg)] md:text-3xl">Fragrance notes</h3>
                <p className="relative mb-5 mt-4 text-sm font-light leading-relaxed text-[var(--ink-60)]">
                  Formulated with rare botanical absolutes distilled in Grasse and aged in obsidian dark glass. Every composition is an invitation to inhabit a deeper, more evocative presence.
                </p>
                <ul className="relative mb-6 flex flex-wrap gap-1.5">
                  {["Cold enfleurage", "Copper distillation", "Vault maturation"].map((t) => (
                    <li key={t} className="rounded-full border border-[#b3122a]/40 bg-[#720000]/20 px-3 py-1.5 text-[11px] text-[var(--ink-90)]">
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="relative">
                  <Link href="/shop" className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-xs font-medium text-white">
                    Explore the collection
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {topShowcase.map((prod) => (
                <div key={prod.id} className="lg:col-span-4">
                  <ProductCard prod={prod} onAdd={addToCart} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CRAFT ───────────────────────────────────────────────────────── */}
        <section aria-labelledby="craft-title" className="relative z-10 w-full px-4 py-12 md:px-10 md:py-16">
          <div className="panel grain relative mx-auto max-w-[1160px] overflow-hidden rounded-[1.75rem] px-5 py-10 md:rounded-[2.25rem] md:px-10 md:py-14">
            <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-[#b3122a]/20 blur-[100px]" />
            <div className="cinematic-text relative mb-8 text-center md:mb-10">
              <h2 id="craft-title" className="font-serif text-2xl font-light md:text-4xl">
                Made slowly, on purpose
              </h2>
            </div>
            <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
              {PILLARS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="cinematic-text glass group flex flex-col items-center rounded-[1.5rem] p-6 text-center transition-all duration-500 hover:-translate-y-1 hover:border-[#b3122a]/50">
                  <div className="relative mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#b3122a] to-[#4a0000] shadow-[0_0_30px_rgba(179,18,42,0.45)]">
                      <Icon size={18} className="text-white" aria-hidden="true" />
                    </div>
                    <div className="pointer-events-none absolute -inset-2 rounded-full border border-[#b3122a]/30" />
                  </div>
                  <h3 className="mb-2 font-serif text-xl text-[var(--fg)]">{title}</h3>
                  <p className="max-w-[15rem] text-xs font-light leading-relaxed text-[var(--ink-60)]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CURATED RESERVES ────────────────────────────────────────────── */}
        <section aria-labelledby="reserves-title" className="relative z-10 w-full bg-gradient-to-b from-[#070303] via-[#0d0404] to-[#070303] px-4 py-16 md:px-10 md:py-24 ">
          <div className="mx-auto max-w-[1160px]">
            <div className="cinematic-text mb-10 text-center md:mb-14">
              <p className="font-serif text-sm italic text-[var(--champagne)] md:text-base">Curated reserves</p>
              <h2 id="reserves-title" className="mt-3 font-serif text-3xl font-light text-[var(--fg)] md:text-5xl">
                Fragrance notes
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              {bottomShowcase.map((prod) => (
                <ProductCard key={prod.id} prod={prod} onAdd={addToCart} tall />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link href="/shop" className="btn-ghost inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-xs text-white">
                View all fragrances
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── PHILOSOPHY ──────────────────────────────────────────────────── */}
        <section className="relative z-10 w-full px-4 pb-16 md:px-10 md:pb-20">
          <div className="glass relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] px-5 py-12 text-center md:rounded-[2.25rem] md:px-12 md:py-16">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b3122a]/25 blur-[100px]" />
            <figure className="cinematic-text relative">
              <figcaption className="mb-4 text-xs text-[var(--champagne)]">Our philosophy</figcaption>
              <blockquote className="mb-6 font-serif text-xl font-light italic leading-relaxed text-[var(--fg)] md:text-3xl">
                &ldquo;We do not craft perfume to announce your arrival. We craft it to ensure you are remembered long after you depart.&rdquo;
              </blockquote>
              <p className="text-sm text-[var(--ink-40)]">Maison IWAHH, Grasse &amp; India</p>
            </figure>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-3 pb-3 text-xs text-[var(--ink-60)] md:px-6 md:pb-6">
        <div className="panel mx-auto max-w-[1240px] rounded-[1.75rem] px-5 pb-8 pt-12 md:rounded-[2.25rem] md:px-10">
          <div className="mx-auto mb-10 grid max-w-[1160px] grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <p className="font-serif text-2xl tracking-[0.3em] text-white">IWAHH</p>
              <p className="text-sm font-light leading-relaxed text-[var(--ink-40)]">
                Haute parfumerie distilled in Grasse. Crafted in small, dark red reserves for intimate longevity.
              </p>
            </div>
            <nav aria-label="Shop">
              <p className="mb-3 font-serif text-base text-white">Shop</p>
              <ul className="space-y-1 text-xs">
                <li><Link href="/shop" className="inline-block py-1.5 transition-colors hover:text-white">All fragrances</Link></li>
                <li><Link href="#showcase" className="inline-block py-1.5 transition-colors hover:text-white">Featured notes</Link></li>
              </ul>
            </nav>
            <nav aria-label="Policies">
              <p className="mb-3 font-serif text-base text-white">Policies</p>
              <ul className="space-y-1 text-xs">
                <li><Link href="/shipping-returns" className="inline-block py-1.5 transition-colors hover:text-white">Shipping &amp; returns</Link></li>
                <li><Link href="/terms" className="inline-block py-1.5 transition-colors hover:text-white">Terms &amp; conditions</Link></li>
                <li><Link href="/privacy" className="inline-block py-1.5 transition-colors hover:text-white">Privacy policy</Link></li>
              </ul>
            </nav>
            <div>
              <p className="mb-3 font-serif text-base text-white">Ordering</p>
              <p className="text-sm font-light leading-relaxed text-[var(--ink-40)]">
                Choose your fragrance and send your order on WhatsApp. Delivery across India.
              </p>
            </div>
          </div>
          <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs text-[var(--ink-40)] md:flex-row">
            <p>©2026 IWAHH Parfums. All rights reserved.</p>
            <p>Distilled in Grasse, bottled in obsidian reserves</p>
          </div>
        </div>
      </footer>

      <BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} lines={lines} count={count} subtotal={subtotal} changeQty={changeQty} />
    </div>
  );
}