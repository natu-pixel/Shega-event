import { getCloudflareContext } from "@opennextjs/cloudflare";
import { FEATURED_EVENTS } from "@/lib/events";

export type ManagedEvent = {
  slug: string;
  title: string;
  detail: string;
  description: string;
  date: string;
  location: string;
  image: string;
  gallery: string[];
  instagramUrl: string;
  status: "current" | "upcoming" | "past";
  published: boolean;
  updatedAt?: string;
};

type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<unknown>;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
};
export type ContentDatabase = { prepare(query: string): D1Statement };
type StoredMedia = { body: ReadableStream<Uint8Array>; httpEtag: string; writeHttpMetadata(headers: Headers): void };
export type MediaBucket = {
  put(key: string, value: ReadableStream<Uint8Array>, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
  get(key: string): Promise<StoredMedia | null>;
};

export type AdminEnv = {
  CONTENT_DB?: ContentDatabase;
  MEDIA?: MediaBucket;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
};

export async function getAdminEnv() {
  const context = await getCloudflareContext({ async: true });
  return context.env as typeof context.env & AdminEnv;
}

const COOKIE_NAME = "shega_admin";
const MAX_AGE = 60 * 60 * 8;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

export async function passwordMatches(password: string, expected: string, secret: string) {
  const actualSignature = await sign(password, secret);
  const expectedSignature = await sign(expected, secret);
  const actual = fromBase64Url(actualSignature);
  const wanted = fromBase64Url(expectedSignature);
  let diff = actual.length ^ wanted.length;
  for (let i = 0; i < Math.max(actual.length, wanted.length); i++) diff |= (actual[i] ?? 0) ^ (wanted[i] ?? 0);
  return diff === 0;
}

export async function loginRateLimitKey(ip: string, secret: string) {
  return sign(ip, secret);
}

export async function createSessionCookie(secret: string, secure = true) {
  const expiry = Math.floor(Date.now() / 1000) + MAX_AGE;
  const value = String(expiry);
  const signature = await sign(value, secret);
  return `${COOKIE_NAME}=${value}.${signature}; Path=/; HttpOnly;${secure ? " Secure;" : ""} SameSite=Strict; Max-Age=${MAX_AGE}`;
}

export async function hasAdminSession(request: Request, secret?: string) {
  if (!secret) return false;
  const rawCookie = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  const value = rawCookie?.slice(COOKIE_NAME.length + 1);
  if (!value) return false;
  const [expiry, signature] = value.split(".");
  if (!expiry || !signature || !/^\d+$/.test(expiry) || Number(expiry) <= Math.floor(Date.now() / 1000)) return false;
  const expected = await sign(expiry, secret);
  const actualBytes = fromBase64Url(signature);
  const expectedBytes = fromBase64Url(expected);
  let diff = actualBytes.length ^ expectedBytes.length;
  for (let i = 0; i < Math.max(actualBytes.length, expectedBytes.length); i++) diff |= (actualBytes[i] ?? 0) ^ (expectedBytes[i] ?? 0);
  return diff === 0;
}

export function sessionExpiredCookie(secure = true) {
  return `${COOKIE_NAME}=; Path=/; HttpOnly;${secure ? " Secure;" : ""} SameSite=Strict; Max-Age=0`;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export function slugify(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

function isAllowedImageUrl(value: string) {
  return value.startsWith("/events/") || value.startsWith("/media/events/") || /^https:\/\//i.test(value);
}

export function validEvent(input: unknown): input is ManagedEvent {
  if (!input || typeof input !== "object") return false;
  const event = input as Partial<ManagedEvent>;
  return typeof event.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug)
    && typeof event.title === "string" && event.title.trim().length > 0 && event.title.length <= 140
    && typeof event.description === "string" && event.description.length <= 5000
    && typeof event.detail === "string" && event.detail.length <= 240
    && typeof event.date === "string" && event.date.length <= 80
    && typeof event.location === "string" && event.location.length <= 160
    && typeof event.image === "string" && event.image.trim().length > 0 && event.image.length <= 1000 && isAllowedImageUrl(event.image)
    && Array.isArray(event.gallery) && event.gallery.length <= 60 && event.gallery.every((image) => typeof image === "string" && image.length <= 1000 && isAllowedImageUrl(image))
    && typeof event.instagramUrl === "string" && event.instagramUrl.length <= 1000
    && (event.status === "current" || event.status === "upcoming" || event.status === "past")
    && (event.status !== "upcoming" || /^\d{4}-\d{2}-\d{2}$/.test(event.date))
    && typeof event.published === "boolean";
}

export async function seedStaticEvents(db: ContentDatabase) {
  const seeded = await db.prepare("SELECT value FROM content_meta WHERE key = 'static_events_seeded'").first<{ value: string }>();
  if (seeded) return;
  const seed = FEATURED_EVENTS.map((event): ManagedEvent => ({
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
  for (const event of seed) {
    await db.prepare("INSERT OR IGNORE INTO site_events (slug, status, published, data, updated_at) VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP)")
      .bind(event.slug, event.status, JSON.stringify(event)).run();
  }
  await db.prepare("INSERT OR IGNORE INTO content_meta (key, value) VALUES ('static_events_seeded', '1')").run();
}
