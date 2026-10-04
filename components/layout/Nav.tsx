"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { site } from "@/data/site";
import { EASE, EASE_OUT } from "@/lib/motion";
import { useLenis } from "@/lib/smooth-scroll";
import { usePageTransition } from "./TransitionProvider";
import styles from "./Nav.module.css";

/**
 * Floating navigation. It reads the `data-theme="light"` attribute of whatever
 * section is behind it and flips its colour, and tightens after the hero.
 */
export function Nav() {
  const { navigate, ready } = usePageTransition();
  const pathname = usePathname();
  const lenis = useLenis();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const probe = 36;
      let light = false;
      document.querySelectorAll<HTMLElement>("[data-theme='light']").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom >= probe) light = true;
      });
      setTheme(light ? "light" : "dark");
      setScrolled(window.scrollY > window.innerHeight * 0.6);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  const go = (e: React.MouseEvent, href: string, label?: string) => {
    e.preventDefault();
    if (open) {
      setOpen(false);
      window.setTimeout(() => navigate({ href, mode: "curtain", label }), 650);
    } else navigate({ href, mode: "curtain", label });
  };

  return (
    <>
      <motion.header
        className={styles.nav}
        data-theme={open ? "dark" : theme}
        data-scrolled={scrolled || undefined}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : -16 }}
        transition={{ duration: 1.1, ease: EASE_OUT, delay: pathname === "/" ? 1.6 : 0.3 }}
      >
        <a href="/" className={styles.brand} onClick={(e) => go(e, "/#top", "Satyam Bhardwaj")} data-cursor="link">
          <span className={styles.brandName}>{site.name.first}</span>
          <span className={styles.brandRole}>Film Producer</span>
        </a>

        <nav className={styles.links} aria-label="Primary">
          {site.nav.map((item, i) => (
            <a key={item.href} href={item.href} className={styles.link} onClick={(e) => go(e, item.href, item.label)} data-cursor="link">
              <span className={styles.linkIndex}>0{i + 1}</span>
              <span className={styles.linkText}>
                <span>{item.label}</span>
                <span aria-hidden>{item.label}</span>
              </span>
            </a>
          ))}
        </nav>

        <button
          className={styles.burger}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span className={styles.burgerLabel}>{open ? "Close" : "Menu"}</span>
          <span className={styles.burgerLines} data-open={open || undefined}>
            <i />
            <i />
          </span>
        </button>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className={styles.menu}
            initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
            animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
            exit={{ clipPath: "inset(0% 0% 100% 0%)", transition: { duration: 0.7, ease: EASE, delay: 0.15 } }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <nav className={styles.menuLinks} aria-label="Mobile">
              {[{ label: "Home", href: "/#top" }, ...site.nav].map((item, i) => (
                <div key={item.href} className={styles.menuMask}>
                  <motion.a
                    href={item.href}
                    className={styles.menuLink}
                    onClick={(e) => go(e, item.href, item.label)}
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "-110%", transition: { duration: 0.5, ease: EASE, delay: i * 0.03 } }}
                    transition={{ duration: 1, ease: EASE_OUT, delay: 0.35 + i * 0.07 }}
                  >
                    <span className={styles.menuIndex}>0{i + 1}</span>
                    {item.label}
                  </motion.a>
                </div>
              ))}
            </nav>
            <motion.div
              className={styles.menuFoot}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.8, duration: 0.8 } }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              <a href={site.contact.phoneHref}>{site.contact.phone}</a>
              <span>{site.contact.locations}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
