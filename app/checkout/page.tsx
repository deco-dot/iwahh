"use client";

import { useState, useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Check,
  Loader2,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Package,
  Zap,
} from "lucide-react";
import { db } from "@/app/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const DEFAULT_WHATSAPP_NUMBER = "917994654204";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  notes?: string;
}

const COUNTRY_CODES = [
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+1", label: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", label: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", label: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+966", label: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+974", label: "Qatar", flag: "🇶🇦" },
  { code: "+968", label: "Oman", flag: "🇴🇲" },
  { code: "+965", label: "Kuwait", flag: "🇰🇼" },
  { code: "+973", label: "Bahrain", flag: "🇧🇭" },
  { code: "+65", label: "Singapore", flag: "🇸🇬" },
  { code: "+60", label: "Malaysia", flag: "🇲🇾" },
  { code: "+94", label: "Sri Lanka", flag: "🇱🇰" },
  { code: "+880", label: "Bangladesh", flag: "🇧🇩" },
  { code: "+61", label: "Australia", flag: "🇦🇺" },
  { code: "+64", label: "New Zealand", flag: "🇳🇿" },
  { code: "+49", label: "Germany", flag: "🇩🇪" },
  { code: "+33", label: "France", flag: "🇫🇷" },
  { code: "+39", label: "Italy", flag: "🇮🇹" },
  { code: "+34", label: "Spain", flag: "🇪🇸" },
  { code: "+41", label: "Switzerland", flag: "🇨🇭" },
  { code: "+81", label: "Japan", flag: "🇯🇵" },
  { code: "+82", label: "South Korea", flag: "🇰🇷" },
];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.22-.36a9.44 9.44 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.9.99 6.69 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.46-9.47 9.46zM20.07 3.9A11.4 11.4 0 0 0 12.05.5C5.73.5.59 5.64.59 11.96c0 2.02.53 3.99 1.53 5.73L.5 23.5l5.95-1.56a11.44 11.44 0 0 0 5.6 1.43h.01c6.32 0 11.46-5.14 11.46-11.46 0-3.06-1.19-5.94-3.35-8.1z" />
    </svg>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Jost:wght@300;400;500;600&display=swap');
.ix-root {
  font-family: 'Jost', system-ui, sans-serif;
  --bg: #050302; 
  --panel: #0f0b0a;
  --fg: #f7f2ee; 
  --champagne: #e9cfa9;
  --border: rgba(255,255,255,.06);
  --border-focus: rgba(233,207,169,.3);
}
.ix-root .font-serif { font-family: 'Bodoni Moda','Times New Roman',serif !important; font-weight: 400; }
.ix-root ::selection { background:#720000; color:#fff; }
.ix-root .premium-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 1.25rem;
}
.ix-root .glass-nav {
  background: rgba(5,3,2,.7);
  border: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.ix-root .btn-wa {
  background: #1fa855;
  box-shadow: 0 4px 14px rgba(31,168,85,.2);
  transition: all .2s ease;
}
.ix-root .btn-wa:hover:not(:disabled) { background: #23bd5e; box-shadow: 0 6px 20px rgba(31,168,85,.4); }
.ix-root .btn-wa:active:not(:disabled) { transform: scale(.98); }
.ix-root .field {
  width: 100%; border-radius: .75rem; border: 1px solid var(--border);
  background: rgba(255,255,255,.02); padding: .85rem 1rem;
  font-size: 15px; color: #fff; outline: none;
  transition: border-color .2s, background .2s;
}
.ix-root .field::placeholder { color: rgba(255,255,255,.2); }
.ix-root .field:focus { border-color: var(--border-focus); background: rgba(255,255,255,.04); }
.ix-root select option { background-color: #120505 !important; color: #fff !important; }
.ix-root select { appearance: none; -webkit-appearance: none; }
`;

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block pl-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinNotice, setPinNotice] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: "+91",
    phone: "",
    postalCode: "",
    address: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("iwahh_cart_items");
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (err) {
      console.error("Failed to load cart", err);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  const totalAmount = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "store"));
        const n = snap.exists() ? (snap.data().whatsappNumber as string | undefined) : undefined;
        if (n) setWhatsappNumber(n);
      } catch (err) {
        console.error("Could not load WhatsApp number", err);
      }
    })();
  }, []);

  const handleChange = async (field: string, value: string) => {
    if (field === "postalCode") {
      const sanitized = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({ ...prev, postalCode: sanitized }));
      setPinNotice("");

      if (sanitized.length === 6) {
        setPinLoading(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${sanitized}`);
          const data = await res.json();
          if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
            const postOffice = data[0].PostOffice[0];
            setFormData((prev) => ({
              ...prev,
              city: postOffice.District || postOffice.Block || "",
              state: postOffice.State || "",
            }));
            setPinNotice(`${postOffice.District} auto-detected`);
          } else {
            setPinNotice("Invalid PIN code. Enter manually.");
          }
        } catch (err) {
          setPinNotice("Could not auto-fetch location.");
        } finally {
          setPinLoading(false);
        }
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const whatsappUrl = useMemo(() => {
    const itemsText = cart.map((i) => `• ${i.name} (x${i.quantity}) - ₹${i.price * i.quantity}`).join("\n");
    const fullPhone = `${formData.countryCode} ${formData.phone}`;
    const message =
      `*New Order*\n\n` +
      `*Name:* ${formData.name}\n` +
      `*Phone:* ${fullPhone}\n` +
      `*Email:* ${formData.email}\n` +
      `*Address:* ${formData.address}, ${formData.city}, ${formData.state} - ${formData.postalCode}\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total Amount:* ₹${totalAmount.toLocaleString("en-IN")}`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [cart, formData, totalAmount, whatsappNumber]);

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

  if (sent) {
    return (
      <main className="ix-root relative flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-16 text-[var(--fg)]">
        <style>{STYLES}</style>
        <div className="premium-card w-full max-w-md space-y-6 p-8 text-center">
          <div className="btn-wa mx-auto grid h-16 w-16 place-items-center rounded-full text-white">
            <WhatsAppIcon size={28} />
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-3xl text-white">One last step</h1>
            <p className="text-sm font-light leading-relaxed text-white/50">
              Your order message is ready in WhatsApp. Press send there to confirm your order.
            </p>
          </div>
          <div className="space-y-3 pt-4">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-wa flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-medium text-white">
              <WhatsAppIcon size={16} /> Open WhatsApp again
            </a>
            <button onClick={finishOrder} className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 text-sm font-medium text-white transition hover:bg-white/10">
              <span className="inline-flex items-center gap-2"><Check size={16} /> I've sent my order</span>
            </button>
            <button onClick={() => setSent(false)} className="text-xs text-white/40 underline underline-offset-4 hover:text-white/70">
              Edit details
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ix-root relative min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased">
      <style>{STYLES}</style>

      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(179,18,42,0.1),transparent)]" />

      {/* DESKTOP HEADER */}
      <header className="hidden lg:block relative z-10 border-b border-white/[.04]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5 text-[11px] uppercase tracking-widest text-white/50">
          <button onClick={() => router.back()} className="flex items-center gap-2 hover:text-white transition">
            <ArrowLeft size={14} /> Return to shop
          </button>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-emerald-400/90 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Checkout Active
          </div>
        </div>
      </header>

      {/* MOBILE PILL NAVBAR */}
      <nav className="glass-nav fixed left-1/2 top-3 z-40 flex h-12 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-full px-2 pl-4 lg:hidden">
        <button onClick={() => router.back()} className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10">
          <ArrowLeft size={16} />
        </button>
        <Link href="/" className="font-serif text-base tracking-[0.3em] text-white">IWAHH</Link>
        <button
          onClick={() => {
            document.getElementById("order-summary")?.scrollIntoView({ behavior: "smooth" });
            setSummaryOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[10px] text-white/80 border border-white/10"
        >
          BAG {itemCount > 0 ? itemCount : ""}
        </button>
      </nav>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-32 lg:px-8 lg:pt-12 lg:pb-12">
        
        {/* Page Title */}
        <div className="mb-8 lg:mb-12">
          <h1 className="font-serif text-3xl lg:text-5xl text-white">Checkout</h1>
          <p className="mt-2 hidden lg:block text-sm text-white/50">
            Secure dispatch and private collection handover.
          </p>
        </div>

        <form
          id="checkout-form"
          onSubmit={handleWhatsAppOrder}
          className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-10"
        >
          {/* ── LEFT COLUMN: FORM ── */}
          <div className="space-y-6">
            
            {/* Step 01: Contact */}
            <section className="premium-card p-5 lg:p-7 space-y-5 lg:space-y-6">
              <div className="flex items-center justify-between border-b border-white/[.04] pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/5 font-mono text-xs text-white/50">01</span>
                  <h2 className="font-serif text-xl text-white">Customer Details</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name">
                  <input type="text" required value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Aarav Sharma" className="field" />
                </Field>
                <Field label="Email">
                  <input type="email" required value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="aarav@example.com" className="field" />
                </Field>
              </div>

              {/* Phone Field - Fully Fixed Dropdown */}
              <Field label="WhatsApp Number">
                <div className="flex overflow-hidden rounded-xl border border-[var(--border)] bg-white/[.02] transition focus-within:border-[var(--border-focus)] focus-within:bg-white/[.04]">
                  {/* Country Selector */}
                  <div className="relative flex items-center border-r border-[var(--border)] bg-[#050302]">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => handleChange("countryCode", e.target.value)}
                      className="h-11 w-full cursor-pointer appearance-none bg-transparent pl-3 pr-8 text-sm text-white outline-none"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-white/40" />
                  </div>
                  {/* Number Input */}
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="9876543210"
                    className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/20"
                  />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
                  <Zap size={12} className="text-[var(--champagne)]" />
                  Order updates will be sent here.
                </p>
              </Field>
            </section>

            {/* Step 02: Shipping */}
            <section className="premium-card p-5 lg:p-7 space-y-5 lg:space-y-6">
              <div className="flex items-center justify-between border-b border-white/[.04] pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/5 font-mono text-xs text-white/50">02</span>
                  <h2 className="font-serif text-xl text-white">Shipping Address</h2>
                </div>
              </div>

              <Field label="Street Address">
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Villa 14, Magnolia Enclave, Marine Drive"
                  className="field resize-none"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="PIN Code">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={6}
                      value={formData.postalCode}
                      onChange={(e) => handleChange("postalCode", e.target.value)}
                      placeholder="682001"
                      className="field pr-8"
                    />
                    {pinLoading ? (
                      <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-white/40" />
                    ) : formData.postalCode.length === 6 && !pinNotice.includes("Invalid") ? (
                      <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                    ) : null}
                  </div>
                </Field>
                <Field label="City" className="sm:col-span-1">
                  <input type="text" required value={formData.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="Auto-filled" className="field" />
                </Field>
                <Field label="State" className="sm:col-span-1">
                  <input type="text" required value={formData.state} onChange={(e) => handleChange("state", e.target.value)} placeholder="Auto-filled" className="field" />
                </Field>
              </div>
              
              {pinNotice && (
                <p className={`text-[11px] ${pinNotice.includes("Invalid") ? "text-red-400" : "text-emerald-400"}`}>
                  {pinNotice.includes("Invalid") ? pinNotice : `• ${pinNotice}`}
                </p>
              )}
            </section>
          </div>

          {/* ── RIGHT COLUMN: SUMMARY ── */}
          <aside id="order-summary" className="premium-card overflow-hidden lg:sticky lg:top-8">
            
            <div
              className="flex items-center justify-between px-5 py-4 lg:cursor-default cursor-pointer border-b border-white/[.04]"
              onClick={() => { if(window.innerWidth < 1024) setSummaryOpen(!summaryOpen) }}
            >
              <h2 className="font-serif text-xl text-white flex items-center gap-2">
                Your Order
                <span className="font-sans text-xs text-white/40 tracking-wider font-light">({itemCount})</span>
              </h2>
              <ChevronDown size={16} className={`text-white/40 transition-transform lg:hidden ${summaryOpen ? "rotate-180" : ""}`} />
            </div>

            <div className={`${summaryOpen ? "block" : "hidden"} lg:block p-5 space-y-6`}>
              
              {/* Items List */}
              {!cartLoaded ? (
                <p className="text-center text-xs text-white/40 py-4">Loading…</p>
              ) : cart.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-white/40 mb-4">Your bag is empty.</p>
                  <Link href="/shop" className="inline-block rounded-full bg-white/10 px-6 py-2 text-xs text-white uppercase tracking-widest hover:bg-white/20 transition">Browse Shop</Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-white/[.02] border border-white/[.04]">
                        {item.image && <Image src={item.image} alt={item.name} fill unoptimized className="object-cover p-1" />}
                        {item.size && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[8px] text-white/80 backdrop-blur-sm">{item.size}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-serif text-base text-white truncate">{item.name}</h3>
                          <span className="font-mono text-sm text-white whitespace-nowrap">{inr(item.price * item.quantity)}</span>
                        </div>
                        <p className="text-[11px] text-white/40 mt-0.5">Qty {item.quantity}</p>
                        <p className="text-[11px] text-[var(--champagne)]/70 mt-1 truncate">
                          {item.notes || "Signature Scent"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-3 pt-6 border-t border-white/[.04] text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span className="font-mono text-white/90">{inr(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span className="flex items-center gap-2">Delivery <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span></span>
                  <span className="text-emerald-400">Free</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Taxes</span>
                  <span className="text-white/90">Included</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[.08]">
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-1">Total</p>
                <p className="font-serif text-3xl text-[var(--champagne)]">{inr(totalAmount)}</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="btn-wa w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-medium uppercase tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <WhatsAppIcon size={18} /> Order on WhatsApp
                </button>
                <p className="text-center text-[11px] leading-relaxed text-white/40 mt-4 px-2">
                  Press send in WhatsApp to confirm. We'll reply with payment and delivery details.
                </p>
              </div>

              <div className="bg-white/[.02] rounded-xl p-4 flex gap-3 items-start mt-4 border border-white/[.04]">
                <Package size={18} className="text-[var(--champagne)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-white/80 mb-1">Gift Packaging</h4>
                  <p className="text-[11px] leading-relaxed text-white/40">
                    Free wax-sealed gift note & ribbon with every order.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </form>
        
        {/* Footer Trust Badges */}
        <div className="hidden lg:grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/[.04]">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-white/30" />
            <div>
              <p className="text-xs text-white/80 uppercase tracking-wider">100% Authentic</p>
              <p className="text-[11px] text-white/40">Artisanal Extract Guaranteed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-white/30" />
            <div>
              <p className="text-xs text-white/80 uppercase tracking-wider">Hand-Poured</p>
              <p className="text-[11px] text-white/40">Batch-Certified Flacons</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-white/30" />
            <div>
              <p className="text-xs text-white/80 uppercase tracking-wider">WhatsApp Support</p>
              <p className="text-[11px] text-white/40">Direct Tracking Updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.08] bg-[var(--bg)]/95 px-4 pt-3 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div className="leading-tight">
            <p className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-0.5">Total</p>
            <p className="font-serif text-lg text-[var(--champagne)]">{inr(totalAmount)}</p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={cart.length === 0}
            className="btn-wa flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-medium uppercase tracking-wider text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <WhatsAppIcon size={16} /> Order on WhatsApp
          </button>
        </div>
        <p className="text-center text-[9px] text-white/30 mt-2">Press send in WhatsApp to confirm</p>
      </div>
    </main>
  );
}