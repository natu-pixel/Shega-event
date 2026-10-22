"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getLocalPreviewEvents } from "@/lib/admin-preview";
import type { ManagedEvent } from "@/lib/admin";

export function EventDetailClient({ slug, fallback }: { slug: string; fallback?: ManagedEvent }) {
  const [event, setEvent] = useState<ManagedEvent | null>(fallback ?? null);
  const [loaded, setLoaded] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const preview = getLocalPreviewEvents();
    if (preview) {
      setEvent(preview.find((item) => item.slug === slug && item.published) ?? null);
      setLoaded(true);
      return;
    }
    fetch("/api/events", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<ManagedEvent[]> : [])
      .then((items) => setEvent(items.find((item) => item.slug === slug) ?? null))
      .catch(() => setEvent(null))
      .finally(() => setLoaded(true));
  }, [slug]);

  useEffect(() => setActivePhoto(0), [event?.slug]);

  if (!event && !loaded) return <main className="event-detail-page"><p className="event-detail-loading">Loading event…</p></main>;
  if (!event) return <main className="event-detail-page"><header className="event-detail-header"><Link className="event-detail-brand" href="/" aria-label="Shega Events home"><Image src="/brand/shega-events-black.png" alt="Shega Events" width={150} height={150} unoptimized /></Link><Link className="event-detail-back" href="/gallery">← Back to gallery</Link></header><p className="event-detail-loading">Event not found.</p></main>;

  const photos = [...new Set([event.image, ...(event.gallery ?? [])].filter(Boolean))];
  const changePhoto = (direction: number) => setActivePhoto((index) => (index + direction + photos.length) % photos.length);

  return (
    <main className="event-detail-page">
      <header className="event-detail-header"><Link className="event-detail-brand" href="/" aria-label="Shega Events home"><Image src="/brand/shega-events-black.png" alt="Shega Events" width={150} height={150} unoptimized /></Link><Link className="event-detail-back" href="/gallery">← Back to gallery</Link></header>
      <Link className="event-detail-page-next" href="/gallery?view=archive" aria-label="Next gallery page">›</Link>
      <article className="event-detail-content">
        <div className="event-detail-carousel">
          <img className="event-detail-photo" src={photos[activePhoto]} alt={`${event.title}, photo ${activePhoto + 1}`} />
          {photos.length > 1 && <>
            <button className="event-detail-arrow event-detail-arrow-prev" type="button" onClick={() => changePhoto(-1)} aria-label="Previous photo">‹</button>
            <button className="event-detail-arrow event-detail-arrow-next" type="button" onClick={() => changePhoto(1)} aria-label="Next photo">›</button>
          </>}
        </div>
        {photos.length > 1 && <div className="event-detail-dots" aria-label="Choose a photo">
          {photos.map((photo, index) => <button key={`${photo}-${index}`} className={index === activePhoto ? "is-active" : ""} type="button" onClick={() => setActivePhoto(index)} aria-label={`Show photo ${index + 1}`} aria-current={index === activePhoto ? "true" : undefined} />)}
        </div>}
        <div className="event-detail-copy">
          <p className="event-detail-eyebrow">SHEGA EVENTS / VISUAL ARCHIVES</p>
          <h1>{event.title}</h1>
          <p className="event-detail-description">{event.description}</p>
          {event.instagramUrl && <a className="event-detail-reel" href={event.instagramUrl} target="_blank" rel="noopener noreferrer">Watch the event video <span aria-hidden="true">↗</span></a>}
          <dl className="event-detail-meta">
            <div><dt>Category</dt><dd>Visual Archives</dd></div>
            <div><dt>Organizer</dt><dd>Shega Events</dd></div>
            {event.date && <div><dt>Date</dt><dd>{event.date}</dd></div>}
            {event.location && <div><dt>Location</dt><dd>{event.location}</dd></div>}
            {event.detail && <div><dt>Event</dt><dd>{event.detail}</dd></div>}
          </dl>
        </div>
      </article>
    </main>
  );
}
