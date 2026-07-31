"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function SiteHeader({
  inverse = false,
  solid = false,
}: {
  inverse?: boolean;
  solid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/fleet") return pathname.startsWith("/fleet");
    if (href === "/my-cresta") {
      return ["/my-cresta", "/portal", "/customer-login", "/team-access"].some(
        (path) => pathname.startsWith(path),
      );
    }
    return pathname === href;
  }

  function navLink(href: string, label: string) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={active ? "is-active" : undefined}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  }

  return (
    <header
      className={[
        "site-header",
        inverse ? "site-header--inverse" : "",
        solid ? "site-header--solid" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link className="brand-link" href="/" aria-label="Cresta Marine home">
        <img
          src={
            inverse
              ? "/images/cresta-logo-white.png"
              : "/images/cresta-logo-navy.png"
          }
          alt="Cresta Marine"
        />
      </Link>
      <button
        className="menu-button"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={`site-nav ${open ? "site-nav--open" : ""}`}>
        {navLink("/fleet", "Fleet")}
        {navLink("/configure", "Configurator")}
        {navLink("/services", "Ownership")}
        {navLink("/about", "Cresta Marine")}
        {navLink("/my-cresta", "My Cresta")}
        <a
          className="whatsapp-link"
          href="https://wa.me/201224212222"
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with Cresta Marine on WhatsApp at +20 122 421 2222"
        >
          <span className="whatsapp-icon" aria-hidden="true" />
          <span className="whatsapp-handle">WhatsApp</span>
        </a>
        <a
          className="instagram-link"
          href="https://www.instagram.com/cresta_marine/"
          target="_blank"
          rel="noreferrer"
          aria-label="Cresta Marine on Instagram"
        >
          <span className="instagram-icon" aria-hidden="true" />
          <span className="instagram-handle">Instagram</span>
        </a>
      </nav>
    </header>
  );
}
