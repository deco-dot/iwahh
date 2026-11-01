"use client";

import { useState, useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";

/* WhatsApp number that receives orders (country code + number, no + or spaces) */
const WHATSAPP_NUMBER = "917994654204";
const FREE_SHIPPING_INR = 5000;
const SHIPPING_FEE_INR = 500;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.22-.36a9.44 9.44 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.47 9.46zM20.07 3.9A11.4 11.4 0 0 0 12.05.5C5.73.5.59 5.64.59 11.96c0 2.02.53 3.99 1.53 5.73L.5 23.5l5.95-1.56a11.44 11.44 0 0 0 5.6 1.43h.01c6.32 0 11.46-5.14 11.46-11.46 0-3.06-1.19-5.94-3.35-8.1z" />
    </svg>
  );
}

/* Same design tokens as the other pages */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap');
.ix-root {
  font-family: 'Jost', system-ui, sans-serif;
  --bg: #070303; --fg: #f7f2ee; --champagne: #e9cfa9;
  --glass: linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.015));
}
.ix-root .font-serif { font-family: 'Bodoni Moda','Times New Roman',serif !important; font-weight: 400; }
.ix-root ::selection { background:#720000; color:#fff; }
.ix-root .glass {
  background: var(--glass); border: 1px solid rgba(255,255,255,.09);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 16px 40px rgba(0,0,0,.45);
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
}
.ix-root .btn-wa {
  background: linear-gradient(135deg,#2fdc7a 0%,#18a957 55%,#0e7a3e 100%);
  box-shadow: 0 10px 26px rgba(24,169,87,.35), inset 0 1px 0 rgba(255,255,255,.3);
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, opacity .3s;
}
.ix-root .btn-wa:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 34px rgba(24,169,87,.5), inset 0 1px 0 rgba(255,255,255,.4); }
.ix-root .btn-primary {
  background: linear-gradient(135deg,#a3081c 0%,#720000 60%,#560000 100%);
  box-shadow: 0 8px 22px rgba(114,0,0,.45), inset 0 1px 0 rgba(255,255,255,.22);
}
.ix-root .field {
  width: 100%; border-radius: .875rem; border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.05); padding: .65rem .9rem; font-size: 16px; color: #fff; outline: none; /* 16px stops iOS zoom */
  transition: border-color .25s, background .25s, box-shadow .25s;
}
@media (min-width: 640px) { .ix-root .field { font-size: .875rem; } }
.ix-root .field::placeholder { color: rgba(255,255,255,.28); }
.ix-root .field:focus { border-color: #b3122a; background: rgba(255,255,255,.07); box-shadow: 0 0 0 3px rgba(179,18,42,.18); }
.ix-root :focus-visible { outline: 2px solid var(--champagne); outline-offset: 2px; }
`;

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block pl-1 text-[11px] text-white/55">{label}</span>
      {children}
    </label>
  );
}

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false); // mobile only
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("iwahh_cart_items");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (err) {
      console.error("Failed to load cart from storage", err);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal > FREE_SHIPPING_INR ? 0 : SHIPPING_FEE_INR; // free above ₹5,000
  const totalAmount = subtotal + shipping;
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);

  const handleChange = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const whatsappUrl = useMemo(() => {
    const itemsText = cart.map((i) => `• ${i.name} (x${i.quantity}) - ₹${i.price * i.quantity}`).join("\n");
    const message =
      `*New Order Inquiry*\n\n` +
      `*Customer Name:* ${formData.name}\n` +
      `*Phone:* ${formData.phone}\n` +
      `*Email:* ${formData.email}\n` +
      `*Delivery Address:* ${formData.address}, ${formData.city}, ${formData.state} - ${formData.postalCode}\n\n` +
      `*Items Ordered:*\n${itemsText}\n\n` +
      `*Shipping:* ${shipping === 0 ? "Free" : `₹${shipping}`}\n` +
      `*Total Amount:* ₹${totalAmount.toLocaleString("en-IN")}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }, [cart, formData, shipping, totalAmount]);

  // Submit opens WhatsApp with the order message (browser checks required fields first)
  const handleWhatsAppOrder = (e: FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMessage("Your bag is empty. Add a fragrance first.");
      return;
    }
    setErrorMessage("");
    window.open(whatsappUrl, "_blank");
    setSent(true);
  };

  const finishOrder = () => {
    try {
      localStorage.removeItem("iwahh_cart");
      localStorage.removeItem("iwahh_cart_items");
    } catch {}
    router.push("/shop");
  };

  const bg = (
    <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(179,18,42,0.2),transparent)]" />
  );

  /* ── AFTER WHATSAPP OPENS ────────────────────────────────────────────── */
  if (sent) {
    return (
      <main className="ix-root relative flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-16 text-[var(--fg)]">
        <style>{STYLES}</style>
        {bg}
        <div className="glass relative w-full max-w-xs space-y-5 rounded-[1.5rem] p-6 text-center">
          <div className="btn-wa mx-auto grid h-14 w-14 place-items-center rounded-full text-white">
            <WhatsAppIcon size={26} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-light text-white">One last step</h1>
            <p className="mt-2 text-sm font-light leading-relaxed text-white/60">
              Your order message is ready in WhatsApp. Press send there to place your order.
            </p>
          </div>
          <div className="space-y-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-white"
            >
              <WhatsAppIcon size={15} /> Open WhatsApp again
            </a>
            <button onClick={finishOrder} className="btn-primary w-full rounded-full py-3 text-sm font-medium text-white">
              I’ve sent my order
            </button>
            <button onClick={() => setSent(false)} className="w-full py-1.5 text-xs text-white/45 underline underline-offset-4 hover:text-white">
              Edit my details
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ── CHECKOUT ────────────────────────────────────────────────────────── */
  return (
    <main className="ix-root relative min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased">
      <style>{STYLES}</style>
      {bg}

      {/* Slim top bar */}
      <header className="glass fixed left-1/2 top-3 z-40 flex h-11 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 items-center justify-between rounded-full pl-2 pr-5 text-xs text-white/60">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} />
        </button>
        <Link href="/" className="font-serif text-base tracking-[0.4em] text-white">
          IWAHH
        </Link>
        <span className="w-8 text-right text-[11px]">{itemCount > 0 ? itemCount : ""}</span>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-28 pt-20 lg:pb-12">
        <h1 className="mb-5 font-serif text-2xl font-light text-white sm:text-3xl">Checkout</h1>

        <form id="checkout-form" onSubmit={handleWhatsAppOrder} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
          {/* Order summary: collapsible on mobile, always open on desktop. Shown first on mobile. */}
          <aside className="glass rounded-[1.25rem] lg:order-2 lg:sticky lg:top-20">
            <button
              type="button"
              onClick={() => setSummaryOpen((o) => !o)}
              aria-expanded={summaryOpen}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left lg:pointer-events-none"
            >
              <span className="text-sm text-white">
                Your order <span className="text-white/40">({itemCount})</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm text-[var(--champagne)]">{inr(totalAmount)}</span>
                <ChevronDown size={16} className={`text-white/50 transition-transform lg:hidden ${summaryOpen ? "rotate-180" : ""}`} />
              </span>
            </button>

            <div className={`${summaryOpen ? "block" : "hidden"} space-y-3 px-4 pb-4 lg:block`}>
              {!cartLoaded ? (
                <p className="py-4 text-center text-xs text-white/40">Loading…</p>
              ) : cart.length === 0 ? (
                <div className="space-y-3 py-4 text-center text-xs text-white/45">
                  <p>Your bag is empty.</p>
                  <Link href="/shop" className="btn-primary inline-block rounded-full px-5 py-2 text-xs font-medium text-white">
                    Browse fragrances
                  </Link>
                </div>
              ) : (
                <ul className="max-h-52 space-y-2 overflow-y-auto">
                  {cart.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 text-xs">
                      <div className="relative h-11 w-9 shrink-0">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill unoptimized className="object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-sm text-white">{item.name}</p>
                        <p className="text-[11px] text-white/40">Qty {item.quantity}</p>
                      </div>
                      <span className="font-mono text-white/80">{inr(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-1.5 border-t border-white/10 pt-3 text-xs text-white/55">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{inr(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-mono">{shipping === 0 ? "Free" : inr(shipping)}</span>
                </div>
                {cart.length > 0 && shipping > 0 && (
                  <p className="pt-1 text-[11px] text-[var(--champagne)]/80">Add {inr(FREE_SHIPPING_INR + 1 - subtotal)} more for free delivery</p>
                )}
                <div className="flex items-baseline justify-between border-t border-white/10 pt-2.5 text-white">
                  <span className="text-sm">Total</span>
                  <span className="font-mono text-base text-[var(--champagne)]">{inr(totalAmount)}</span>
                </div>
              </div>

              {/* Desktop order button */}
              <button
                type="submit"
                disabled={cart.length === 0}
                className="btn-wa hidden w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 lg:flex"
              >
                <WhatsAppIcon /> Order on WhatsApp
              </button>
            </div>
          </aside>

          {/* Details */}
          <section className="glass space-y-3 rounded-[1.25rem] p-4 sm:p-5 lg:order-1">
            <h2 className="text-sm text-white">Your details</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name">
                <input type="text" required autoComplete="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Aarav Sharma" className="field" />
              </Field>
              <Field label="Phone">
                <input type="tel" required autoComplete="tel" inputMode="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+91 98765 43210" className="field" />
              </Field>
              <Field label="Email" className="sm:col-span-2">
                <input type="email" required autoComplete="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="aarav@example.com" className="field" />
              </Field>
            </div>

            <Field label="Address">
              <textarea rows={2} required autoComplete="street-address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="House no., building, street" className="field resize-none" />
            </Field>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="City">
                <input type="text" required autoComplete="address-level2" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="Kochi" className="field" />
              </Field>
              <Field label="State">
                <input type="text" required autoComplete="address-level1" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} placeholder="Kerala" className="field" />
              </Field>
              <Field label="Postal code" className="col-span-2 sm:col-span-1">
                <input type="text" required inputMode="numeric" autoComplete="postal-code" value={formData.postalCode} onChange={(e) => handleChange("postalCode", e.target.value)} placeholder="682001" className="field" />
              </Field>
            </div>

            {errorMessage && (
              <p role="alert" className="rounded-xl bg-[#b3122a]/15 px-3.5 py-2 text-xs text-[#ff8a8a]">
                {errorMessage}
              </p>
            )}

            <p className="pt-1 text-[11px] leading-relaxed text-white/40">
              Tapping the button opens WhatsApp with your order ready to send.
            </p>
          </section>
        </form>
      </div>

      {/* Mobile sticky order bar */}
      <div className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-full py-1.5 pl-5 pr-1.5 lg:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <div className="leading-tight">
          <p className="text-[10px] text-white/45">Total</p>
          <p className="font-mono text-sm text-[var(--champagne)]">{inr(totalAmount)}</p>
        </div>
        <button
          type="submit"
          form="checkout-form"
          disabled={cart.length === 0}
          className="btn-wa flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <WhatsAppIcon size={15} /> Order on WhatsApp
        </button>
      </div>
    </main>
  );
}