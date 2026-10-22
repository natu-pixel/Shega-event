import { getAdminEnv, hasAdminSession, isSameOrigin } from "@/lib/admin";

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const env = await getAdminEnv();
    if (!await hasAdminSession(request, env.SESSION_SECRET)) return Response.json({ error: "Sign in to manage posts." }, { status: 401 });
    if (!env.CONTENT_DB) return Response.json({ error: "The CONTENT_DB D1 binding is not configured." }, { status: 503 });
    const { slug } = await params; await env.CONTENT_DB.prepare("DELETE FROM site_posts WHERE slug = ?").bind(slug).run();
    return Response.json({ deleted: true });
  } catch { return Response.json({ error: "Could not delete this post." }, { status: 503 }); }
}
