import type { Metadata } from "next";
import { FEATURED_EVENTS } from "@/lib/events";
import { EventDetailClient } from "@/components/event-detail-client";
import { getAdminEnv, type ManagedEvent } from "@/lib/admin";
import "./event-detail.css";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

async function getEventBySlug(slug: string): Promise<ManagedEvent | undefined> {
  try {
    const env = await getAdminEnv();
    if (env.CONTENT_DB) {
      const row = await env.CONTENT_DB.prepare("SELECT data FROM site_events WHERE slug = ? AND published = 1")
        .bind(slug).first<{ data: string }>();
      if (row?.data) {
        return JSON.parse(row.data) as ManagedEvent;
      }
    }
  } catch {}

  const item = FEATURED_EVENTS.find((event) => event.slug === slug);
  return item ? {
    ...item,
    date: "",
    location: "Addis Ababa, Ethiopia",
    gallery: [...item.gallery],
    status: "past",
    published: true,
  } : undefined;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return { title: event ? `${event.title} — Shega Events` : "Event details — Shega Events" };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return <EventDetailClient slug={slug} fallback={event} />;
}
