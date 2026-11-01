import type { Metadata } from "next";
import LegalLayout, { Section, P, UL, ContactBlock, BUSINESS } from "@/app/components/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | IWAHH",
  description: "What personal information IWAHH collects, why, and how we protect it.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      active="privacy"
      title="Privacy Policy"
      intro="We collect only what we need to take and deliver your order. This page explains what that is and what we do with it."
    >
      <Section n={1} title="Who we are">
        <P>
          {BUSINESS.legalName} (“{BUSINESS.brand}”, “we”, “us”) runs this website. We decide why and how your personal information is used, so we
          are responsible for protecting it under Indian law, including the Digital Personal Data Protection Act, 2023 and the Information
          Technology Act, 2000.
        </P>
      </Section>

      <Section n={2} title="What we collect">
        <UL
          items={[
            <>
              <strong className="font-medium text-white/85">Details you give us at checkout:</strong> your name, phone number, email address,
              delivery address and the items you want to order.
            </>,
            <>
              <strong className="font-medium text-white/85">Your WhatsApp messages:</strong> when you order, you send us a message on WhatsApp. We
              see your WhatsApp number and anything you write to us.
            </>,
            <>
              <strong className="font-medium text-white/85">Saved on your device:</strong> your bag and wishlist are remembered in your browser so
              they are still there when you come back. This stays on your device.
            </>,
            <>
              <strong className="font-medium text-white/85">Basic technical data:</strong> like your browser type and the pages requested, which
              our hosting and database providers record to keep the site running and secure.
            </>,
          ]}
        />
        <P>We do not collect your card, bank or UPI details on this website.</P>
      </Section>

      <Section n={3} title="How we use your information">
        <UL
          items={[
            "To confirm, pack and deliver your order, and to tell you about its progress.",
            "To answer your questions and handle returns, refunds or complaints.",
            "To keep records we are required to keep, such as for tax and accounting.",
            "To keep the website secure and working well, and to prevent fraud.",
            "To send you news or offers, only if you have agreed. You can say stop at any time.",
          ]}
        />
        <P>We never sell your personal information.</P>
      </Section>

      <Section n={4} title="WhatsApp">
        <P>
          Orders are sent through WhatsApp. Once you press send, your message is handled by WhatsApp (Meta) under its own privacy policy, and by
          us on the number that receives orders. Please only share details you are comfortable sending in a chat.
        </P>
      </Section>

      <Section n={5} title="Who we share it with">
        <P>We share information only when needed to do what you asked, and only the part that is needed:</P>
        <UL
          items={[
            "Courier and delivery partners: your name, phone number and address, so they can deliver your parcel.",
            "Payment providers or your bank, when you pay.",
            "Technology providers who run the website for us, such as Google (Firebase) for our database and hosting, and Google Fonts for page fonts.",
            "Authorities, if the law requires it or to protect our legal rights.",
          ]}
        />
        <P>These providers may only use your information to provide their service to us.</P>
      </Section>

      <Section n={6} title="Cookies and local storage">
        <P>
          We use your browser’s local storage to remember your bag and wishlist. We do not use advertising cookies. If we add analytics or
          marketing tools in the future, we will update this page. You can clear this data any time from your browser settings, but your bag and
          wishlist will then be emptied.
        </P>
      </Section>

      <Section n={7} title="How long we keep it">
        <P>
          We keep order and contact details for as long as we need them to serve you and to meet tax, accounting and legal requirements. After
          that we delete them or make them anonymous. Marketing details are kept until you ask us to stop.
        </P>
      </Section>

      <Section n={8} title="How we protect it">
        <P>
          We use secure connections (HTTPS), limit who can open our order records to the owner, and rely on well-known providers for storage. No
          system is completely risk-free, but we take reasonable steps to guard your information.
        </P>
      </Section>

      <Section n={9} title="Your rights">
        <P>You have the right to:</P>
        <UL
          items={[
            "Ask what personal information we hold about you and get a summary of it.",
            "Ask us to correct or complete information that is wrong.",
            "Ask us to delete your information, unless we must keep it by law.",
            "Withdraw your consent, for example to marketing messages.",
            "Nominate someone to exercise these rights for you if you are unable to.",
            "Complain to us, and if you are not satisfied, to the Data Protection Board of India.",
          ]}
        />
        <P>To use any of these rights, write to us at {BUSINESS.email}. We will reply as soon as we can.</P>
      </Section>

      <Section n={10} title="Children">
        <P>This website is for adults. We do not knowingly collect information from anyone under 18. If you think a child has shared details with us, tell us and we will delete them.</P>
      </Section>

      <Section n={11} title="Grievance officer">
        <P>
          If you have a complaint about how your information is handled, contact our grievance officer, {BUSINESS.grievanceOfficer}, at{" "}
          {BUSINESS.email}. We will acknowledge your complaint within 48 hours and aim to resolve it within one month.
        </P>
      </Section>

      <Section n={12} title="Changes to this policy">
        <P>We may update this policy from time to time. The date at the top shows the latest version. If we make an important change, we will make it clear on the website.</P>
      </Section>

      <Section n={13} title="Contact us">
        <ContactBlock />
      </Section>
    </LegalLayout>
  );
}