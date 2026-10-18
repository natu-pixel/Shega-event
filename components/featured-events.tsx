import EventGallery from '@/components/event-gallery-view';
import { FEATURED_EVENTS } from '@/lib/events';

export function FeaturedEvents() {
  return (
    <section id="events" className="eg-section" aria-label="Featured events">
      <EventGallery events={FEATURED_EVENTS} />
    </section>
  );
}
