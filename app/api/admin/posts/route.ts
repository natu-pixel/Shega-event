import { getAdminEnv, hasAdminSession, isSameOrigin } from "@/lib/admin";
import { validPost, type ManagedPost } from "@/lib/blog";

async function adminDatabase(request: Request) {
  const env = await getAdminEnv();
  if (!await hasAdminSession(request, env.SESSION_SECRET)) return { response: Response.json({ error: "Sign in to manage posts." }, { status: 401 }) };
  if (!env.CONTENT_DB) return { response: Response.json({ error: "The CONTENT_DB D1 binding is not configured." }, { status: 503 }) };
  return { db: env.CONTENT_DB };
}

export async function GET(request: Request) {
  try {
    const access = await adminDatabase(request); if ("response" in access) return access.response;
    const { results } = await access.db.prepare("SELECT data, updated_at FROM site_posts ORDER BY COALESCE(published_at, updated_at) DESC").all<{ data: string; updated_at: string }>();
    return Response.json(results.map((row) => ({ ...JSON.parse(row.data) as ManagedPost, updatedAt: row.updated_at })));
  } catch { return Response.json({ error: "Could not read posts. Apply the D1 migration and check the database binding." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const access = await adminDatabase(request); if ("response" in access) return access.response;
    const post = await request.json(); if (!validPost(post)) return Response.json({ error: "Please complete the required post details." }, { status: 400 });
    const savedPost = { ...post, publishedAt: post.publishedAt || new Date().toISOString() };
    await access.db.prepare("INSERT INTO site_posts (slug, published, published_at, data, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(slug) DO UPDATE SET published=excluded.published, published_at=excluded.published_at, data=excluded.data, updated_at=CURRENT_TIMESTAMP").bind(savedPost.slug, savedPost.published ? 1 : 0, savedPost.publishedAt, JSON.stringify(savedPost)).run();
    return Response.json({ saved: true, post: savedPost });
  } catch { return Response.json({ error: "Could not save this post." }, { status: 503 }); }
}
