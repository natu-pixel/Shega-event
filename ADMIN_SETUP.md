# Admin content studio setup

The admin editor is available at `/admin`. It stores event details in Cloudflare D1 and uploaded photos in Cloudflare R2. The existing portfolio is copied into D1 the first time the admin list or public event API is opened.

## Create the Cloudflare resources

From the project directory, create the D1 database and R2 bucket:

```powershell
npx wrangler d1 create shega-events-content
npx wrangler r2 bucket create shega-events-media
```

Copy the D1 `database_id` returned by Wrangler. Add these entries at the top level of `wrangler.jsonc` (alongside `assets`):

```jsonc
"d1_databases": [
  {
    "binding": "CONTENT_DB",
    "database_name": "shega-events-content",
    "database_id": "PASTE_THE_DATABASE_ID_HERE",
    "migrations_dir": "migrations"
  }
],
"r2_buckets": [
  { "binding": "MEDIA", "bucket_name": "shega-events-media" }
],
```

Apply the schema and set the two secrets without adding them to source control:

```powershell
npx wrangler d1 migrations apply shega-events-content --remote
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

Use a unique admin password and a separate random session secret of at least 32 characters. Wrangler prompts for each secret. Keep production values in Cloudflare secrets; do not commit them.

For local development, add the same binding entries to the local Wrangler config and place `NEXTJS_ENV=development`, `ADMIN_PASSWORD=...`, and `SESSION_SECRET=...` in the ignored `.dev.vars` file. Local D1 migrations can be applied with `npx wrangler d1 migrations apply shega-events-content --local`.

After configuring the bindings and secrets, rebuild and deploy the Worker. The panel supports current, upcoming, and past event status; publishing and drafts; event descriptions and links; cover image and multi-image galleries; and deleting events. Uploaded image types are JPG, PNG, WebP, and GIF, up to 12 MB each.
