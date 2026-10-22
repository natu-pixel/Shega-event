import { FEATURED_EVENTS } from "@/lib/events";
import { getAdminEnv, seedStaticEvents, type ManagedEvent } from "@/lib/admin";

export async function GET() {
  try {
    const env = await getAdminEnv();
    if (!env.CONTENT_DB) throw new Error("CONTENT_DB binding missing");
    await seedStaticEvents(env.CONTENT_DB);
    const { results } = await env.CONTENT_DB.prepare("SELECT data, updated_at FROM site_events WHERE published = 1 ORDER BY CASE status WHEN 'current' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END, updated_at DESC").all<{ data: string; updated_at: string }>();
    const events = results.map((row: { data: string; updated_at: string }) => ({ ...JSON.parse(row.data) as ManagedEvent, updatedAt: row.updated_at }));
    return Response.json(events, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    // Static portfolio content stays available before D1 has been connected.
  }
  return Response.json(FEATURED_EVENTS, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
