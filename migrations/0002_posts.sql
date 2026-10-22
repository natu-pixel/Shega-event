CREATE TABLE IF NOT EXISTS site_posts (
  slug TEXT PRIMARY KEY NOT NULL,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  published_at TEXT,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS site_posts_public_order
  ON site_posts (published, published_at DESC, updated_at DESC);
