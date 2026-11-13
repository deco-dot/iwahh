"use client";

import { useState, useEffect, useMemo, useRef, type FormEvent, type ReactNode } from "react";
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
  MapPin,
} from "lucide-react";
import { db } from "@/app/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getOrCreateGuestId } from "@/app/lib/guest";

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

interface AddressForm {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  postalCode: string;
  address: string;
  city: string;
  state: string;
}

const EMPTY_FORM: AddressForm = {
  name: "",
  email: "",
  countryCode: "+91",
  phone: "",
  postalCode: "",
  address: "",
  city: "",
  state: "",
};

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
  --champagne-bright: #f4e3c6;
  --border: rgba(255,255,255,.06);
  --border-focus: rgba(233,207,169,.35);
  --gold-gradient: linear-gradient(135deg, #c9a24b 0%, #f4e3c6 45%, #d4af6a 75%, #b08d3e 100%);
}
.ix-root .font-serif { font-family: 'Bodoni Moda','Times New Roman',serif !important; font-weight: 400; }
.ix-root ::selection { background:#720000; color:#fff; }

/* film grain */
.ix-root .grain::after {
  content: ""; position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: .035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* entrance choreography */
@keyframes ixRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ixFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ixShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.ix-root .rise { opacity: 0; animation: ixRise .7s cubic-bezier(.22,1,.36,1) forwards; }
.ix-root .rise-1 { animation-delay: .05s; } .ix-root .rise-2 { animation-delay: .15s; }
.ix-root .rise-3 { animation-delay: .25s; } .ix-root .rise-4 { animation-delay: .35s; }
.ix-root .rise-5 { animation-delay: .45s; } .ix-root .rise-6 { animation-delay: .55s; }
.ix-root .fade-in { opacity: 0; animation: ixFade 1.2s ease forwards; }

/* gold serif accent */
.ix-root .gold-text {
  background: var(--gold-gradient); background-size: 200% auto;
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

/* premium card with champagne hairline */
.ix-root .premium-card {
  position: relative; background: linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,0) 35%), var(--panel);
  border: 1px solid var(--border); border-radius: 1.25rem;
  box-shadow: 0 20px 50px -30px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.04);
  transition: border-color .3s ease, box-shadow .3s ease;
}
.ix-root .premium-card:hover { border-color: rgba(233,207,169,.14); box-shadow: 0 24px 60px -28px rgba(0,0,0,1), inset 0 1px 0 rgba(255,255,255,.05); }

.ix-root .glass-nav {
  background: rgba(5,3,2,.72); border: 1px solid rgba(255,255,255,.08);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px -12px rgba(0,0,0,.8);
}

/* WhatsApp CTA with champagne shimmer sweep */
.ix-root .btn-wa {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #178f47, #1fa855 55%, #178f47);
  box-shadow: 0 4px 20px rgba(31,168,85,.25), inset 0 1px 0 rgba(255,255,255,.18);
  transition: all .25s ease;
}
.ix-root .btn-wa::before {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.28) 50%, transparent 60%);
  background-size: 250% 100%;
  animation: ixShimmer 3.5s ease-in-out infinite;
}
.ix-root .btn-wa:hover:not(:disabled) { box-shadow: 0 8px 28px rgba(31,168,85,.45), inset 0 1px 0 rgba(255,255,255,.22); transform: translateY(-1px); }
.ix-root .btn-wa:active:not(:disabled) { transform: scale(.98); }

/* fields */
.ix-root .field {
  width: 100%; border-radius: .75rem; border: 1px solid var(--border);
  background: rgba(255,255,255,.02); padding: .85rem 1rem;
  font-size: 15px; color: #fff; outline: none;
  transition: border-color .25s, background .25s, box-shadow .25s;
}
.ix-root .field::placeholder { color: rgba(255,255,255,.18); font-style: italic; }
.ix-root .field:hover { border-color: rgba(255,255,255,.12); }
.ix-root .field:focus {
  border-color: var(--border-focus); background: rgba(255,255,255,.035);
  box-shadow: 0 0 0 3px rgba(233,207,169,.07), 0 0 24px -6px rgba(233,207,169,.15);
}
.ix-root select option { background-color: #120505 !important; color: #fff !important; }
.ix-root select { appearance: none; -webkit-appearance: none; }

/* ornament divider */
.ix-root .ornament { display: flex; align-items: center; gap: .75rem; }
.ix-root .ornament::before, .ix-root .ornament::after {
  content: ""; height: 1px; flex: 1;
  background: linear-gradient(90deg, transparent, rgba(233,207,169,.22), transparent);
}
.ix-root .ornament span { color: rgba(233,207,169,.5); font-size: 8px; letter-spacing: .4em; text-transform: uppercase; }

/* number chips */
.ix-root .step-chip {
  width: 2rem; height: 2rem; border-radius: 9999px; display: grid; place-items: center;
  font-family: ui-monospace, monospace; font-size: 11px; color: var(--champagne);
  border: 1px solid rgba(233,207,169,.25); background: rgba(233,207,169,.05);
  box-shadow: 0 0 16px -6px rgba(233,207,169,.3);
}

/* scrollbar */
.ix-root ::-webkit-scrollbar { width: 8px; }
.ix-root ::-webkit-scrollbar-track { background: transparent; }
.ix-root ::-webkit-scrollbar-thumb { background: rgba(233,207,169,.15); border-radius: 8px; }
.ix-root ::-webkit-scrollbar-thumb:hover { background: rgba(233,207,169,.3); }
`;

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block pl-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
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
  const [addressLoaded, setAddressLoaded] = useState(false);

  const [formData, setFormData] = useState<AddressForm>(EMPTY_FORM);

  // ── Guest address persistence ──────────────────────────────
  const [guestId, setGuestId] = useState("");
  const addressKey = guestId ? `iwahh_address_${guestId}` : "";
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGuestId(getOrCreateGuestId());
  }, []);

  useEffect(() => {
    if (!addressKey) return;
    try {
      const saved = localStorage.getItem(addressKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AddressForm>;
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error("Failed to load saved address", err);
    } finally {
      setAddressLoaded(true);
    }
  }, [addressKey]);

  useEffect(() => {
    if (!addressLoaded || !addressKey) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(addressKey, JSON.stringify(formData));
      } catch {}
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [formData, addressKey, addressLoaded]);

  // ── Cart ───────────────────────────────────────────────────
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

  // ── Store settings ─────────────────────────────────────────
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

  // ── PIN auto-fetch ─────────────────────────────────────────
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

  // ── WhatsApp order URL ─────────────────────────────────────
  const [orderRef, setOrderRef] = useState("");

  const buildMessage = (ref: string) => {
    const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    const line = "─".repeat(18);
    const thin = "· · · · · · · · · ·";

    const itemsText = cart
      .map((item, idx) => {
        const detail = [item.size, item.notes].filter(Boolean).join(" · ");
        return (
          `${idx + 1}. *${item.name}*  ×${item.quantity}\n` +
          (detail ? `   _${detail}_\n` : "") +
          `   ${money(item.price * item.quantity)}`
        );
      })
      .join("\n\n");

    const fullPhone = `${formData.countryCode} ${formData.phone}`;

    return (
      ` IWAHH · PRIVATE COLLECTION \n\n` +
      `_Your order has been composed._\n\n` +
      `${line}\n` +
      `*ORDER REFERENCE*\n` +
      `${ref}\n\n` +
      `${line}\n` +
      `*SELECTED FRAGRANCES*\n\n` +
      `${itemsText}\n\n` +
      `${line}\n` +
      `Subtotal      ${money(totalAmount)}\n` +
      `Delivery      _Complimentary_\n` +
      `*TOTAL*        *${money(totalAmount)}*\n\n` +
      `${line}\n` +
      `*DELIVER TO*\n` +
      `${formData.name}\n` +
      `${formData.address}\n` +
      `${formData.city}, ${formData.state} — ${formData.postalCode}\n` +
      `${fullPhone}\n` +
      `${formData.email}\n\n` +
      `${thin}\n\n` +
      ``
    );
  };

  const generateOrderRef = () =>
    `IWH-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const whatsappUrl = useMemo(() => {
    const ref = orderRef || "PENDING";
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildMessage(ref))}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, formData, totalAmount, whatsappNumber, orderRef]);

  const handleWhatsAppOrder = (e: FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMessage("Your bag is empty. Add a fragrance first.");
      return;
    }
    setErrorMessage("");
    try {
      if (addressKey) localStorage.setItem(addressKey, JSON.stringify(formData));
    } catch {}
    const ref = generateOrderRef();
    setOrderRef(ref);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildMessage(ref))}`, "_blank");
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
      <main className="ix-root grain relative flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-16 text-[var(--fg)]">
        <style>{STYLES}</style>
        <div className="premium-card rise w-full max-w-md space-y-6 p-8 text-center sm:p-10">
          <div className="btn-wa mx-auto grid h-16 w-16 place-items-center rounded-full text-white">
            <WhatsAppIcon size={28} />
          </div>
          <div className="ornament"><span>Almost there</span></div>
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
            <button onClick={finishOrder} className="w-full rounded-xl border border-[rgba(233,207,169,.2)] bg-[rgba(233,207,169,.05)] py-3.5 text-sm font-medium text-[var(--champagne)] transition hover:bg-[rgba(233,207,169,.1)]">
              <span className="inline-flex items-center gap-2"><Check size={16} /> I&apos;ve sent my order</span>
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
    <main className="ix-root grain relative min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased">
      <style>{STYLES}</style>

      {/* Ambient glows */}
      <div className="fade-in pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(179,18,42,0.1),transparent)]" />
      <div className="fade-in pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_40%_30%_at_85%_110%,rgba(233,207,169,0.05),transparent)]" />

      {/* DESKTOP HEADER */}
      <header className="hidden lg:block relative z-10 border-b border-white/[.04]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5 text-[11px] uppercase tracking-[0.2em] text-white/50">
          <button onClick={() => router.back()} className="flex items-center gap-2 transition hover:text-[var(--champagne)]">
            <ArrowLeft size={14} /> Return to shop
          </button>
          <div className="flex items-center gap-2 rounded-full border border-[rgba(233,207,169,.18)] bg-[rgba(233,207,169,.05)] px-4 py-1.5 text-[var(--champagne)]/90 shadow-[0_0_20px_rgba(233,207,169,0.08)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--champagne)] animate-pulse" />
            Secure Checkout
          </div>
        </div>
      </header>

      {/* MOBILE PILL NAVBAR */}
      <nav className="glass-nav rise fixed left-1/2 top-3 z-40 flex h-12 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-full px-2 pl-4 lg:hidden">
        <button onClick={() => router.back()} className="grid h-8 w-8 place-items-center rounded-full text-white/70 hover:bg-white/10">
          <ArrowLeft size={16} />
        </button>
        <Link href="/" className="font-serif text-base tracking-[0.3em] text-white">IWAHH</Link>
        <button
          onClick={() => {
            document.getElementById("order-summary")?.scrollIntoView({ behavior: "smooth" });
            setSummaryOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-full border border-[rgba(233,207,169,.15)] bg-[rgba(233,207,169,.06)] px-3 py-1.5 text-[10px] tracking-[0.15em] text-[var(--champagne)]"
        >
          BAG {itemCount > 0 ? itemCount : ""}
        </button>
      </nav>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-32 pt-20 lg:px-8 lg:pb-16 lg:pt-14">

        {/* Page Title */}
        <div className="rise rise-1 mb-8 lg:mb-12">
          <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-[var(--champagne)]/60">The Final Touch</p>
          <h1 className="font-serif text-3xl lg:text-5xl text-white">Checkout</h1>
          <p className="mt-2 hidden text-sm font-light text-white/45 lg:block">
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
            <section className="premium-card rise rise-2 p-5 space-y-5 lg:p-8 lg:space-y-6">
              <div className="flex items-center justify-between border-b border-white/[.04] pb-4">
                <div className="flex items-center gap-3">
                  <span className="step-chip">01</span>
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

              {/* Phone Field */}
              <Field label="WhatsApp Number">
                <div className="flex overflow-hidden rounded-xl border border-[var(--border)] bg-white/[.02] transition focus-within:border-[var(--border-focus)] focus-within:bg-white/[.04] focus-within:shadow-[0_0_0_3px_rgba(233,207,169,.07)]">
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
            <section className="premium-card rise rise-3 p-5 space-y-5 lg:p-8 lg:space-y-6">
              <div className="flex items-center justify-between border-b border-white/[.04] pb-4">
                <div className="flex items-center gap-3">
                  <span className="step-chip">02</span>
                  <h2 className="font-serif text-xl text-white">Shipping Address</h2>
                </div>
                {addressLoaded && formData.name && (
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-emerald-400/80">
                    <MapPin size={11} /> Saved for you
                  </span>
                )}
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
          <aside id="order-summary" className="premium-card rise rise-4 overflow-hidden lg:sticky lg:top-8">

            <div
              className="flex items-center justify-between border-b border-white/[.04] px-5 py-4 lg:cursor-default cursor-pointer"
              onClick={() => { if (window.innerWidth < 1024) setSummaryOpen(!summaryOpen); }}
            >
              <h2 className="font-serif text-xl text-white flex items-center gap-2">
                Your Order
                <span className="font-sans text-xs font-light tracking-wider text-white/40">({itemCount})</span>
              </h2>
              <ChevronDown size={16} className={`text-white/40 transition-transform lg:hidden ${summaryOpen ? "rotate-180" : ""}`} />
            </div>

            <div className={`${summaryOpen ? "block" : "hidden"} lg:block p-5 space-y-6 lg:p-6`}>

              {/* Items List */}
              {!cartLoaded ? (
                <p className="py-4 text-center text-xs text-white/40">Loading…</p>
              ) : cart.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="mb-4 text-sm font-light text-white/40">Your bag is empty.</p>
                  <Link href="/shop" className="inline-block rounded-full border border-[rgba(233,207,169,.25)] bg-[rgba(233,207,169,.06)] px-6 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--champagne)] transition hover:bg-[rgba(233,207,169,.12)]">Browse Shop</Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {cart.map((item, idx) => (
                    <div key={item.id} className={`flex gap-4 ${idx > 0 ? "pt-5 border-t border-white/[.04]" : ""}`}>
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md border border-[rgba(233,207,169,.1)] bg-white/[.02]">
                        {item.image && <Image src={item.image} alt={item.name} fill unoptimized className="object-cover p-1" />}
                        {item.size && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[8px] text-white/80 backdrop-blur-sm">{item.size}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate font-serif text-base text-white">{item.name}</h3>
                          <span className="whitespace-nowrap font-mono text-sm text-[var(--champagne)]">{inr(item.price * item.quantity)}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-light text-white/40">Qty {item.quantity}</p>
                        <p className="mt-1 truncate text-[11px] italic text-[var(--champagne)]/60">
                          {item.notes || "Signature Scent"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-3 border-t border-white/[.04] pt-6 text-sm font-light">
                <div className="flex justify-between text-white/55">
                  <span>Subtotal</span>
                  <span className="font-mono text-white/90">{inr(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-white/55">
                  <span className="flex items-center gap-2">Delivery <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span></span>
                  <span className="text-emerald-400">Free</span>
                </div>
                <div className="flex justify-between text-white/55">
                  <span>Taxes</span>
                  <span className="text-white/90">Included</span>
                </div>
              </div>

              <div className="border-t border-[rgba(233,207,169,.12)] pt-4">
                <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/40">Total</p>
                <p className="gold-text font-serif text-3xl sm:text-4xl">{inr(totalAmount)}</p>
              </div>

              <div className="pt-2">
                {errorMessage && (
                  <p className="mb-3 text-center text-[11px] text-red-400">{errorMessage}</p>
                )}
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="btn-wa flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-medium uppercase tracking-[0.15em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <WhatsAppIcon size={18} /> Order on WhatsApp
                </button>
                <p className="mt-4 px-2 text-center text-[11px] font-light leading-relaxed text-white/40">
                  Press send in WhatsApp to confirm. We&apos;ll reply with payment and delivery details.
                </p>
              </div>

             {/* <div className="mt-4 flex items-start gap-3 rounded-xl border border-[rgba(233,207,169,.1)] bg-[rgba(233,207,169,.04)] p-4">
                <Package size={18} className="mt-0.5 shrink-0 text-[var(--champagne)]" />
                <div>
                  <h4 className="mb-1 text-[11px] uppercase tracking-[0.15em] text-white/80">Gift Packaging</h4>
                  <p className="text-[11px] font-light leading-relaxed text-white/40">
                    Free wax-sealed gift note & ribbon with every order.
                  </p>
                </div> 
              </div>*/}
            </div>
          </aside>
        </form>

        {/* Footer Trust Badges */}
       
      </div>

      {/* MOBILE STICKY CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(233,207,169,.1)] bg-[#050302]/95 px-4 pt-3 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-md items-center gap-4">
          <div className="leading-tight">
            <p className="mb-0.5 text-[9px] uppercase tracking-[0.2em] text-white/40">Total</p>
            <p className="gold-text font-serif text-lg">{inr(totalAmount)}</p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={cart.length === 0}
            className="btn-wa flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <WhatsAppIcon size={16} /> Order on WhatsApp
          </button>
        </div>
        <p className="mt-2 text-center text-[9px] font-light text-white/30">Press send in WhatsApp to confirm</p>
      </div>
    </main>
  );
}