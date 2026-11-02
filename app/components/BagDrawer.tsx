"use client";

/* Put this file at app/components/BagDrawer.tsx.
   Render it inside an element that has the "ix-root" class (the shop and product pages do). */

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { FALLBACK_IMG, inr, type CartLine } from "@/app/lib/store";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function BagDrawer({
  open,
  onClose,
  lines,
  count,
  subtotal,
  changeQty,
}: {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  count: number;
  subtotal: number;
  changeQty: (key: string, d: number) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />
          <motion.aside
            role="dialog"
            aria-label="Your bag"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ duration: 0.55, ease: EASE }}
            className="panel fixed bottom-3 right-3 top-3 z-50 flex w-[calc(100%-1.5rem)] max-w-sm flex-col overflow-hidden rounded-[1.5rem]"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-serif text-xl text-white">
                Your bag <span className="text-sm text-white/40">({count})</span>
              </h2>
              <button
                onClick={onClose}
                aria-label="Close bag"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <ShoppingBag size={24} className="text-[#b3122a]" />
                </span>
                <p className="font-serif text-xl text-white">Your bag is empty</p>
                <button onClick={onClose} className="btn-primary rounded-full px-6 py-3 text-sm font-medium text-white">
                  Keep browsing
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
                  {lines.map((l) => (
                    <li
                      key={l.key}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5"
                    >
                      <div className={`relative h-16 w-12 shrink-0 ${l.inStock ? "" : "opacity-50 grayscale"}`}>
                        <Image src={l.product.image || FALLBACK_IMG} alt={l.product.name} fill unoptimized sizes="48px" className="object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-base text-white">{l.product.name}</p>
                        <p className="text-[11px] text-white/45">{l.ml ? `${l.ml} ml` : l.product.concentration || "Eau de parfum"}</p>

                        {l.inStock ? (
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1 text-white/70">
                              <button onClick={() => changeQty(l.key, -1)} aria-label={`Remove one ${l.product.name}`} className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white">
                                <Minus size={12} />
                              </button>
                              <span className="min-w-4 text-center font-mono text-xs text-white">{l.qty}</span>
                              <button onClick={() => changeQty(l.key, 1)} aria-label={`Add one ${l.product.name}`} className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white">
                                <Plus size={12} />
                              </button>
                            </div>
                            <span className="font-mono text-xs text-white">{inr(l.price * l.qty)}</span>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] text-red-300">Out of stock</span>
                            <button onClick={() => changeQty(l.key, -l.qty)} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80 transition hover:bg-white/15">
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="m-3 rounded-[1.25rem] border border-white/10 bg-black/30 p-4">
                  <div className="mb-3 flex items-baseline justify-between">
                    <span className="text-xs text-white/60">Total</span>
                    <span className="font-mono text-lg text-[var(--champagne)]">{inr(subtotal)}</span>
                  </div>
                  {count > 0 ? (
                    <Link href="/checkout" className="btn-primary flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium text-white">
                      Proceed to checkout <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <p className="rounded-full bg-white/5 py-3 text-center text-xs text-white/45">Nothing in stock to check out</p>
                  )}
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}