// lib/guest.ts — anonymous guest identity for the storefront
export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "";
  let guestId = localStorage.getItem("iwahh_guest_id");
  if (!guestId) {
    guestId = "guest_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("iwahh_guest_id", guestId);
  }
  return guestId;
}