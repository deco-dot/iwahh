import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout, { Section, P, UL, ContactBlock, BUSINESS } from "@/app/components/LegalLayout";

export const metadata: Metadata = {
  title: "Shipping & Returns | IWAHH",
  description: "Delivery times, charges, cancellations, returns and refunds at IWAHH.",
};

export default function ShippingReturnsPage() {
  return (
    <LegalLayout
      active="shipping"
      title="Shipping & Returns"
      intro="How long delivery takes, what it costs, and what to do if you need to cancel, return or get a refund."
    >
      <Section n={1} title="Where we deliver">
        <P>We deliver across India. We do not ship outside India at the moment.</P>
      </Section>

      <Section n={2} title="Delivery time">
        <UL
          items={[
            "Orders are usually packed and dispatched within 1 to 5 business days after we confirm your order and receive payment.",
            "Delivery then takes about 3 to 5 business days. Remote areas can take a little longer.",
            "Once your parcel is on its way, we send you the tracking details on WhatsApp.",
            "Delays can happen because of weather, festivals, strikes or courier issues. We will keep you updated.",
          ]}
        />
      </Section>

      <Section n={3} title="Delivery charges">
        <P>The price shown on each product is the price you pay. We do not add a delivery fee at checkout. If anything else applies to your order, we tell you on WhatsApp before you pay.</P>
      </Section>

      <Section n={4} title="Receiving your parcel">
        <UL
          items={[
            "Please check that the delivery address and phone number you give us are correct. We cannot be responsible for a parcel sent to a wrong address you gave us.",
            "Keep your phone on. The courier will call before delivery. If delivery fails after repeated attempts, the parcel may be returned to us, and we will contact you to send it again (extra delivery charges may apply).",
            "Please record a short unboxing video when you open your parcel. It helps us sort out any damage quickly.",
            "If the outer packing looks badly damaged or tampered with, do not accept it, and tell us right away.",
          ]}
        />
        <P>Perfume contains alcohol, so some couriers send it by road or surface only. This is for safety and can affect delivery times.</P>
      </Section>

      <Section n={5} title="Cancelling an order">
        <UL
          items={[
            "You can cancel before your order is dispatched. Message us on WhatsApp with your name and order details, and we will refund you in full.",
            "Once an order has been dispatched, it cannot be cancelled. You can still return it under the return rules below.",
          ]}
        />
      </Section>

      <Section n={6} title="Returns">
        <P>You can return a fragrance within 30 days of delivery if:</P>
        <UL
          items={[
            "The bottle is unopened, unused and still sealed.",
            "It is in its original box and packaging, with all the items that came with it.",
          ]}
        />
        <P>
          To protect hygiene and safety, we cannot take back bottles that have been opened, sprayed or tested, discovery samples, or products
          marked as final sale. Return shipping is paid by you, unless the return is because of our mistake (see below).
        </P>
      </Section>

      <Section n={7} title="Damaged, wrong or faulty items">
        <P>If your order arrives damaged, leaking, faulty, or is not what you ordered:</P>
        <UL
          items={[
            "Tell us within 48 hours of delivery.",
            "Send clear photos and your unboxing video on WhatsApp or email.",
            "We will check it, and send a replacement or give a full refund, including the delivery fee. We also cover the return shipping.",
          ]}
        />
      </Section>

      <Section n={8} title="How to start a return or cancellation">
        <UL
          items={[
            "Contact us on WhatsApp or email with your name, order details and the reason.",
            "We will reply with the next steps and the return address.",
            "Pack the item safely in its original box and send it using a trackable service. Please do not send it before we reply.",
          ]}
        />
      </Section>

      <Section n={9} title="Refunds">
        <UL
          items={[
            "Once we receive and check the returned item, we approve your refund and tell you on WhatsApp.",
            "Refunds are sent to the same account or UPI ID you paid from, usually within 5 to 7 business days after approval. Your bank may take a little longer to show it.",
            "If we cannot fulfil an order you have already paid for, for example because it sold out, we refund the full amount.",
            "The original delivery fee is refunded only when the return is due to our mistake or a damaged or faulty item.",
          ]}
        />
      </Section>

      <Section n={10} title="Free samples and gifts">
        <P>Discovery samples and gift packaging are free extras. They are not returnable or refundable.</P>
      </Section>

      <Section n={11} title="Need help?">
        <P>
          We are happy to help. See also our{" "}
          <Link href="/terms" className="text-[var(--champagne)] underline underline-offset-4">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[var(--champagne)] underline underline-offset-4">
            Privacy Policy
          </Link>
          . You can reach {BUSINESS.brand} here:
        </P>
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}