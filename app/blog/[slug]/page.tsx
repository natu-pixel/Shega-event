"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ManagedPost } from "@/lib/blog";
export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>(); const [post, setPost] = useState<ManagedPost | null>(null); const [loaded, setLoaded] = useState(false);
  useEffect(() => { fetch("/api/posts").then((response) => response.ok ? response.json() : []).then((posts: ManagedPost[]) => setPost(posts.find((item) => item.slug === slug) ?? null)).finally(() => setLoaded(true)); }, [slug]);
  if (!post) return <main className="blog-page"><header className="blog-header"><Link href="/blog">← Back to journal</Link><h1>{loaded ? "Story not found." : "Loading story…"}</h1></header></main>;
  return <main className="blog-page"><article className="blog-post"><Link href="/blog">← Back to journal</Link><p>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" }) : "Shega Events"} · {post.author}</p><h1>{post.title}</h1><div className="blog-post-image" style={{ backgroundImage: `url("${post.image}")` }} /><div className="blog-post-content">{post.content.split("\n").filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article></main>;
}
