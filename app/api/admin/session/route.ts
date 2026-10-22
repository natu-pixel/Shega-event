import { createSessionCookie, getAdminEnv, hasAdminSession, isSameOrigin, loginRateLimitKey, passwordMatches, usernameMatches, sessionExpiredCookie } from "@/lib/admin";

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
    if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.SESSION_SECRET || !env.CONTENT_DB) return Response.json({ error: "Admin credentials or the CONTENT_DB binding are not configured." }, { status: 503 });
    const body = await request.json() as { username?: string; password?: string };
    const remoteAddress = request.headers.get("cf-connecting-ip") || "unknown";
    const ipKey = await loginRateLimitKey(remoteAddress, env.SESSION_SECRET);
    const now = Math.floor(Date.now() / 1000);
    const attempt = await env.CONTENT_DB.prepare("INSERT INTO admin_login_attempts (ip_key, attempts, window_started_at) VALUES (?, 1, ?) ON CONFLICT(ip_key) DO UPDATE SET attempts = CASE WHEN window_started_at <= ? THEN 1 ELSE attempts + 1 END, window_started_at = CASE WHEN window_started_at <= ? THEN excluded.window_started_at ELSE window_started_at END RETURNING attempts")
      .bind(ipKey, now, now - 900, now - 900).first<{ attempts: number }>();
    if ((attempt?.attempts ?? 0) > 12) return Response.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
    const user = typeof body.username === "string" ? body.username.replace(/[\r\n]/g, "").trim() : "";
    const pass = typeof body.password === "string" ? body.password.replace(/[\r\n]/g, "").trim() : "";
    if (!user || !pass || user.length > 300 || pass.length > 300) {
      return Response.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const userMatches = await usernameMatches(user, env.ADMIN_USERNAME, env.SESSION_SECRET);
    const passMatches = await passwordMatches(pass, env.ADMIN_PASSWORD, env.SESSION_SECRET);

    if (!userMatches || !passMatches) {
      return Response.json({ error: "Invalid username or password." }, { status: 401 });
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
