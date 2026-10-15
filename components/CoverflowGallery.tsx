"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import "./CoverflowGallery.css";

export const CATEGORIES = ["bermel", "rophnan", "shega"] as const;
export type Category = (typeof CATEGORIES)[number];

export type GalleryItem = {
  id: string;
  title: string;
  image: string;
  href: string;
  category: Category;
  credit: string;
  mediaType?: "photo" | "video";
};

type Props = {
  items: GalleryItem[];
  heading?: string;
  tagline?: string;
};

const CATEGORY_LABELS: Record<Category, string> = {
  bermel: "Bermel Fest",
  rophnan: "Rophnan",
  shega: "Shega Events",
};

const VISIBLE_RANGE = 2; // cards shown on each side of the active one

export default function CoverflowGallery({
  items,
  heading = "All moments",
  tagline = "A different angle. A new memory.",
}: Props) {
  const [activeCategory, setActiveCategory] = useState<"all" | Category>("all");
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const filteredItems =
    activeCategory === "all" ? items : items.filter((item) => item.category === activeCategory);
  const total = filteredItems.length;

  const filters = [
    { id: "all" as const, label: heading, count: items.length },
    ...CATEGORIES.map((category) => ({
      id: category,
      label: CATEGORY_LABELS[category],
      count: items.filter((item) => item.category === category).length,
    })).filter((filter) => filter.count > 0),
  ];

  // Reset active card when filter changes
  useEffect(() => {
    setActive(0);
  }, [activeCategory]);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!total) return;
      setActive((a) => (a + dir + total) % total);
    },
    [total]
  );

  // keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // shortest circular distance from the active card
  const offsetOf = (i: number) => {
    let d = i - active;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  if (!total) return null;
  const current = filteredItems[active] ?? filteredItems[0];

  return (
    <section className="cf" id="gallery" aria-label="Event photograph gallery">
      {/* ── Category filters ─────────────────────────────────────── */}
      <div className="cf__filters" role="tablist" aria-label="Event categories">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === filter.id}
            className={`cf__filter-btn ${activeCategory === filter.id ? "is-active" : ""}`}
            onClick={() => setActiveCategory(filter.id)}
          >
            {filter.label} <span className="cf__filter-count">{filter.count}</span>
          </button>
        ))}
      </div>

      <header className="cf__top">
        <span className="cf__crumb">
          {String(total).padStart(2, "0")} moments /{" "}
          {activeCategory === "all" ? heading : CATEGORY_LABELS[activeCategory]}
        </span>
        <span className="cf__tagline">{tagline}</span>
      </header>

      <div className="cf__stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {filteredItems.map((item, i) => {
          const offset = offsetOf(i);
          const abs = Math.abs(offset);
          if (abs > VISIBLE_RANGE) return null;

          const style: React.CSSProperties = {
            transform: `translateX(calc(-50% + ${offset * 255}px)) translateZ(${
              -abs * 120
            }px) rotateY(${offset * -22}deg) scale(${1 - abs * 0.04})`,
            zIndex: 10 - abs,
            opacity: abs === 0 ? 1 : abs === 1 ? 0.75 : 0.45,
            filter: abs === 0 ? "none" : `blur(${abs * 1.5}px) brightness(0.7)`,
          };

          return (
            <article
              key={item.id}
              className={`cf__card ${abs === 0 ? "is-active" : ""}`}
              style={style}
              onClick={() => abs !== 0 && setActive(i)}
              aria-hidden={abs !== 0}
            >
              <div className="cf__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.title} draggable={false} loading="lazy" />
                <span className="cf__badge">{item.credit}</span>
                <div className="cf__shade" />
                <h3 className="cf__title">{item.title}</h3>
              </div>

              <a
                className="cf__foot"
                href={item.href}
                target="_blank"
                rel="noreferrer"
                tabIndex={abs === 0 ? 0 : -1}
              >
                <span className="cf__foot-left">
                  <InstagramIcon />
                  Open the original post
                </span>
                <ArrowUpRight />
              </a>
            </article>
          );
        })}
      </div>

      <div className="cf__controls">
        <button className="cf__arrow" onClick={() => go(-1)} aria-label="Previous">
          <ArrowLeft />
        </button>

        <div className="cf__counter">
          <div className="cf__num">
            {String(active + 1).padStart(2, "0")}
            <span> / {String(total).padStart(2, "0")}</span>
          </div>
          <div className="cf__caption">{current.title}</div>
        </div>

        <button className="cf__arrow" onClick={() => go(1)} aria-label="Next">
          <ArrowRight />
        </button>
      </div>

      <p className="cf__hint">Swipe or use the arrows. Every photo is credited to its original post.</p>

      <div className="cf__follow-wrap">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="cf__follow-pill">
          <div className="cf__follow-left">
            <InstagramIcon />
            <span>See the full archive</span>
          </div>
          <div className="cf__follow-right">
            <span>{INSTAGRAM_HANDLE}</span>
            <span aria-hidden="true">&#8599;</span>
          </div>
        </a>
      </div>
    </section>
  );
}

/* ---------- icons ---------- */
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const ArrowLeft = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...stroke}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const ArrowUpRight = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...stroke}>
    <path d="M7 17L17 7M8 7h9v9" />
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...stroke}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
  </svg>
);
