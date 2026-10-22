import type { ManagedPost } from "@/lib/blog";

const STORAGE_KEY = "shega-admin-preview-posts-v1";

export function getLocalPreviewPosts(): ManagedPost[] | null {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return null;
  try { const saved = window.localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) as ManagedPost[] : []; } catch { return []; }
}

export function saveLocalPreviewPosts(posts: ManagedPost[]) {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}
