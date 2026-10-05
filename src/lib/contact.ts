import { profile } from "@/data/profile";

/** Contact links, built from src/data/profile.ts. */
export const emailHref = () => `mailto:${profile.contact.email}?subject=${encodeURIComponent("Hello from your portfolio")}`;

/** WhatsApp click-to-chat: opens the app on phones, WhatsApp Web on desktop. */
export const whatsappHref = () => {
  const w = profile.contact.whatsapp;
  return `https://wa.me/${w.number}${w.message ? `?text=${encodeURIComponent(w.message)}` : ""}`;
};
