import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

// Typography
const serif = Cormorant_Garamond({ 
  subsets: ["latin"], 
  weight: ["300", "400", "600"], 
  variable: "--font-serif" 
});

const sans = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans" 
});

// Domain URL (defaults to iwahh.com or your Vercel deployment URL)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iwahh.in";

// SEO & Search Metadata
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "iwahh | Luxury Niche & Arabic Perfumes | Formulated for Kerala Humidity",
    template: "%s | iwahh",
  },
  description:
    "Discover iwahh. Luxury Extraits de Parfum and rich Arabian Oud blends designed for 12+ hour performance in tropical weather. Handcrafted in Kerala, India.",
  
  keywords: [
    // Brand
    "iwahh",
    "iwahh perfume",
    "iwahh fragrance",
    "iwahh official store",
    "iwahh extrait de parfum",
    
    // Kerala & Regional
    "luxury perfume brand Kerala",
    "best long lasting perfume in Kerala",
    "perfume online delivery Kerala",
    "buy niche perfumes online Kochi",
    "perfume store Calicut",
    "perfume store Trivandrum",
    
    // Arabic & Middle Eastern Notes
    "Arabic perfumes Kerala",
    "long lasting Arabic fragrance Kerala",
    "buy Dehn Al Oud Kerala",
    "smokey Arabian Oud perfume India",
    "beast mode Arabic perfumes India",
    "sweet amber musk perfume",
    "vanilla oud gourmand perfume",
    "alcohol free Arabic attar India",
    
    // Humid Weather & Longevity
    "best perfume for humid weather India",
    "monsoon proof long lasting perfumes",
    "sweat resistant perfumes for men",
    "high projection tropical fragrance",
    "30 percent concentration extrait de parfum",
  ],

  authors: [{ name: "iwahh" }],
  creator: "iwahh",
  publisher: "iwahh",
  
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "iwahh | Luxury Niche & Arabic Perfumes",
    description:
      "Experience iwahh — high-concentration Extraits de Parfum and intense Arabian Oud blends built to last in tropical humidity.",
    url: siteUrl,
    siteName: "iwahh",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "iwahh Luxury Fragrance Collection",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "iwahh | Luxury Niche & Arabic Perfumes",
    description:
      "Handcrafted Extraits de Parfum and Arabian Oud blends designed for high performance in humid tropical weather.",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "PerfumeStore",
    "name": "iwahh",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "description": "iwahh is a luxury niche perfume house based in Kerala, India. We specialize in high-concentration Extraits de Parfum, Arabian Oud, and rich attars engineered for extreme longevity in humid weather.",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Kerala",
      "addressCountry": "IN"
    },
    "priceRange": "₹₹₹",
    "currenciesAccepted": "INR",
    "knowsAbout": [
      "Niche Perfumes",
      "Arabic Perfumes",
      "Dehn Al Oud",
      "Extrait de Parfum",
      "Attars",
      "Tropical Climate Fragrances",
      "iwahh"
    ]
  };

  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#0a0d0a] text-slate-100 antialiased selection:bg-amber-500/20 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}