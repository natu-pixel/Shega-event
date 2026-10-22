import { createSessionCookie, getAdminEnv, hasAdminSession, isSameOrigin, loginRateLimitKey, passwordMatches, sessionExpiredCookie } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    const env = await getAdminEnv();
    return Response.json({ authenticated: await hasAdminSession(request, env.SESSION_SECRET) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ authenticated: false, configured: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const env = await getAdminEnv();
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET || !env.CONTENT_DB) return Response.json({ error: "Admin credentials or the CONTENT_DB binding are not configured." }, { status: 503 });
    const body = await request.json() as { password?: string };
    const remoteAddress = request.headers.get("cf-connecting-ip") || "unknown";
    const ipKey = await loginRateLimitKey(remoteAddress, env.SESSION_SECRET);
    const now = Math.floor(Date.now() / 1000);
    const attempt = await env.CONTENT_DB.prepare("INSERT INTO admin_login_attempts (ip_key, attempts, window_started_at) VALUES (?, 1, ?) ON CONFLICT(ip_key) DO UPDATE SET attempts = CASE WHEN window_started_at <= ? THEN 1 ELSE attempts + 1 END, window_started_at = CASE WHEN window_started_at <= ? THEN excluded.window_started_at ELSE window_started_at END RETURNING attempts")
      .bind(ipKey, now, now - 900, now - 900).first<{ attempts: number }>();
    if ((attempt?.attempts ?? 0) > 8) return Response.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
    if (typeof body.password !== "string" || body.password.length > 300 || !await passwordMatches(body.password, env.ADMIN_PASSWORD, env.SESSION_SECRET)) {
      return Response.json({ error: "Incorrect password." }, { status: 401 });
    }
    await env.CONTENT_DB.prepare("DELETE FROM admin_login_attempts WHERE ip_key = ?").bind(ipKey).run();
    return Response.json({ authenticated: true }, { headers: { "Set-Cookie": await createSessionCookie(env.SESSION_SECRET, new URL(request.url).protocol === "https:"), "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Admin login is unavailable. Check the Cloudflare configuration." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  return Response.json({ authenticated: false }, { headers: { "Set-Cookie": sessionExpiredCookie(new URL(request.url).protocol === "https:"), "Cache-Control": "no-store" } });
}
