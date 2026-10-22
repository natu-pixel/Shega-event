"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ManagedPost } from "@/lib/blog";
export default function BlogPage() {
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  useEffect(() => { fetch("/api/posts").then((response) => response.ok ? response.json() : []).then(setPosts).catch(() => setPosts([])); }, []);
  return <main className="blog-page"><header className="blog-header"><Link href="/">← Shega Events</Link><p>THE JOURNAL</p><h1>Stories in<br />motion.</h1></header><section className="blog-list">{posts.map((post) => <Link href={`/blog/${post.slug}`} className="blog-list-card" key={post.slug}><div style={{ backgroundImage: `url("${post.image}")` }} /><article><small>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" }) : "Latest story"}</small><h2>{post.title}</h2><p>{post.excerpt}</p><span>Read story ↗</span></article></Link>)}{!posts.length && <p className="blog-empty">There are no stories published yet.</p>}</section></main>;
}
