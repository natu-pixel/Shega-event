"use client";

import { useEffect, useRef, useState } from "react";
import "./Navbar.css";

export type NavLink = { label: string; href: string }; // href like "#gallery"

type Props = {
  logoSrc?: string; // path to your logo image (svg/png)
  logoAlt?: string;
  links?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
};

const DEFAULT_LINKS: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "Gallery", href: "#gallery" },
  { label: "About Us", href: "#about" },
  { label: "Partners", href: "#partners" },
];

export default function Navbar({
  logoSrc = "/brand/shega-events-white.png",
  logoAlt = "Shega Events",
  links = DEFAULT_LINKS,
  ctaLabel = "Let's Talk",
  ctaHref = "#contact",
}: Props) {
  const [scrolled, setScrolled] = useState(false); // past the top -> frosted glass
  const [hidden, setHidden] = useState(false); // hide while scrolling down
  const [open, setOpen] = useState(false); // mobile menu
  const [activeId, setActiveId] = useState(links[0]?.href ?? "");
  const lastY = useRef(0);

  /* scroll behaviour: glass after 24px, hide on scroll down, show on scroll up */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (!open) {
        if (y > lastY.current && y > 160) setHidden(true);
        else if (y < lastY.current) setHidden(false);
      }
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  /* scroll-spy: highlight the link of the section in view */
  useEffect(() => {
    const els = links
      .map((l) => document.querySelector(l.href))
      .filter(Boolean) as Element[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId("#" + e.target.id);
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [links]);

  /* lock body scroll while mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`nv ${scrolled ? "is-glass" : ""} ${hidden ? "is-hidden" : ""}`}
      >
        <div className="nv__inner">
          <a href="#home" className="nv__logo" aria-label={logoAlt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt={logoAlt} height={40} />
          </a>

          <nav className="nv__links" aria-label="Primary">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={activeId === l.href ? "is-active" : ""}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="nv__right">
            <a href={ctaHref} className="nv__cta">
              <span>{ctaLabel}</span>
            </a>
            <button
              className={`nv__burger ${open ? "is-open" : ""}`}
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <i />
              <i />
            </button>
          </div>
        </div>
      </header>

      {/* mobile overlay */}
      <div className={`nv__sheet ${open ? "is-open" : ""}`}>
        {links.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms" }}
          >
            {l.label}
          </a>
        ))}
        <a
          href={ctaHref}
          className="nv__sheet-cta"
          onClick={() => setOpen(false)}
        >
          {ctaLabel}
        </a>
      </div>
    </>
  );
}
