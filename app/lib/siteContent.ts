"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { MOOD_FAMILIES } from "@/app/lib/products";



export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface SiteContent {
  general: {
    fallbackImage: string; // shown when a product has no image
  };
  hero: {
    image: string;
    eyebrow: string;
    line1: string;
    line2: string;
    subtitle: string;
    ctaLabel: string;
    quizLabel: string;
    railText: string;
    scrollLabel: string;
  };
  marquee: string[];
  families: {
    eyebrow: string;
    title: string;
    subtitle: string;
    // "name" is used in the /shop?family= link, so it is read-only in admin
    items: { name: string; icon: string; sub: string }[];
  };
  collection: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    viewAllLabel: string;
    footnote: string;
    featuredIds: string[]; // empty = first 3 products
  };
  stats: { to: number; suffix: string; label: string }[];
  values: { icon: string; title: string; sub: string }[];
  footer: {
    brand: string;
    tagline: string;
    blurb: string;
    emailPlaceholder: string;
    copyright: string;
    instagramUrl: string;
    region: string;
    columns: FooterColumn[];
  };
}

export const DEFAULT_CONTENT: SiteContent = {
  general: {
    fallbackImage: "https://iili.io/nwL32Fn.png",
  },
  hero: {
    image: "https://iili.io/nwLe39p.png",
    eyebrow: "Invisible. Unforgettable.",
    line1: "The most addictive fragrance",
    line2: "was never in a bottle..",
    subtitle:
      " was never in a bottle. Discover your personal essence through our bespoke formulations.",
    ctaLabel: "Explore the Collection",
    quizLabel: "Find your signature quiz",
    railText: "Maison de Parfum · Grasse & India",
    scrollLabel: "Scroll",
  },
  marquee: ["Sandalwood", "Damask rose", "Bergamot", "Labdanum", "Sea salt", "Tonka bean", "Iris", "Neroli", "Vetiver", "Bourbon vanilla"],
  families: {
    eyebrow: "Follow your senses",
    title: "Every mood has a fragrance.",
    subtitle: "Six scent families. Endless ways to feel.",
    items: MOOD_FAMILIES.map((f: any) => ({ name: f.name, icon: f.icon, sub: f.sub })),
  },
  collection: {
    eyebrow: "Featured fragrances",
    titleLine1: "Find your",
    titleLine2: "signature.",
    description: "Considered compositions for every side of you. Handcrafted with botanical distillations.",
    viewAllLabel: "View all fragrances",
    footnote: "Genderless by nature. Personal by design. All fragrances are vegan and cruelty-free.",
    featuredIds: [],
  },
  // For the first two stats, a value of 0 means "count automatically"
  // (1st = number of products, 2nd = number of scent families).
  stats: [
    { to: 0, suffix: "", label: "Signature fragrances" },
    { to: 0, suffix: "", label: "Scent families" },
    { to: 100, suffix: "%", label: "Vegan & cruelty-free" },
    { to: 4, suffix: "+", label: "Weeks rested in glass" },
  ],
  values: [
    { icon: "📦", title: "On its way, on us", sub: "Complimentary pan-India shipping on orders ₹5,000+" },
    { icon: "🎁", title: "A little something extra", sub: "Two complimentary samples with every order" },
    { icon: "✨", title: "Beautifully considered", sub: "Signature gift packaging, always included" },
    { icon: "🛡️", title: "Shop with confidence", sub: "Secure checkout · 30-day unopened returns" },
  ],
  footer: {
    brand: "iwahh",
    tagline: "Leave something of yourself behind.",
    blurb: "Join our private salon to receive olfactory previews, scent essays, and priority access to limited edition batches.",
    emailPlaceholder: "Enter your email",
    copyright: "© 2026 iwahh Maison de Parfum. All rights reserved.",
    instagramUrl: "https://instagram.com",
    region: "India · INR ₹",
    columns: [
      {
        title: "The Shop",
        links: [
          { label: "All Fragrances", href: "/shop" },
          { label: "Discovery Set (6 x 2ml)", href: "/discovery" },
        ],
      },
      {
        title: "Families",
        links: [
          { label: "Woody", href: "/shop?family=Woody" },
          { label: "Floral", href: "/shop?family=Floral" },
          { label: "Citrus", href: "/shop?family=Citrus" },
          { label: "Warm Amber", href: "/shop?family=Amber" },
          { label: "Fresh Marine", href: "/shop?family=Fresh" },
          { label: "Dark Gourmand", href: "/shop?family=Gourmand" },
        ],
      },
      {
        title: "The Maison",
        links: [
          { label: "Our Story", href: "/story" },
          { label: "Sourcing & Craft", href: "/ingredients" },
          { label: "The Journal", href: "/journal" },
          { label: "Paris Boutique", href: "/boutiques" },
          { label: "Contact Us", href: "/contact" },
        ],
      },
      {
        title: "Client Care",
        links: [
          { label: "Complimentary Shipping", href: "/shipping" },
          { label: "30-Day Returns", href: "/returns" },
          { label: "Sample Matching", href: "/sample-service" },
          { label: "Frequently Asked", href: "/faq" },
          { label: "Order Status", href: "/track" },
        ],
      },
    ],
  },
};

/** Saved values win; anything missing falls back to the defaults. Arrays are replaced whole. */
function merge<T>(base: T, over: any): T {
  if (Array.isArray(base)) return (Array.isArray(over) ? over : base) as T;
  if (base && typeof base === "object") {
    const out: any = { ...base };
    for (const k of Object.keys(base as object)) {
      out[k] = merge((base as any)[k], over ? over[k] : undefined);
    }
    return out;
  }
  return (typeof over === typeof base ? over : base) as T;
}

export const CONTENT_COLLECTION = "siteContent";
export const CONTENT_DOC = "home";

export function mergeContent(saved: any): SiteContent {
  return merge(DEFAULT_CONTENT, saved);
}

/** Loads editable content from Firestore. `loaded` flips to true even if the fetch fails. */
export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, CONTENT_COLLECTION, CONTENT_DOC));
        if (alive && snap.exists()) setContent(mergeContent(snap.data()));
      } catch (e) {
        console.error("Could not load site content, using defaults:", e);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { content, loaded };
}