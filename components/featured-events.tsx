'use client';

import { useEffect, useState } from 'react';
import EventGallery from '@/components/event-gallery-view';
import { FEATURED_EVENTS } from '@/lib/events';
import type { EventItem } from '@/components/event-gallery';
import { getLocalPreviewEvents } from '@/lib/admin-preview';

export function FeaturedEvents() {
  const [events, setEvents] = useState<readonly EventItem[]>(FEATURED_EVENTS);
  useEffect(() => {
    const load = () => {
      const preview = getLocalPreviewEvents();
      if (preview) {
        setEvents(preview.filter((event) => event.published));
        return;
      }
      fetch('/api/events').then((response) => response.ok ? response.json() as Promise<EventItem[]> : null)
        .then((items) => { if (Array.isArray(items)) setEvents(items); }).catch(() => undefined);
    };
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'shega-admin-preview-events-v1') load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <section id="events" className="eg-section" aria-label="Featured events">
      <EventGallery events={events} />
    </section>
  );
}
