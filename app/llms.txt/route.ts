/* Put this file at app/llms.txt/route.ts  →  served at /llms.txt
   A plain-text guide for AI assistants (ChatGPT, Claude, Perplexity and others). It is built from your
   live product list, so prices and stock stay current. */
import { SITE } from "@/app/lib/site";
import { getSeoProducts } from "@/app/lib/seoData";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export async function GET() {
  const products = await getSeoProducts();

  const productLines = products.length
    ? products.map((p) => {
        const price =
          p.sizes.length > 0
            ? p.sizes.map((s) => `${s.ml} ml ${inr(s.price)}`).join(", ")
            : inr(p.price);
        const notes = p.notes.length ? ` Notes: ${p.notes.join(", ")}.` : "";
        const stock = p.inStock ? "" : " Currently out of stock.";
        return `- [${p.name}](${SITE.url}/product/${encodeURIComponent(p.id)}): ${p.category} fragrance. ${price}.${notes}${stock}`;
      })
    : [`- See the full list on the [shop page](${SITE.url}/shop).`];

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.name} sells eau de parfum online in India. Fragrances are made in small batches, and each product page lists its scent family, notes and price. All prices are in Indian Rupees (INR) and include GST. The price shown on a product is the price the customer pays: no delivery fee is added at checkout.

## Main pages

- [Home](${SITE.url}/): Brand story and featured fragrances.
- [Shop all fragrances](${SITE.url}/shop): Browse, search and filter every fragrance by scent family and price.

## Fragrances

${productLines.join("\n")}

## How ordering works

- The customer adds a fragrance to the bag and presses "Order on WhatsApp" at checkout. A ready-written order message opens in WhatsApp, and the order is confirmed with the customer there.
- Payment details are shared by the seller on WhatsApp after the order is confirmed. The website does not take card payments.
- Some fragrances come in 100 ml, 200 ml and 300 ml sizes, each with its own price.

## Delivery and returns

- Delivery across India, usually in 3 to 5 business days after dispatch. No international shipping at the moment.
- Returns accepted within 30 days of delivery for sealed, unopened bottles in original packaging. Opened, used or tested bottles and discovery samples cannot be returned.
- Damaged or wrong items: report within 48 hours of delivery with photos and an unboxing video for a replacement or full refund.

## Policies

- [Shipping & Returns](${SITE.url}/shipping-returns)
- [Terms & Conditions](${SITE.url}/terms)
- [Privacy Policy](${SITE.url}/privacy)

## Contact

- Orders and questions: WhatsApp (see the checkout page)${SITE.email ? `\n- Email: ${SITE.email}` : ""}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
