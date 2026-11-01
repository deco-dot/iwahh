"use client";

import { useEffect, useMemo, useRef, useState, useCallback, type DragEvent, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { db } from "@/app/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { MOOD_FAMILIES } from "@/app/lib/products";
import { Trash2, Edit3, X, Plus, Save, Package, UploadCloud, Loader2, Check, Phone, Link2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Settings you may want to change                                     */
/* ------------------------------------------------------------------ */

/* Add NEXT_PUBLIC_IMGBB_API_KEY=your_key to .env.local (get a free key at https://api.imgbb.com) */
const IMGBB_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
const MAX_IMAGE_MB = 32; // ImgBB limit
const FALLBACK_IMG = "https://iili.io/nwL32Fn.png";
const DEFAULT_WHATSAPP = "917994654204";
const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC = "store";
const ORDER_STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"] as const;

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  notes: string[];
  tag?: string;
  concentration?: string;
  description?: string;
  inStock?: boolean; // missing = in stock
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  customer?: { name?: string; email?: string; phone?: string; address?: string };
  items?: OrderItem[];
}

const inr = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN")}`;
const isInStock = (p: Product) => p.inStock !== false;

/* Same look as the storefront */
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
}
.ix-root .btn-primary {
  background: linear-gradient(135deg,#a3081c 0%,#720000 60%,#560000 100%);
  box-shadow: 0 8px 22px rgba(114,0,0,.45), inset 0 1px 0 rgba(255,255,255,.22);
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, opacity .3s;
}
.ix-root .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(179,18,42,.5), inset 0 1px 0 rgba(255,255,255,.3); }
.ix-root .field {
  width: 100%; border-radius: .875rem; border: 1px solid rgba(255,255,255,.1);
  background: rgba(255,255,255,.05); padding: .65rem .9rem; font-size: 16px; color: #fff; outline: none;
  transition: border-color .25s, background .25s, box-shadow .25s;
}
@media (min-width: 640px) { .ix-root .field { font-size: .875rem; } }
.ix-root .field::placeholder { color: rgba(255,255,255,.28); }
.ix-root .field:focus { border-color: #b3122a; background: rgba(255,255,255,.07); box-shadow: 0 0 0 3px rgba(179,18,42,.18); }
.ix-root select option { background: #140606; color: #fff; }
.ix-root :focus-visible { outline: 2px solid var(--champagne); outline-offset: 2px; }
`;

/* ------------------------------------------------------------------ */
/*  Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block pl-1 text-xs text-white/60">{label}</span>
      {children}
      {hint && <span className="mt-1 block pl-1 text-[11px] text-white/35">{hint}</span>}
    </label>
  );
}

function Card({ title, desc, children, right }: { title: string; desc?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="glass rounded-[1.25rem] p-4 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-light text-white">{title}</h2>
          {desc && <p className="mt-0.5 text-xs text-white/45">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-emerald-500/80" : "bg-white/15"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
    </button>
  );
}

function Toast({ toast }: { toast: { type: "ok" | "error"; text: string } | null }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      className={`glass fixed inset-x-3 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-2.5 rounded-full px-4 py-3 text-sm ${
        toast.type === "ok" ? "text-emerald-300" : "text-[#ff8a8a]"
      }`}
    >
      {toast.type === "ok" ? <Check size={16} /> : <X size={16} />}
      <span className="text-white/90">{toast.text}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Image upload: drag & drop, choose file, or paste a link → ImgBB     */
/* ------------------------------------------------------------------ */

async function uploadToImgBB(file: File): Promise<string> {
  if (!IMGBB_KEY) throw new Error("ImgBB key is missing. Add NEXT_PUBLIC_IMGBB_API_KEY to .env.local and restart.");
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`Image is too large. Maximum is ${MAX_IMAGE_MB} MB.`);

  const body = new FormData();
  body.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Upload failed. Please try again.");
  return json.data.url as string; // original file link (keeps PNG transparency)
}

function ImageUploader({
  value,
  onChange,
  onError,
}: {
  value: string;
  onChange: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToImgBB(file);
      onChange(url);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <span className="mb-1 block pl-1 text-xs text-white/60">Product image</span>

      {value ? (
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3">
          <div className="relative h-24 w-20 shrink-0 rounded-xl bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Product preview" className="h-full w-full object-contain p-1" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-[11px] text-white/40">{value}</p>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-full bg-white/10 px-3.5 py-1.5 text-xs text-white transition hover:bg-white/15">
                {uploading ? "Uploading…" : "Replace"}
                <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} />
              </label>
              <button type="button" onClick={() => onChange("")} className="rounded-full bg-red-500/10 px-3.5 py-1.5 text-xs text-red-300 transition hover:bg-red-500/20">
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition focus-within:border-[#b3122a] ${
            dragging ? "border-[#b3122a] bg-[#b3122a]/10" : "border-white/15 bg-white/[0.03] hover:border-white/30"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="animate-spin text-[var(--champagne)]" />
              <p className="text-sm text-white/70">Uploading image…</p>
            </>
          ) : (
            <>
              <UploadCloud size={26} className="text-[var(--champagne)]" />
              <p className="text-sm text-white">
                <span className="hidden sm:inline">Drag and drop an image here, or </span>
                <span className="underline underline-offset-4">tap to choose</span>
              </p>
              <p className="text-[11px] text-white/40">PNG, JPG or WebP, up to {MAX_IMAGE_MB} MB. Transparent PNG works best.</p>
            </>
          )}
          <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      )}

      {/* Other option: paste a link */}
      <button type="button" onClick={() => setShowLink((s) => !s)} className="mt-2 flex items-center gap-1.5 pl-1 text-xs text-white/50 transition hover:text-white">
        <Link2 size={13} /> {showLink ? "Hide link option" : "Or paste an image link"}
      </button>
      {showLink && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://i.ibb.co/..."
          className="field mt-2"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Products                                                            */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
  name: "",
  category: MOOD_FAMILIES[0]?.name || "Woody",
  price: "12500",
  image: "",
  notes: "",
  tag: "",
  concentration: "Eau de Parfum",
  description: "",
  inStock: true,
};

function ProductsManager({
  products,
  loading,
  refresh,
  notify,
}: {
  products: Product[];
  loading: boolean;
  refresh: () => void;
  notify: (type: "ok" | "error", text: string) => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const formRef = useRef<HTMLDivElement>(null);

  const setField = <K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category || EMPTY_FORM.category,
      price: String(p.price ?? ""),
      image: p.image || "",
      notes: p.notes ? p.notes.join(", ") : "",
      tag: p.tag || "",
      concentration: p.concentration || "",
      description: p.description || "",
      inStock: isInStock(p),
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        image: form.image.trim(),
        notes: form.notes.split(",").map((n) => n.trim()).filter(Boolean),
        tag: form.tag.trim() || null,
        concentration: form.concentration.trim(),
        description: form.description.trim(),
        inStock: form.inStock,
        updatedAt: new Date().toISOString(),
      };
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), data);
        notify("ok", `Updated “${data.name}”`);
      } else {
        await addDoc(collection(db, "products"), { ...data, createdAt: new Date().toISOString() });
        notify("ok", `Added “${data.name}”`);
      }
      resetForm();
      refresh();
    } catch (err) {
      console.error(err);
      notify("error", "Could not save. Check your Firebase rules.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStock = async (p: Product) => {
    try {
      await updateDoc(doc(db, "products", p.id), { inStock: !isInStock(p) });
      notify("ok", `${p.name} is now ${isInStock(p) ? "out of stock" : "in stock"}`);
      refresh();
    } catch (err) {
      console.error(err);
      notify("error", "Could not update stock.");
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "products", p.id));
      if (editingId === p.id) resetForm();
      notify("ok", `Deleted “${p.name}”`);
      refresh();
    } catch (err) {
      console.error(err);
      notify("error", "Could not delete.");
    }
  };

  const outCount = products.filter((p) => !isInStock(p)).length;
  const shown = useMemo(
    () => products.filter((p) => (filter === "all" ? true : filter === "in" ? isInStock(p) : !isInStock(p))),
    [products, filter]
  );

  return (
    <div className="space-y-5">
      {/* Add / edit form */}
      <div ref={formRef} className="scroll-mt-20">
        <Card
          title={editingId ? "Edit product" : "Add a product"}
          right={
            editingId && (
              <button type="button" onClick={resetForm} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15">
                <X size={13} /> Cancel
              </button>
            )
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUploader value={form.image} onChange={(v) => setField("image", v)} onError={(m) => notify("error", m)} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Name">
                <input required value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Santal Minuit" className="field" />
              </Field>
              <Field label="Price (₹)">
                <input required type="number" inputMode="numeric" min={0} value={form.price} onChange={(e) => setField("price", e.target.value)} className="field" />
              </Field>
              <Field label="Scent family">
                <select value={form.category} onChange={(e) => setField("category", e.target.value)} className="field">
                  {MOOD_FAMILIES.map((f: { name: string }) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Badge (optional)">
                <input value={form.tag} onChange={(e) => setField("tag", e.target.value)} placeholder="New, Bestseller" className="field" />
              </Field>
            </div>

            <Field label="Notes" hint="Separate with commas">
              <input value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Sandalwood, Iris, Soft musk" className="field" />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Type">
                <input value={form.concentration} onChange={(e) => setField("concentration", e.target.value)} placeholder="Eau de Parfum" className="field" />
              </Field>
              <Field label="Short description">
                <input value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="One or two lines" className="field" />
              </Field>
            </div>

            {/* Stock */}
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
              <div>
                <p className="text-sm text-white">{form.inStock ? "In stock" : "Out of stock"}</p>
                <p className="text-[11px] text-white/40">Out of stock products show on the shop but cannot be added to the bag.</p>
              </div>
              <Switch on={form.inStock} onChange={() => setField("inStock", !form.inStock)} label="In stock" />
            </div>

            <button type="submit" disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium text-white disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : editingId ? <Save size={15} /> : <Plus size={15} />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
            </button>
          </form>
        </Card>
      </div>

      {/* Product list */}
      <Card title={`Products (${products.length})`} desc="Switch a product to out of stock when it sells out.">
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["all", `All (${products.length})`],
              ["in", `In stock (${products.length - outCount})`],
              ["out", `Out of stock (${outCount})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={`rounded-full px-3.5 py-1.5 text-xs transition ${
                filter === key ? "bg-gradient-to-br from-[#a3081c] to-[#720000] text-white" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-10 text-center text-xs text-white/40">Loading products…</p>
        ) : shown.length === 0 ? (
          <p className="py-10 text-center text-xs text-white/40">{products.length === 0 ? "No products yet. Add your first one above." : "Nothing here."}</p>
        ) : (
          <ul className="space-y-3">
            {shown.map((p) => {
              const inStock = isInStock(p);
              return (
                <li key={p.id} className="flex flex-col gap-3 rounded-2xl bg-white/[0.04] p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={`relative h-16 w-12 shrink-0 ${inStock ? "" : "opacity-50 grayscale"}`}>
                      <Image src={p.image || FALLBACK_IMG} alt={p.name} fill unoptimized className="object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-serif text-base text-white">{p.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${inStock ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                          {inStock ? "In stock" : "Out of stock"}
                        </span>
                      </div>
                      <p className="text-xs text-white/45">
                        {p.category}, {inr(p.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 sm:border-0 sm:pt-0">
                    <label className="flex items-center gap-2 text-xs text-white/60">
                      <Switch on={inStock} onChange={() => toggleStock(p)} label={`${p.name} in stock`} />
                      <span>{inStock ? "In stock" : "Out"}</span>
                    </label>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(p)} aria-label={`Edit ${p.name}`} className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-xs text-white transition hover:bg-white/15">
                        <Edit3 size={13} /> Edit
                      </button>
                      <button onClick={() => handleDelete(p)} aria-label={`Delete ${p.name}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-300 transition hover:bg-red-500/20">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Orders + WhatsApp number                                            */
/* ------------------------------------------------------------------ */

function normalizeNumber(v: string) {
  const digits = v.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits; // 10 digits = Indian number
}

function WhatsAppSettings({ notify }: { notify: (type: "ok" | "error", text: string) => void }) {
  const [saved, setSaved] = useState(DEFAULT_WHATSAPP);
  const [value, setValue] = useState(DEFAULT_WHATSAPP);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC));
        const n = snap.exists() ? (snap.data().whatsappNumber as string | undefined) : undefined;
        if (n) {
          setSaved(n);
          setValue(n);
        }
      } catch (err) {
        console.error("Could not load settings", err);
      }
    })();
  }, []);

  const normalized = normalizeNumber(value);
  const valid = normalized.length >= 10 && normalized.length <= 15;
  const changed = normalized !== saved;

  const save = async () => {
    if (!valid) {
      notify("error", "Enter a valid number with country code.");
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC), { whatsappNumber: normalized, updatedAt: new Date().toISOString() }, { merge: true });
      setSaved(normalized);
      setValue(normalized);
      notify("ok", "WhatsApp number saved. Checkout now uses it.");
    } catch (err) {
      console.error(err);
      notify("error", "Could not save. Check your Firebase rules.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="WhatsApp number" desc="Customer orders are sent to this number from the checkout page.">
      <div className="space-y-3">
        <Field label="Number with country code" hint="Example: 91 98765 43210. A 10-digit number is treated as Indian (+91).">
          <div className="relative">
            <Phone size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
            <input type="tel" inputMode="tel" value={value} onChange={(e) => setValue(e.target.value)} placeholder="91 98765 43210" className="field !pl-9" />
          </div>
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={save} disabled={saving || !valid || !changed} className="btn-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save number
          </button>
          <a
            href={`https://wa.me/${normalized}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-full bg-white/10 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/15 ${valid ? "" : "pointer-events-none opacity-40"}`}
          >
            Test on WhatsApp
          </a>
        </div>
        <p className="text-[11px] text-white/35">Currently used: +{saved}</p>
      </div>
    </Card>
  );
}

function OrdersManager({ notify }: { notify: (type: "ok" | "error", text: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "orders"));
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
      items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setOrders(items);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const setStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "orders", id), { status });
      setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
      notify("ok", `Order marked ${status}`);
    } catch (err) {
      console.error(err);
      notify("error", "Could not update the order.");
    }
  };

  return (
    <div className="space-y-5">
      <WhatsAppSettings notify={notify} />

      <Card title={`Orders (${orders.length})`} desc="Orders saved to the database.">
        {loading ? (
          <p className="py-10 text-center text-xs text-white/40">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-xs text-white/40">
            <Package size={22} className="text-white/25" />
            No orders saved yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="space-y-3 rounded-2xl bg-white/[0.04] p-4 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{o.customer?.name || "Guest"}</p>
                    <p className="text-[11px] text-white/40">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "Date unknown"}</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm text-[var(--champagne)]">{inr(o.totalAmount)}</p>
                </div>

                <div className="space-y-0.5 text-white/60">
                  {o.customer?.phone && <p>{o.customer.phone}</p>}
                  {o.customer?.email && <p className="break-all">{o.customer.email}</p>}
                  {o.customer?.address && <p className="text-white/45">{o.customer.address}</p>}
                </div>

                <ul className="space-y-1 border-t border-white/10 pt-3 text-white/80">
                  {o.items?.map((item, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>
                        {item.name} <span className="text-white/40">x{item.quantity}</span>
                      </span>
                      <span className="font-mono text-white/55">{inr(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                <label className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <span className="text-white/50">Status</span>
                  <select value={o.status || "Pending"} onChange={(e) => setStatus(o.id, e.target.value)} className="field !w-auto !py-1.5 !text-xs">
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminPage() {
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((type: "ok" | "error", text: string) => {
    setToast({ type, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "products"));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[]);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [fetchInventory]);

  return (
    <main className="ix-root relative min-h-screen bg-[var(--bg)] px-4 pb-24 pt-6 text-[var(--fg)] antialiased">
      <style>{STYLES}</style>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(179,18,42,0.2),transparent)]" />

      <div className="relative z-10 mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="font-serif text-xs italic text-[var(--champagne)]">IWAHH</p>
            <h1 className="font-serif text-2xl font-light text-white sm:text-3xl">Store admin</h1>
          </div>
          <a href="/shop" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-4 py-2 text-xs text-white/80 transition hover:bg-white/15">
            View shop
          </a>
        </header>

        {/* Tabs */}
        <nav className="glass sticky top-3 z-20 grid grid-cols-2 gap-1 rounded-full p-1 backdrop-blur-xl" aria-label="Sections">
          {(
            [
              ["products", "Products"],
              ["orders", "Orders"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
              className={`rounded-full py-2.5 text-sm transition ${
                tab === key ? "bg-gradient-to-br from-[#a3081c] to-[#720000] font-medium text-white shadow-[0_6px_18px_rgba(114,0,0,0.5)]" : "text-white/55 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "products" && <ProductsManager products={products} loading={loading} refresh={fetchInventory} notify={notify} />}
        {tab === "orders" && <OrdersManager notify={notify} />}
      </div>

      <Toast toast={toast} />
    </main>
  );
}