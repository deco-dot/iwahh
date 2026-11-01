import Link from "next/link";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  EDIT THIS BLOCK ONCE. It fills in all three legal pages.            */
/* ------------------------------------------------------------------ */
export const BUSINESS = {
  brand: "IWAHH",
  legalName: "IWAHH",
  address: "[Business address, City, State, PIN code]",
  email: "[support@yourdomain.com]",
  phone: "[+91 XXXXX XXXXX]",
  gstin: "[GSTIN, if registered]",
  grievanceOfficer: "[Name of grievance officer]",
  courtCity: "[Your city]", // courts that handle disputes
  lastUpdated: "1 November 2026",
};

const PAGES = [
  { key: "terms", href: "/terms", label: "Terms" },
  { key: "privacy", href: "/privacy", label: "Privacy" },
  { key: "shipping", href: "/shipping-returns", label: "Shipping & returns" },
] as const;

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap');
.ix-root { font-family: 'Jost', system-ui, sans-serif; --bg:#070303; --fg:#f7f2ee; --champagne:#e9cfa9;
  --glass: linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.015)); }
.ix-root .font-serif { font-family: 'Bodoni Moda','Times New Roman',serif !important; font-weight: 400; }
.ix-root ::selection { background:#720000; color:#fff; }
.ix-root .glass { background: var(--glass); border: 1px solid rgba(255,255,255,.09);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 16px 40px rgba(0,0,0,.45);
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
.ix-root .text-shimmer { background: linear-gradient(100deg,#f7f2ee 20%,#e9cfa9 45%,#f7f2ee 70%);
  -webkit-background-clip: text; background-clip: text; color: transparent; }
.ix-root :focus-visible { outline: 2px solid var(--champagne); outline-offset: 2px; }
`;

/* ---------- Small content helpers ---------- */

export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section id={`s${n}`} className="scroll-mt-24 space-y-3">
      <h2 className="flex items-baseline gap-3 font-serif text-xl font-light text-white">
        <span className="font-mono text-xs text-[var(--champagne)]">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-sm font-light leading-relaxed text-white/65">{children}</p>;
}

export function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-sm font-light leading-relaxed text-white/65">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#b3122a]" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function ContactBlock() {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-4 text-sm font-light leading-relaxed text-white/70">
      <p className="text-white">{BUSINESS.legalName}</p>
      <p>{BUSINESS.address}</p>
      <p>
        Email: {BUSINESS.email} <span className="text-white/30">·</span> Phone / WhatsApp: {BUSINESS.phone}
      </p>
      <p>GSTIN: {BUSINESS.gstin}</p>
    </div>
  );
}

/* ---------- Page shell ---------- */

export default function LegalLayout({
  active,
  title,
  intro,
  children,
}: {
  active: (typeof PAGES)[number]["key"];
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="ix-root relative min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased">
      <style>{STYLES}</style>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(179,18,42,0.2),transparent)]" />

      {/* Floating pill nav */}
      <nav className="glass fixed left-1/2 top-3 z-40 flex h-12 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 items-center justify-between rounded-full px-2.5 pl-5 text-xs text-white/65 md:h-14 md:pl-6">
        <Link href="/" className="font-serif text-lg tracking-[0.4em] text-white transition-colors hover:text-[var(--champagne)] md:text-xl">
          IWAHH
        </Link>
        <Link href="/shop" className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 transition hover:bg-white/10 hover:text-white">
          Shop
        </Link>
      </nav>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-24 md:pt-28">
        {/* Heading */}
        <header className="mb-6">
          <p className="font-serif text-sm italic text-[var(--champagne)]">Policies</p>
          <h1 className="text-shimmer mt-1 font-serif text-3xl font-light sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-white/55">{intro}</p>
          <p className="mt-2 text-xs text-white/35">Last updated: {BUSINESS.lastUpdated}</p>
        </header>

        {/* Switch between policies */}
        <nav aria-label="Policies" className="mb-6 flex flex-wrap gap-2">
          {PAGES.map((p) => (
            <Link
              key={p.key}
              href={p.href}
              aria-current={p.key === active ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-xs transition ${
                p.key === active
                  ? "bg-gradient-to-br from-[#a3081c] to-[#720000] font-medium text-white shadow-[0_6px_18px_rgba(114,0,0,0.5)]"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </nav>

        {/* Content */}
        <article className="glass space-y-8 rounded-[1.5rem] p-5 sm:p-8">{children}</article>

        <footer className="mt-8 text-center text-xs text-white/35">
          <p>© {new Date().getFullYear()} {BUSINESS.brand}. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}