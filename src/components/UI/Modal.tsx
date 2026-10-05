"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * A dialog: traps focus while open, closes on Esc or a click outside, and
 * gives focus back to whatever opened it.
 */
export function Modal({
  label,
  onClose,
  className,
  children,
  initialFocus,
}: {
  label: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
  initialFocus?: React.RefObject<HTMLElement | null>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const first = initialFocus?.current ?? box.current?.querySelector<HTMLElement>("button, a[href], [tabindex]");
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close.current();
        return;
      }
      if (e.key !== "Tab" || !box.current) return;
      const items = [...box.current.querySelectorAll<HTMLElement>("button, a[href], input, [tabindex]:not([tabindex='-1'])")].filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
      );
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      opener?.focus?.({ preventScroll: true });
    };
  }, [initialFocus]);

  return (
    <div
      ref={box}
      className={className}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-ui-scroll
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}
