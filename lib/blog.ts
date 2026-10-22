export type ManagedPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  published: boolean;
  publishedAt: string;
  updatedAt?: string;
};

export function validPost(value: unknown): value is ManagedPost {
  if (!value || typeof value !== "object") return false;
  const post = value as Partial<ManagedPost>;
  return typeof post.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)
    && typeof post.title === "string" && post.title.trim().length > 0
    && typeof post.excerpt === "string" && typeof post.content === "string"
    && typeof post.image === "string" && typeof post.author === "string"
    && typeof post.published === "boolean" && typeof post.publishedAt === "string";
}

export const emptyPost = (): ManagedPost => ({ slug: "", title: "", excerpt: "", content: "", image: "", author: "Shega Events", published: false, publishedAt: "" });
