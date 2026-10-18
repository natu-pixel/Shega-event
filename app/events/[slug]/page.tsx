import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FEATURED_EVENTS } from "@/lib/events";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = FEATURED_EVENTS.find((item) => item.slug === slug);
  return { title: event?.title ?? "Event details" };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = FEATURED_EVENTS.find((item) => item.slug === slug);

  if (!event) notFound();

  return (
    <main className="event-detail-page">
      <header className="event-detail-header">
        <Link className="event-detail-brand" href="/">SHEGA EVENTS</Link>
        <Link className="event-detail-back" href="/#events">← Back to events</Link>
      </header>
      <article className="event-detail-content">
        <div className="event-detail-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.image} alt={event.title} />
        </div>
        <div className="event-detail-copy">
          <p className="event-detail-eyebrow">SHEGA EVENTS / EVENT DETAIL</p>
          <h1>{event.title}</h1>
          <p className="event-detail-type">{event.detail}</p>
          <p className="event-detail-description">{event.description}</p>
          <a className="event-detail-reel" href={event.instagramUrl} target="_blank" rel="noopener noreferrer">
            Watch the event video <span aria-hidden="true">↗</span>
          </a>
        </div>
      </article>
    </main>
  );
}
