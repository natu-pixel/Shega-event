"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import type { EventItem } from "@/components/event-gallery";
import { getLocalPreviewEvents } from "@/lib/admin-preview";
import { FEATURED_EVENTS } from "@/lib/events";
import "./gallery.css";

export default function GalleryContent() {
  const [events, setEvents] = useState<readonly EventItem[]>([]);
  const [showLastPage, setShowLastPage] = useState(false);

  useEffect(() => {
    setShowLastPage(new URLSearchParams(window.location.search).get("view") === "archive");
    const preview = getLocalPreviewEvents();
    const request = preview
      ? Promise.resolve(preview.filter((event) => event.published))
      : fetch("/api/events", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<EventItem[]> : []);
    request.then((items) => setEvents(items.map((event) => ({
      ...event,
      gallery: [...new Set([event.image, ...(event.gallery ?? [])].filter(Boolean))],
    })))).catch(() => setEvents(FEATURED_EVENTS));
  }, []);

  return (
    <main className="gallery-page">
      <Navbar />
      <section className="gallery-archive" aria-label="Visual archive">
        <header className="gallery-intro">
          <p className="gallery-kicker">SHEGA EVENTS&nbsp; / &nbsp;THE ARCHIVE</p>
          <h1>Our<br />Visual Archives</h1>
          <p className="gallery-description">Reflections of our grandest nights captured in the photographs across the decades, this visual narrative is our priority shared together from incredible memories of our passionate community.</p>
          <span className="gallery-scroll-note"><i /> DRAG OR SCROLL TO EXPLORE</span>
        </header>
        {events.length ? (
          <div className="gallery-rail" aria-label="Published event albums">
            {events.map((event, index) => {
              const detailHref = `/events/${event.slug}`;
              const shape = index % 4;
              return (
                <a className={`gallery-tile gallery-tile-${shape}`} href={detailHref} key={event.slug ?? `${event.title}-${index}`} aria-label={`View ${event.title} album`}>
                  <img src={event.image} alt={`${event.title} event`} loading={index < 3 ? "eager" : "lazy"} />
                  <span className="gallery-tile-shade" />
                  <span className="gallery-tile-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="gallery-tile-caption"><i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" /><strong>{event.title}</strong></span>
                  <span className="gallery-tile-arrow" aria-hidden="true">↗</span>
                </a>
              );
            })}
          </div>
        ) : <p className="gallery-page-empty">No published event albums yet. Publish an event from the admin panel to add it here.</p>}
      </section>
    </main>
  );
}