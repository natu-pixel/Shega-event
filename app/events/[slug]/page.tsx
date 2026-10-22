import type { Metadata } from "next";
import { FEATURED_EVENTS } from "@/lib/events";
import { EventDetailClient } from "@/components/event-detail-client";
import type { ManagedEvent } from "@/lib/admin";
import "./event-detail.css";

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
  const item = FEATURED_EVENTS.find((event) => event.slug === slug);
  const fallback: ManagedEvent | undefined = item ? {
    ...item,
    date: "",
    location: "Addis Ababa, Ethiopia",
    gallery: [...item.gallery],
    status: "past",
    published: true,
  } : undefined;
  return <EventDetailClient slug={slug} fallback={fallback} />;
}
