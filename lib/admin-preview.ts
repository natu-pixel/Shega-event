import { FEATURED_EVENTS } from "@/lib/events";
import type { ManagedEvent } from "@/lib/admin";

const STORAGE_KEY = "shega-admin-preview-events-v1";

export function getLocalPreviewEvents(): ManagedEvent[] | null {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const events = JSON.parse(saved) as ManagedEvent[];
      return Array.isArray(events) ? events : [];
    }
    const initial = FEATURED_EVENTS.map((event): ManagedEvent => ({
      slug: event.slug,
      title: event.title,
      detail: event.detail,
      description: event.description,
      date: "",
      location: "Addis Ababa, Ethiopia",
      image: event.image,
      gallery: [...event.gallery],
      instagramUrl: event.instagramUrl,
      status: "past",
      published: true,
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [];
  }
}

export function saveLocalPreviewEvents(events: ManagedEvent[]) {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}
