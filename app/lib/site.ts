/* Put this file at app/lib/site.ts
   Add these to .env.local (and to your hosting provider's environment settings):
     NEXT_PUBLIC_SITE_URL=https://www.yourdomain.com      (no trailing slash)
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
   Optional:
     NEXT_PUBLIC_CONTACT_EMAIL=support@yourdomain.com
     NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=token-from-search-console */

export const SITE = {
  name: "IWAHH",
  legalName: "IWAHH Parfums",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://iwahh.in").replace(/\/+$/, ""),
  description:
    "IWAHH is a small-batch perfume house. Haute parfumerie distilled in Grasse and bottled in limited dark red reserves, delivered across India.",
  tagline: "The most addictive fragrance was never in a bottle.",
  locale: "en_IN",
  currency: "INR",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  keywords: [
    "IWAHH",
    "perfume India",
    "eau de parfum",
    "luxury perfume",
    "niche fragrance",
    "small batch perfume",
    "buy perfume online India",
    "unisex perfume",
  ],
};

export const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";

/* Date the static pages last changed. Update it when you edit them. */
export const SITE_UPDATED = "2026-11-01";
