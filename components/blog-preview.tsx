"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ManagedPost } from "@/lib/blog";

export function BlogPreview() {
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  useEffect(() => { fetch("/api/posts").then((response) => response.ok ? response.json() : []).then(setPosts).catch(() => setPosts([])); }, []);
  if (!posts.length) return null;
  return <section id="journal" className="shega-blog-section" aria-labelledby="journal-title"><div className="shega-container"><div className="shega-blog-heading"><div><p className="shega-services-kicker">FROM THE JOURNAL</p><h2 id="journal-title">Stories in motion.</h2></div><Link href="/blog" className="shega-blog-all">View all stories ↗</Link></div><div className="shega-blog-grid">{posts.slice(0, 3).map((post) => <Link className="shega-blog-card" href={`/blog/${post.slug}`} key={post.slug}><div className="shega-blog-image" style={{ backgroundImage: `url("${post.image}")` }} /><div className="shega-blog-copy"><small>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "Latest story"} · {post.author}</small><h3>{post.title}</h3><p>{post.excerpt}</p><span>Read story ↗</span></div></Link>)}</div></div></section>;
}
