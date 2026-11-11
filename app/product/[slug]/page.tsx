import type { Metadata } from "next";
import { Suspense } from "react";
import ProductClient from "./ProductClient";
import { SITE } from "@/app/lib/site";
import { getSeoProduct } from "@/app/lib/seoData";

type Params = Promise<{ slug: string }>;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* Per-product title, description and share picture, read on the server so Google and
   WhatsApp/Instagram previews show the real fragrance instead of a generic page. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getSeoProduct(slug);

  if (p === undefined) return {}; // could not check (e.g. env not set): keep site defaults
  if (p === null) return { title: "Fragrance not found", robots: { index: false, follow: true } };

  const from = p.sizes.length ? `From ${inr(p.price)}` : inr(p.price);
  const base =
    p.description.trim() ||
    `${p.name} is a ${p.category.toLowerCase()} eau de parfum by ${SITE.name}${p.notes.length ? `, with notes of ${p.notes.slice(0, 4).join(", ")}` : ""}.`;
  const description = `${base} ${from}. Order on WhatsApp, delivery across India.`.slice(0, 300);
  const title = `${p.name}, ${p.category} perfume`;
  const url = `/product/${encodeURIComponent(p.id)}`;
  const images = p.image.startsWith("https://") ? [{ url: p.image, alt: `${p.name} perfume bottle` }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title: `${title} | ${SITE.name}`, description, url, images },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE.name}`, description, images: images?.map((i) => i.url) },
    other: {
      "product:price:amount": String(p.price),
      "product:price:currency": SITE.currency,
      "product:availability": p.inStock ? "in stock" : "out of stock",
    },
  };
}

/* Product + breadcrumb structured data: lets Google show price and stock in results */
async function ProductJsonLd({ params }: { params: Params }) {
  const { slug } = await params;
  const p = await getSeoProduct(slug);
  if (!p) return null;

  const url = `${SITE.url}/product/${encodeURIComponent(p.id)}`;
  const availability = p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  const offers =
    p.sizes.length > 1
      ? {
          "@type": "AggregateOffer",
          priceCurrency: SITE.currency,
          lowPrice: p.price,
          highPrice: p.highPrice,
          offerCount: p.sizes.length,
          availability,
          url,
        }
      : {
          "@type": "Offer",
          priceCurrency: SITE.currency,
          price: p.price,
          availability,
          itemCondition: "https://schema.org/NewCondition",
          url,
        };

  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      description: p.description || `${p.name}, a ${p.category.toLowerCase()} eau de parfum by ${SITE.name}.`,
      sku: p.id,
      category: p.category,
      brand: { "@type": "Brand", name: SITE.name },
      ...(p.image.startsWith("https://") ? { image: [p.image] } : {}),
      offers,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE.url}/shop` },
        { "@type": "ListItem", position: 3, name: p.name, item: url },
      ],
    },
  ];

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/* Server wrapper: the dynamic [slug] param is read inside <Suspense>,
   so Next can prerender the shell and stream the product in. */
export default function ProductPage({ params }: { params: Params }) {
  return (
    <>
      <Suspense fallback={null}>
        <ProductJsonLd params={params} />
      </Suspense>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#070303] text-xs text-white/40">
            Loading fragrance…
          </div>
        }
      >
        <ProductClient params={params} />
      </Suspense>
    </>
  );
}