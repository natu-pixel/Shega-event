"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { FEATURED_EVENTS } from "@/lib/events";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const ease = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export function FeaturedEvents() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = Array.from(section.querySelectorAll<HTMLElement>(".shega-event-card"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const render = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (reducedMotion.matches) {
          cards.forEach((card) => {
            card.style.opacity = "1";
            card.style.transform = "none";
            card.style.pointerEvents = "auto";
            card.setAttribute("aria-hidden", "false");
            const detailLink = card.querySelector<HTMLAnchorElement>(".shega-event-card-copy a");
            if (detailLink) detailLink.tabIndex = 0;
          });
          return;
        }

        const bounds = section.getBoundingClientRect();
        const scrollRange = Math.max(1, section.offsetHeight - window.innerHeight);
        const progress = clamp(-bounds.top / scrollRange, 0, 1);
        const step = progress * (cards.length - 1 + 0.3) - 0.15;

        cards.forEach((card, index) => {
          const enter = index === 0 ? 1 : ease((step - (index - 0.15)) / 0.3);
          const leave = index === cards.length - 1 ? 1 : 1 - ease((step - (index + 0.85)) / 0.3);
          const visibility = Math.min(enter, leave);
          const local = clamp(step - index, 0, 1);
          const scale = 0.965 + 0.035 * enter - 0.018 * (1 - leave);
          const imageScale = 1.09 - 0.09 * local;
          const y = (1 - enter) * 34 - (1 - leave) * 18;

          card.style.opacity = String(visibility);
          card.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
          card.style.zIndex = String(index + 1);
          card.style.pointerEvents = visibility > 0.5 ? "auto" : "none";
          card.setAttribute("aria-hidden", visibility > 0.05 ? "false" : "true");
          const detailLink = card.querySelector<HTMLAnchorElement>(".shega-event-card-copy a");
          if (detailLink) detailLink.tabIndex = visibility > 0.5 ? 0 : -1;

          const image = card.querySelector<HTMLElement>(".shega-event-image-wrap img");
          if (image) image.style.transform = `scale(${imageScale})`;
        });
        const progressBar = section.querySelector<HTMLElement>(".shega-events-progress span");
        if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
      });
    };

    render();
    window.addEventListener("scroll", render, { passive: true });
    window.addEventListener("resize", render);
    reducedMotion.addEventListener("change", render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", render);
      window.removeEventListener("resize", render);
      reducedMotion.removeEventListener("change", render);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="events"
      className="shega-events-section"
      aria-label="Featured events"
      style={{ "--event-count": FEATURED_EVENTS.length } as CSSProperties}
    >
      <div className="shega-events-stage">
        {FEATURED_EVENTS.map((event, index) => (
          <article
            key={event.slug}
            className="shega-event-card"
            aria-hidden={index !== 0}
            style={{ zIndex: index + 1, opacity: index === 0 ? 1 : 0 }}
          >
            <div className="shega-event-card-bar" />
            <div className="shega-event-image-wrap">
              <img src={event.image} alt={event.title} loading={index < 2 ? "eager" : "lazy"} />
            </div>
            <div className="shega-event-card-copy">
              <p className="shega-event-card-index">0{index + 1} <span>/ 0{FEATURED_EVENTS.length}</span></p>
              <h2>{event.title}</h2>
              <p>{event.detail}</p>
              <Link href={`/events/${event.slug}`} tabIndex={index === 0 ? 0 : -1}>
                View detail <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </article>
        ))}
        <div className="shega-events-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
