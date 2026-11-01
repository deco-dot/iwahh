import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout, { Section, P, UL, ContactBlock, BUSINESS } from "@/app/components/LegalLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions | IWAHH",
  description: "The terms that apply when you browse and order from IWAHH.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      active="terms"
      title="Terms & Conditions"
      intro="Please read these terms before you order. By using this website or placing an order, you agree to them."
    >
      <Section n={1} title="About these terms">
        <P>
          This website is run by {BUSINESS.legalName} (“{BUSINESS.brand}”, “we”, “us”). These terms apply to your use of the website and to every
          order you place with us. If you do not agree, please do not use the website.
        </P>
      </Section>

      <Section n={2} title="Using the website">
        <UL
          items={[
            "You must be at least 18 years old to place an order.",
            "Give us correct and complete details, especially your phone number and delivery address.",
            "Do not misuse the website, try to break into it, copy it automatically, or use it for anything unlawful.",
          ]}
        />
      </Section>

      <Section n={3} title="Products and descriptions">
        <P>
          We try to describe and photograph every fragrance as accurately as we can. Colours may look slightly different on your screen. Scent is
          personal: how a fragrance smells and how long it lasts depends on your skin, the weather and how you wear it, so we cannot promise the
          same result for everyone.
        </P>
        <P>
          Some fragrances are made in small batches. A product may be marked out of stock, changed or withdrawn at any time.
        </P>
      </Section>

      <Section n={4} title="Prices and taxes">
        <UL
          items={[
            "All prices are in Indian Rupees (₹) and include GST unless we say otherwise.",
            "Delivery is free on orders above ₹5,000. Below that, a delivery fee is shown at checkout before you order.",
            "If we find a pricing mistake after you order, we will tell you. You can then choose to continue at the correct price or cancel for a full refund.",
          ]}
        />
      </Section>

      <Section n={5} title="Placing an order">
        <P>
          Orders are placed through WhatsApp. When you tap the order button, WhatsApp opens with your order details already written. Your order
          is only a request until you send that message and we confirm it to you.
        </P>
        <P>
          A contract is formed when we confirm your order on WhatsApp. We may refuse or cancel an order, for example if an item is out of stock,
          the price was shown wrongly, the details look incorrect, or we cannot deliver to your area. If you have already paid, you will get a
          full refund.
        </P>
      </Section>

      <Section n={6} title="Payment">
        <P>
          We share payment details with you on WhatsApp after we confirm your order. Please pay only to the account details sent to you in that
          chat by us.
        </P>
        <UL
          items={[
            "We will never ask for your card PIN, CVV, UPI PIN or an OTP.",
            "This website does not collect or store your card or bank details.",
            "If someone else contacts you in our name asking for money, do not pay. Tell us at once.",
          ]}
        />
      </Section>

      <Section n={7} title="Delivery, returns and refunds">
        <P>
          Delivery times, charges, cancellations, returns and refunds are explained in our{" "}
          <Link href="/shipping-returns" className="text-[var(--champagne)] underline underline-offset-4">
            Shipping &amp; Returns policy
          </Link>
          , which forms part of these terms.
        </P>
      </Section>

      <Section n={8} title="Safety and use of fragrance">
        <P>Perfume contains alcohol and fragrance oils. Please use it with care.</P>
        <UL
          items={[
            "For external use only. Do not swallow. Avoid eyes and broken or irritated skin.",
            "Flammable. Keep away from flame, heat and direct sunlight. Do not spray near a fire or while smoking.",
            "Keep out of reach of children.",
            "Do a patch test first, especially if you have sensitive skin or allergies. Stop using it and see a doctor if you get a reaction.",
            "Store in a cool, dry place, away from sunlight, to keep the fragrance at its best.",
          ]}
        />
      </Section>

      <Section n={9} title="Our content and intellectual property">
        <P>
          The name {BUSINESS.brand}, our logo, fragrance names, images, text and website design belong to us or are used with permission. You may
          not copy, sell or reuse them without our written consent, except for personal, non-commercial use such as sharing a link.
        </P>
      </Section>

      <Section n={10} title="Third-party services">
        <P>
          We use services run by other companies, such as WhatsApp, delivery partners and Google. Their own terms and privacy policies apply when
          you use them. We are not responsible for their services.
        </P>
      </Section>

      <Section n={11} title="Our responsibility">
        <P>
          We take care to provide the website and products as described. To the extent the law allows, we are not liable for indirect losses, for
          delays caused by events outside our control (such as weather, strikes or courier problems), or for allergic reactions where the product
          was used against the safety advice above.
        </P>
        <P>
          Nothing in these terms limits your rights as a consumer under Indian law, including the Consumer Protection Act, 2019, or our liability
          where it cannot legally be limited.
        </P>
      </Section>

      <Section n={12} title="Governing law and disputes">
        <P>
          These terms are governed by the laws of India. If a problem arises, please contact us first so we can try to fix it. If we cannot
          resolve it, the courts at {BUSINESS.courtCity} will have jurisdiction, without affecting your right to approach a consumer commission
          where you live.
        </P>
      </Section>

      <Section n={13} title="Changes to these terms">
        <P>
          We may update these terms from time to time. The date at the top shows when they last changed. Orders you have already placed stay
          under the terms that applied when you placed them.
        </P>
      </Section>

      <Section n={14} title="Contact us">
        <P>Questions about these terms? Reach us here:</P>
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}