export const SITE = {
  name: "IWAHH",
  legalName: "IWAHH Parfums",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://iwahh.in").replace(/\/+$/, ""),
  
  // Refined, high-converting brand description for human readers and AI crawlers
  description:
    "IWAHH creates luxury perfumes in limited batches, built for strong projection and long-lasting wear in humid climates.",
  
  // Primary Slogan
  tagline: "The most addictive fragrance was never meant for a bottle.",
  
  // Secondary / Alternative Brand Slogans (for banners, ads, and landing pages)
  slogans: [
    "The most addictive fragrance was never meant for a bottle.",
    "Haute parfumerie, engineered for tropical heat.",
    "Dark red reserves. Unapologetic presence.",
    "Grasse craftsmanship, bottled for the Indian sun.",
    "A silent statement that lingers before you arrive.",
  ],

  locale: "en_IN",
  currency: "INR",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ,

  // High-performance SEO & GEO keyword ecosystem
  keywords: [
    // Core Brand Keywords
    "IWAHH",
    "IWAHH perfume",
    "IWAHH Parfums",
    "IWAHH luxury fragrance",
    "IWAHH official store",

    // Primary High-Intent E-Commerce
    "buy perfume online India",
    "luxury perfume India",
    "niche fragrance brand India",
    "extrait de parfum India",
    "small batch artisanal perfume",
    "unisex luxury EDP India",

    // Kerala & Tropical Climate SEO
    "best perfume for humid weather India",
    "long lasting perfume Kerala",
    "sweat proof fragrance for men",
    "monsoon proof long lasting perfumes",
    "high projection luxury perfume Kochi",
    "buy niche perfumes online Calicut",

    // Scent Profiles & Middle Eastern / Arabic Notes
    "Grasse formulated perfumes India",
    "smokey Arabian Oud perfume",
    "Dehn Al Oud Kerala",
    "intense amber musk perfume",
    "sweet vanilla oud gourmand",
    "alcohol free attar oil India",

    // Luxury Attributes & Search Intent
    "30 percent concentration perfume",
    "beast mode projection perfumes India",
    "discovery set perfume box",
    "gift perfumes for men and women India",
  ],
};

export const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";

/* Date the static pages last changed. Update when editing core content. */
export const SITE_UPDATED = "2026-11-01";