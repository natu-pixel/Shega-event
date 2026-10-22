import { getAdminEnv, hasAdminSession, isSameOrigin, seedStaticEvents, type ManagedEvent, validEvent } from "@/lib/admin";

async function adminDatabase(request: Request) {
  const env = await getAdminEnv();
  if (!await hasAdminSession(request, env.SESSION_SECRET)) return { response: Response.json({ error: "Sign in to manage events." }, { status: 401 }) };
  if (!env.CONTENT_DB) return { response: Response.json({ error: "The CONTENT_DB D1 binding is not configured." }, { status: 503 }) };
  return { env, db: env.CONTENT_DB };
}

export async function GET(request: Request) {
  try {
    const access = await adminDatabase(request);
    if ("response" in access) return access.response;
    await seedStaticEvents(access.db);
    const { results } = await access.db.prepare("SELECT data, updated_at FROM site_events ORDER BY updated_at DESC").all<{ data: string; updated_at: string }>();
    return Response.json(results.map((row: { data: string; updated_at: string }) => ({ ...JSON.parse(row.data) as ManagedEvent, updatedAt: row.updated_at })), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not read events. Apply the D1 migration and check the database binding." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const access = await adminDatabase(request);
    if ("response" in access) return access.response;
    const event = await request.json();
    if (!validEvent(event)) return Response.json({ error: "Please complete the required event details." }, { status: 400 });
    const data = JSON.stringify(event);
    await access.db.prepare("INSERT INTO site_events (slug, status, published, data, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(slug) DO UPDATE SET status=excluded.status, published=excluded.published, data=excluded.data, updated_at=CURRENT_TIMESTAMP")
      .bind(event.slug, event.status, event.published ? 1 : 0, data).run();
    return Response.json({ saved: true, event });
  } catch {
    return Response.json({ error: "Could not save this event." }, { status: 503 });
  }
}
