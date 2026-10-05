"use client";

import { useEffect, useRef, useState } from "react";

import { profile } from "@/data/profile";
import { asset } from "@/lib/assets";
import { emailHref, whatsappHref } from "@/lib/contact";

/**
 * The ways to reach Satyam, as working links. Email also copies the address
 * (a mailto link does nothing on a computer with no mail app set up), and says so.
 * Rendered by the contact card, the menu, Quick Mode and the loader with their own styles.
 */
export type ContactKind = "email" | "whatsapp" | "phone" | "linkedin" | "resume";

export function ContactLinks({
  kinds = ["email", "whatsapp", "resume", "phone", "linkedin"],
  className,
  itemClassName,
  layout = "card",
  firstRef,
}: {
  kinds?: ContactKind[];
  className?: string;
  itemClassName?: string;
  /** card: label + value; inline: value only. */
  layout?: "card" | "inline";
  firstRef?: React.Ref<HTMLAnchorElement>;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copyEmail = () => {
    const done = () => {
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2600);
    };
    try {
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(profile.contact.email).then(done, done);
      else done();
    } catch {
      done();
    }
  };

  const c = profile.contact;
  const items = kinds
    .map((k) => {
      switch (k) {
        case "email":
          return {
            k,
            label: "Email",
            value: copied ? "Copied — opening your mail app" : c.email,
            href: emailHref(),
            onClick: copyEmail,
          };
        case "whatsapp":
          return { k, label: "WhatsApp", value: `${c.whatsapp.display} ↗`, href: whatsappHref(), external: true };
        case "phone":
          return { k, label: "Phone", value: c.phone, href: c.phoneHref };
        case "linkedin":
          return c.linkedin ? { k, label: "LinkedIn", value: "Profile ↗", href: c.linkedin, external: true } : null;
        case "resume":
          return { k, label: "Resume", value: "Download PDF ↓", href: asset(profile.resumePdf), download: true };
      }
    })
    .filter(Boolean) as {
    k: ContactKind;
    label: string;
    value: string;
    href: string;
    onClick?: () => void;
    external?: boolean;
    download?: boolean;
  }[];

  return (
    <nav className={className} aria-label="Contact">
      {items.map((it, i) => (
        <a
          key={it.k}
          ref={i === 0 ? firstRef : undefined}
          className={itemClassName}
          href={it.href}
          onClick={it.onClick}
          data-contact={it.k}
          {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...(it.download ? { download: "" } : {})}
        >
          {layout === "card" ? (
            <>
              <span>{it.label}</span>
              <b aria-live={it.k === "email" ? "polite" : undefined}>{it.value}</b>
            </>
          ) : it.k === "email" ? (
            copied ? "Email copied" : c.email
          ) : (
            it.label
          )}
        </a>
      ))}
    </nav>
  );
}
