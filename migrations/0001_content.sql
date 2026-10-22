CREATE TABLE IF NOT EXISTS site_events (
  slug TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('current', 'upcoming', 'past')),
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS site_events_public_order
  ON site_events (published, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS content_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip_key TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL,
  window_started_at INTEGER NOT NULL
);
