import { getAdminEnv } from "@/lib/admin";
import type { ManagedPost } from "@/lib/blog";

export async function GET() {
  try {
    const env = await getAdminEnv();
    if (!env.CONTENT_DB) throw new Error("CONTENT_DB binding missing");
    const { results } = await env.CONTENT_DB.prepare("SELECT data, updated_at FROM site_posts WHERE published = 1 ORDER BY COALESCE(published_at, updated_at) DESC").all<{ data: string; updated_at: string }>();
    return Response.json(results.map((row) => ({ ...JSON.parse(row.data) as ManagedPost, updatedAt: row.updated_at })), { headers: { "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300" } });
  } catch { return Response.json([]); }
}
