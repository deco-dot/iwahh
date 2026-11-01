"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollProgress } from "@/app/components/ScrollFX";
import { db } from "@/app/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { PRODUCTS as DEFAULT_PRODUCTS, type Product } from "@/app/lib/products";
import {
  Minus,
  Plus,
  X,
  ShoppingBag,
  Sparkles,
  Droplets,
  FlaskConical,
  ShieldCheck,
  ArrowRight,
  Star,
  Check,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE = [0.22, 1, 0.36, 1] as const;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ── Frame sequence config ─────────────────────────────────────────── */
const TOTAL_FRAMES = 239; // frame_000000.webp … frame_000238.webp
const FRAME_DIR = "https://mdpldfpxetgmrtjhcjxr.supabase.co/storage/v1/object/public/bottle-frame/";

function frameUrl(i: number) {
  return `${FRAME_DIR}frame_${String(i).padStart(6, "0")}.webp`;
}

/* ── Design tokens + custom CSS ────────────────────────────────────── */
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap');

.ix-root {
  font-family: 'Jost', system-ui, sans-serif;
  --bg: #070303;
  --surface: #120505;
  --fg: #f7f2ee;
  --accent: #720000;
  --accent-light: #b3122a;
  --accent-hover: #8e0a14;
  --champagne: #e9cfa9;
  --ink-90: rgba(247, 242, 238, 0.95);
  --ink-60: rgba(247, 242, 238, 0.65);
  --ink-50: rgba(247, 242, 238, 0.5);
  --ink-40: rgba(247, 242, 238, 0.4);
  --ink-20: rgba(247, 242, 238, 0.2);
  --ink-10: rgba(247, 242, 238, 0.1);
  --glass: linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.015));
  --panel: linear-gradient(160deg, #1b0808 0%, #0f0404 100%);
}
.ix-root .font-serif {
  font-family: 'Bodoni Moda', 'Times New Roman', serif !important;
  font-weight: 400;
}
.ix-root ::selection { background: #720000; color: #fff; }

/* soft glass surface with a lit top edge */
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
/* primary pill button */
.ix-root .btn-primary {
  background: linear-gradient(135deg, #a3081c 0%, #720000 60%, #560000 100%);
  box-shadow: 0 10px 30px rgba(114,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22);
  transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s;
}
.ix-root .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(179,18,42,0.55), inset 0 1px 0 rgba(255,255,255,0.3);
}
.ix-root .btn-ghost {
  border: 1px solid rgba(247,242,238,0.22);
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(10px);
  transition: background .4s, border-color .4s, transform .4s cubic-bezier(.22,1,.36,1);
}
.ix-root .btn-ghost:hover {
  background: rgba(179,18,42,0.28);
  border-color: rgba(179,18,42,0.7);
  transform: translateY(-2px);
}
/* arch frame for bottles */
.ix-root .arch {
  border-radius: 999px 999px 28px 28px;
}
.ix-root .grain::after {
  content: "";
  position: absolute; inset: 0; pointer-events: none; opacity: .06; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.ix-root .text-shimmer {
  background: linear-gradient(100deg, #f7f2ee 20%, #e9cfa9 45%, #f7f2ee 70%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
@media (prefers-reduced-motion: reduce) {
  .ix-root .motion-bounce { animation: none !important; }
}
.ix-root :focus-visible { outline: 2px solid var(--champagne); outline-offset: 3px; }
`;

function CodeBottle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 90" fill="none" stroke="currentColor" strokeWidth="1.2" className={className}>
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md"
          />
          <motion.aside
            role="dialog"
            aria-label={title}
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="panel fixed right-3 top-3 bottom-3 z-[60] flex w-[calc(100%-1.5rem)] max-w-sm flex-col overflow-hidden rounded-[1.5rem] text-[var(--fg)]"
          >
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="font-serif text-xl text-[var(--fg)]">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--ink-60)] transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Scroll-synced bottle frame canvas ───────────────────────────────
   Outer div is 400vh — sticky canvas stays in viewport while user scrubs.
   GSAP ScrollTrigger drives frameRef.current.index 0 → 238 via scrub.
   ─────────────────────────────────────────────────────────────────── */
function BottleFrameSequence({ onRevealDone }: { onRevealDone: () => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef({ index: 0 });
  const revealFiredRef = useRef(false);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imagesRef.current[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(W / iw, H / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (W - sw) / 2;
    const sy = (H - sh) / 2;

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, sx, sy, sw, sh);
  }, []);

  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new (window as any).Image();
      img.src = frameUrl(i);
      img.onload = () => {
        if (i === 0) drawFrame(0);
      };
      imgs.push(img);
    }
    imagesRef.current = imgs;
    if (imgs[0]?.complete) drawFrame(0);
    return () => {
      imgs.forEach((img) => {
        img.onload = null;
      });
    };
  }, [drawFrame]);

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const tl = gsap.to(frameRef.current, {
        index: TOTAL_FRAMES - 1,
        ease: "none",
        onUpdate() {
          const idx = Math.round(frameRef.current.index);
          drawFrame(idx);
          if (!revealFiredRef.current && idx >= Math.floor(TOTAL_FRAMES * 0.6)) {
            revealFiredRef.current = true;
            onRevealDone();
          }
        },
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        },
      });

      const onResize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawFrame(Math.round(frameRef.current.index));
      };
      window.addEventListener("resize", onResize);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: wrapperRef }
  );

  return (
    <div ref={wrapperRef} className="relative h-[400vh] w-full">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <canvas ref={canvasRef} id="bottle-canvas" className="absolute inset-0 h-full w-full" style={{ display: "block" }} />
        {/* Scrims */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(7,3,3,0.65)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-[#070303] via-[#070303]/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[22vh] bg-gradient-to-b from-[#070303]/85 to-transparent" />
      </div>
    </div>
  );
}

/* ── Product card: no box, no border. Transparent bottle floats on the page ── */
function ProductCard({
  prod,
  onAdd,
  tall = false,
}: {
  prod: Product;
  onAdd: (id: string, name: string) => void;
  tall?: boolean;
}) {
  const notes = prod.notes?.slice(0, 3).join(", ") || prod.category;
  return (
    <article className="product-card group relative flex flex-col items-center text-center">
      {/* soft light behind the bottle (blurred, no edge) */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b3122a]/20 blur-[70px] transition-opacity duration-700 group-hover:opacity-100 opacity-50" />

      <Link
        href={`/product/${prod.id}`}
        className={`relative block w-full ${tall ? "h-64 md:h-80" : "h-56 md:h-72"}`}
      >
        {prod.image ? (
          <Image
            src={prod.image}
            alt={prod.name}
            fill
            sizes="(max-width: 768px) 80vw, 30vw"
            className="object-contain object-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-out group-hover:-translate-y-2 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CodeBottle className="h-32 w-20 text-[var(--fg)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        )}
      </Link>

      <div className="relative z-10 mt-4 flex w-full flex-col items-center">
        <div className="flex items-center gap-0.5 text-[var(--champagne)]">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={10} fill="currentColor" stroke="none" />
          ))}
        </div>
        <h4 className="mt-2 font-serif text-xl text-[var(--fg)]">
          <Link href={`/product/${prod.id}`}>{prod.name}</Link>
        </h4>
        <p className="mt-1 max-w-[16rem] text-xs font-light text-[var(--ink-50)]">{notes}</p>

        <div className="mt-4 flex items-center gap-4">
          <span className="font-mono text-sm tracking-wide text-[var(--fg)]">{inr(prod.price)}</span>
          <button
            onClick={() => onAdd(prod.id, prod.name)}
            className="btn-primary flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white"
          >
            <Plus size={12} />
            Add to bag
          </button>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [bagOpen, setBagOpen] = useState(false);
  const [revealDone, setRevealDone] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[];
          setProducts(list);
        }
      } catch (e) {
        console.error("Firestore read fallback to mock products:", e);
      }
    })();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const changeQty = (id: string, d: number) => {
    setCart((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + d };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  };

  const addToCart = (id: string, name: string) => {
    changeQty(id, 1);
    setAddedToast(name);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setAddedToast(null), 2500);
  };

  const cartItems = products.filter((p) => cart[p.id]);
  const bagCount = cartItems.reduce((n, p) => n + cart[p.id], 0);

  /* Reveal for content sections */
  useGSAP(
    () => {
      const q = gsap.utils.selector(rootRef) as (sel: string) => HTMLElement[];

      q(".cinematic-text").forEach((sub) => {
        gsap.fromTo(
          sub,
          { opacity: 0, y: 35, filter: "blur(4px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: { trigger: sub, start: "top 85%" },
          }
        );
      });

      const cards = q(".product-card");
      gsap.set(cards, { opacity: 0, y: 40 });
      ScrollTrigger.batch(cards, {
        start: "top 90%",
        onEnter: (b) =>
          gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.15 }),
      });
    },
    { scope: rootRef }
  );

  /* Hero text plays on page load so it is visible from the first frame */
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

  const pillars = [
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

  return (
    <div ref={rootRef} className="ix-root bg-[var(--bg)] text-[var(--fg)] antialiased selection:bg-[#720000] selection:text-white">
      <style>{FONTS}</style>
      <SmoothScroll />
      <ScrollProgress />

      {/* Ambient crimson aura */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(179,18,42,0.2),transparent)]" />

      {/* Added-to-bag toast */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="glass fixed bottom-6 right-4 z-[70] flex items-center gap-3 rounded-full py-2.5 pl-2.5 pr-5 text-sm text-white md:right-8"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#720000]">
              <Check size={15} />
            </span>
            <span>
              <strong className="font-medium">{addedToast}</strong> added to bag
            </span>
            <button onClick={() => setBagOpen(true)} className="ml-1 rounded-full bg-white/10 px-3 py-1 text-xs transition hover:bg-white/20">
              View bag
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING PILL NAV ─────────────────────────────────────────────── */}
      <nav className="glass fixed left-1/2 top-3 z-[55] flex h-12 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 items-center justify-between rounded-full px-2.5 pl-5 text-xs text-[var(--ink-60)] md:h-14 md:pl-6">
        <Link href="/shop" className="transition-colors hover:text-white">
          Shop
        </Link>
        <Link href="/" className="font-serif text-lg tracking-[0.4em] text-white transition-colors hover:text-[var(--champagne)] md:text-xl">
          IWAHH
        </Link>
        <button
          onClick={() => setBagOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-3.5 pr-3.5 transition hover:bg-[#720000]/60 hover:text-white"
        >
          <ShoppingBag size={15} className="text-[var(--champagne)]" />
          <span>Bag</span>
          {bagCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b3122a] px-1 font-mono text-[10px] text-white">
              {bagCount}
            </span>
          )}
        </button>
      </nav>

      {/* ── HERO (400vh scroll, sticky canvas plays 239 frames) ───────────── */}
      <section className="hero-scene relative w-full" aria-label="Hero">
        <BottleFrameSequence onRevealDone={() => setRevealDone(true)} />

        <div
          className="pointer-events-none absolute inset-x-0 z-30 flex flex-col items-center justify-end pb-20 text-center"
          style={{ top: 0, height: "100vh" }}
        >
          <div className="pointer-events-auto flex flex-col items-center px-4">
            <span
              className="hero-text-overlay glass mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] text-[var(--champagne)]"
            >
              <Sparkles size={13} />
              Limited reserve, small batch
            </span>
            <h1
              className="hero-text-overlay text-shimmer select-none font-serif text-[14vw] font-light leading-none tracking-[0.12em] drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] md:text-[7vw]"
            >
              IWAHH
            </h1>
            <p className="hero-text-overlay mt-4 max-w-sm text-sm font-light text-[var(--ink-60)] md:text-base">
              Distilled in Grasse. Bottled in limited dark red reserves.
            </p>
            <div className="hero-text-overlay mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="#showcase" className="btn-primary inline-flex items-center gap-2 rounded-full px-7 py-3 text-xs font-medium text-white">
                Discover the collection
                <ArrowRight size={15} />
              </Link>
              <Link href="/shop" className="btn-ghost rounded-full px-7 py-3 text-xs text-white">
                Shop all
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="pointer-events-none absolute left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 text-xs text-[var(--ink-40)]"
          style={{ top: "calc(100vh - 64px)" }}
        >
          <span className="relative flex h-9 w-6 justify-center rounded-full border border-white/25">
            <span className="motion-bounce mt-2 h-1.5 w-1 animate-bounce rounded-full bg-[var(--champagne)]" />
          </span>
          Scroll to explore
        </div>
      </section>

      {/* ── SECTION 1: SHOWCASE ───────────────────────────────────────────── */}
      <section id="showcase" className="relative z-10 w-full bg-gradient-to-b from-[#070303] via-[#0d0404] to-[#070303] px-4 pb-16 pt-20 md:px-10 md:pb-20 md:pt-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="cinematic-text mb-10 text-center md:mb-14">
            <h2 className="font-serif text-3xl font-light text-[var(--fg)] md:text-5xl">Splendid luxury</h2>
            <p className="mx-auto mt-4 max-w-sm text-sm font-light text-[var(--ink-60)]">
              Two signatures from the current reserve, each poured in numbered batches.
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            {/* Narrative panel */}
            <div className="cinematic-text glass relative flex flex-col justify-center overflow-hidden rounded-[1.5rem] p-6 md:p-7 lg:col-span-4">
              <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#b3122a]/30 blur-[70px]" />
              <h3 className="relative font-serif text-2xl leading-[1.15] text-[var(--fg)] md:text-3xl">Fragrance notes</h3>
              <p className="relative mb-5 mt-4 text-sm font-light leading-relaxed text-[var(--ink-60)]">
                Formulated with rare botanical absolutes distilled in Grasse and aged in obsidian dark glass. Every composition is an invitation to inhabit a deeper, more evocative presence.
              </p>
              <div className="relative mb-6 flex flex-wrap gap-1.5">
                {["Cold enfleurage", "Copper distillation", "Vault maturation"].map((t) => (
                  <span key={t} className="rounded-full border border-[#b3122a]/40 bg-[#720000]/20 px-3 py-1.5 text-[11px] text-[var(--ink-90)]">
                    {t}
                  </span>
                ))}
              </div>
              <div className="relative">
                <Link href="/shop" className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-medium text-white">
                  Explore the collection
                  <ArrowRight size={15} />
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

      {/* ── SECTION 2: CRAFT PILLARS ──────────────────────────────────────── */}
      <section className="relative z-10 w-full px-4 py-12 md:px-10 md:py-16">
        <div className="panel grain relative mx-auto max-w-[1160px] overflow-hidden rounded-[1.75rem] px-5 py-10 md:rounded-[2.25rem] md:px-10 md:py-14">
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-[#b3122a]/20 blur-[100px]" />
          <div className="cinematic-text relative mb-8 text-center md:mb-10">
            <h2 className="font-serif text-2xl font-light md:text-4xl">Made slowly, on purpose</h2>
          </div>
          <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="cinematic-text glass group flex flex-col items-center rounded-[1.5rem] p-6 text-center transition-all duration-500 hover:-translate-y-1 hover:border-[#b3122a]/50"
              >
                <div className="relative mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#b3122a] to-[#4a0000] shadow-[0_0_30px_rgba(179,18,42,0.45)]">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="pointer-events-none absolute -inset-2 rounded-full border border-[#b3122a]/30" />
                </div>
                <h4 className="mb-2 font-serif text-xl text-[var(--fg)]">{title}</h4>
                <p className="max-w-[15rem] text-xs font-light leading-relaxed text-[var(--ink-60)]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CURATED RESERVES ───────────────────────────────────── */}
      <section className="relative z-10 w-full bg-gradient-to-b from-[#070303] via-[#0d0404] to-[#070303] px-4 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1160px]">
          <div className="cinematic-text mb-10 text-center md:mb-14">
            <p className="font-serif text-sm italic text-[var(--champagne)] md:text-base">Curated reserves</p>
            <h2 className="mt-3 font-serif text-3xl font-light text-[var(--fg)] md:text-5xl">Fragrance notes</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-10">
            {bottomShowcase.map((prod) => (
              <ProductCard key={prod.id} prod={prod} onAdd={addToCart} tall />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link href="/shop" className="btn-ghost inline-flex items-center gap-2 rounded-full px-7 py-3 text-xs text-white">
              View all fragrances
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ────────────────────────────────────────────────────── */}
      <section className="relative z-10 w-full px-4 pb-16 md:px-10 md:pb-20">
        <div className="glass relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] px-5 py-12 text-center md:rounded-[2.25rem] md:px-12 md:py-16">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b3122a]/25 blur-[100px]" />
          <div className="cinematic-text relative">
            <p className="mb-4 text-xs text-[var(--champagne)]">Our philosophy</p>
            <blockquote className="mb-6 font-serif text-xl font-light italic leading-relaxed text-[var(--fg)] md:text-3xl">
              &ldquo;We do not craft perfume to announce your arrival. We craft it to ensure you are remembered long after you depart.&rdquo;
            </blockquote>
            <p className="text-sm text-[var(--ink-40)]">Maison IWAHH, Grasse &amp; India</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-3 pb-3 text-xs text-[var(--ink-60)] md:px-6 md:pb-6">
        <div className="panel mx-auto max-w-[1240px] rounded-[1.75rem] px-5 pb-8 pt-12 md:rounded-[2.25rem] md:px-10">
          <div className="mx-auto mb-10 grid max-w-[1160px] grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="font-serif text-2xl tracking-[0.3em] text-white">IWAHH</h3>
              <p className="text-sm font-light leading-relaxed text-[var(--ink-40)]">
                Haute parfumerie distilled in Grasse. Crafted in small, dark red reserves for intimate longevity.
              </p>
            </div>
            <div>
              <h4 className="mb-3 font-serif text-base text-white">Navigate</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/shop" className="transition-colors hover:text-white">The collection</Link></li>
                <li><Link href="#showcase" className="transition-colors hover:text-white">Fragrance notes</Link></li>
                <li><Link href="/shop" className="transition-colors hover:text-white">Gift sets</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-serif text-base text-white">Services</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/account" className="transition-colors hover:text-white">Complimentary profiling</Link></li>
                <li><Link href="/checkout" className="transition-colors hover:text-white">Global delivery</Link></li>
                <li><Link href="/account" className="transition-colors hover:text-white">Bespoke concierge</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-serif text-base text-white">Newsletter</h4>
              <p className="mb-4 text-sm font-light text-[var(--ink-40)]">Get first access to new reserves and private previews.</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex items-center rounded-full border border-white/15 bg-black/30 p-1.5 pl-5">
                <input
                  type="email"
                  aria-label="Email address"
                  placeholder="Email address"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--ink-40)]"
                />
                <button type="submit" className="btn-primary rounded-full px-5 py-2.5 text-xs font-medium text-white">
                  Join
                </button>
              </form>
            </div>
          </div>
          <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs text-[var(--ink-40)] md:flex-row">
            <p>© 2026 IWAHH Parfums. All rights reserved.</p>
            <p>Distilled in Grasse, bottled in obsidian reserves</p>
          </div>
        </div>
      </footer>

      {/* ── BAG DRAWER ────────────────────────────────────────────────────── */}
      <Drawer open={bagOpen} title="Your bag" onClose={() => setBagOpen(false)}>
        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center text-sm text-[var(--ink-40)]">
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <ShoppingBag size={28} className="text-[#b3122a]" />
            </span>
            <span>Your bag is empty</span>
            <Link href="/shop" onClick={() => setBagOpen(false)} className="btn-primary mt-2 rounded-full px-8 py-3.5 text-sm font-medium text-white">
              Explore fragrances
            </Link>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <ul className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
              {cartItems.map((p) => (
                <li key={p.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                  <div className="relative flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#140606]">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    ) : (
                      <CodeBottle className="h-12 w-8 text-[var(--fg)] opacity-70" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-lg">{p.name}</p>
                    <p className="mt-1 font-mono text-xs text-[var(--ink-60)]">{inr(p.price * cart[p.id])}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1 text-[var(--ink-60)]">
                    <button onClick={() => changeQty(p.id, -1)} aria-label="Decrease quantity" className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white">
                      <Minus size={13} />
                    </button>
                    <span className="min-w-4 text-center font-mono text-xs text-white">{cart[p.id]}</span>
                    <button onClick={() => changeQty(p.id, 1)} aria-label="Increase quantity" className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white">
                      <Plus size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="m-3 rounded-[1.25rem] border border-white/10 bg-black/30 p-4">
              <div className="mb-4 flex items-center justify-between text-sm text-[var(--ink-60)]">
                <span>Subtotal</span>
                <span className="font-mono text-base text-white">{inr(cartItems.reduce((n, p) => n + cart[p.id] * p.price, 0))}</span>
              </div>
              <Link href="/checkout" className="btn-primary block w-full rounded-full py-4 text-center text-sm font-medium text-white">
                Proceed to checkout
              </Link>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}