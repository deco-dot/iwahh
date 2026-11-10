/* Put this file at app/shop/layout.tsx
   Your shop page is a client component, so it cannot set its own title. This layout does it. */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Shop all fragrances",
  description:
    "Browse every IWAHH eau de parfum. Filter by scent family and price, see live stock, and order on WhatsApp with delivery across India.",
  alternates: { canonical: "/shop" },
  openGraph: { title: "Shop all fragrances | IWAHH", url: "/shop" },
};

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children;
}