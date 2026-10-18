'use client';

import { useEffect, useRef } from 'react';
import { EventGallery as Engine, type EventItem, type EventGalleryOptions } from './event-gallery';
import './event-gallery.css';

interface Props extends EventGalleryOptions {
  events: readonly EventItem[];
  className?: string;
  height?: string | number;
}

export default function EventGallery({
  events,
  className,
  height = '100svh',
  ...options
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<Engine | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    if (!ref.current) return;
    galleryRef.current = new Engine(ref.current, events, {
      onSelect: (event) => optionsRef.current.onSelect?.(event),
      onClose: () => optionsRef.current.onClose?.(),
      onProgress: (progress) => optionsRef.current.onProgress?.(progress),
      onReady: () => optionsRef.current.onReady?.(),
    });
    return () => {
      galleryRef.current?.destroy();
      galleryRef.current = null;
    };
    // Engine lifetime follows the mounted root; event changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signature = events
    .map((event) => [event.id ?? event.slug ?? event.href ?? event.image, event.image, event.title, event.detail ?? '', event.date ?? '', event.location ?? '', event.href ?? '', ...(event.gallery ?? [])].join('|'))
    .join('\n');
  const lastSignature = useRef(signature);

  useEffect(() => {
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    galleryRef.current?.setEvents(events);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => {
    optionsRef.current = options;
    galleryRef.current?.updateOptions(options);
  }, [options]);

  return (
    <div ref={ref} className={`eg-root${className ? ` ${className}` : ''}`} style={{ height }}>
      <p className="eg-heading">Shega Events / A visual archive</p>
      <div className="eg-overlay" aria-live="polite">
        <h2 className="eg-title">{events[0]?.title}</h2>
        <p className="eg-meta">{[events[0]?.detail, events[0]?.date, events[0]?.location].filter(Boolean).join(' / ')}</p>
        <a className="eg-cta" href={events[0] ? (events[0].href ?? (events[0].slug ? `/events/${events[0].slug}` : events[0].id ? `/events/${events[0].id}` : '#events')) : '#events'}>View detail <span aria-hidden="true">↗</span></a>
      </div>
      <ul className="eg-sr-only" aria-label="Event details">
        {events.map((event) => {
          const href = event.href ?? (event.slug ? `/events/${event.slug}` : event.id ? `/events/${event.id}` : '#events');
          return <li key={event.id ?? event.slug ?? href}><a href={href}>{event.title} — {[event.detail, event.date, event.location].filter(Boolean).join(' / ')}</a></li>;
        })}
      </ul>
    </div>
  );
}
