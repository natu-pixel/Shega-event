# Shega Events

A Next.js site with a scroll-driven, full-screen canvas journey through ETFC,
Keberaf, Lij Michael, Yohanna and Rophnan. The merged experience uses one sticky canvas; each event
also has an independent preview.

## Run

Node.js 22 or newer is recommended. From this folder:

```powershell
npm install
npm run dev
```

Open <http://127.0.0.1:3000>. Individual studies:

- <http://127.0.0.1:3000/preview/etfc>
- <http://127.0.0.1:3000/preview/keberaf>
- <http://127.0.0.1:3000/preview/lij-michael>
- <http://127.0.0.1:3000/preview/yohana>
- <http://127.0.0.1:3000/preview/rophnan>

For a local Node.js production server, run `npm run build:node`, then `npm start`.
Cloudflare Workers builds use `npm run build` to create the OpenNext worker output;
the deploy command can then run `npx wrangler deploy`.

## Generated frames

The requested ZIP was not present. Following the user's clarification, all five
sequences were generated **directly from the original local videos**, not from
the earlier extracted/inpainted frame folders.

- [ETFC](public/frames/etfc): 150 PNGs.
- [Keberaf](public/frames/keberaf): 150 PNGs.
- [Lij Michael](public/frames/lij-michael): 150 PNGs.
- [Yohanna](public/frames/yohana): 150 PNGs.
- [Rophnan](public/frames/rophnan): 150 PNGs.

Every folder contains `frame-001.png` through `frame-150.png` and a matching
first-frame JPEG poster. Frames are 1280 x 720, sampled uniformly across each
original video including its first and last frames. No watermark removal,
inpainting, upscaling or generated scenery is applied.

The 750 PNGs total approximately **534 MiB**. They are local public assets, not part
of the JavaScript bundle. The loader prioritizes the playhead and its neighbors,
then downloads the active sequence progressively with three concurrent jobs.
Decoded frames have a 64 MiB budget; compressed frame data has a separate 48 MiB
budget. Inactive chapters are not all downloaded on entry.

To regenerate or verify assets with isolated Python dependencies:

```powershell
python -m venv .venv-assets
.\.venv-assets\Scripts\python.exe -m pip install -r .\scripts\requirements-assets.txt
.\.venv-assets\Scripts\python.exe .\scripts\prepare-assets.py
.\.venv-assets\Scripts\python.exe .\scripts\prepare-assets.py --verify-only
```

The generator is rerunnable, validates all PNGs and hashes, and refuses to
overwrite unrelated files. Original source videos and collected photographs
remain untouched. [The asset manifest](public/asset-manifest.json) records source
hashes, sampled frame indices, dimensions and photo attribution.

When a source video is deliberately replaced, stop the preview server and refresh
only that reviewed sequence:

```powershell
.\.venv-assets\Scripts\python.exe .\scripts\prepare-assets.py --replace-sequence yohana
```

This checks ownership and existing hashes, generates and validates a staged
150-frame sequence, then replaces only that chapter and its manifest entry.
If the chapter has WebP delivery copies, those are freshly encoded in staging
with the shared optimizer before publication; old WebPs are never retained.
Extraction failures leave the live sequence untouched; publication errors restore
the previous sequence. The other chapters and original videos are not modified.
Set the chapter's `assetRevision` in [lib/story.ts](lib/story.ts) to the source hash
printed by the command, then rebuild and restart the site. Both frame and poster
URLs include this revision so browser and optimized-image caches cannot reuse the
previous footage. The URL/manifest regression test detects a missing or stale
revision. Yohanna's frames and poster now use the replacement video supplied on
September 21, 2026; the separate credited concert photo is unchanged.

## Animation behavior

- Each playback chapter spans three viewport heights of scroll inside a pinned
viewport: a standalone chapter is a 400vh-style experience before its exit.
- Local chapter progress maps directly to frames 1 through 150.
- Separate 0.6-viewport transition intervals hold the endpoints and simulate a
gentle camera glide, concealing the scene cut in warm darkness.
- The persistent active `requestAnimationFrame` loop eases the frame cursor;
time never advances playback independently of scroll.
- Drawing uses native aspect ratios, bounded focal-point panning and a DPR-aware
backing canvas capped at DPR 2 / eight million pixels.
- Offscreen/hidden-document loops pause. Resume, resize and restored scrolling
recalculate the playhead. Decode completion invalidates the canvas.
- Failed frames retry once, then report an accessible message and retry control;
available frames or the chapter poster remain visible.
- Reduced motion presents a static, one-viewport hero and disables frame fetching.
- The effect is a 2D drone-inspired glide, not fabricated aerial footage or a
true 3D reconstruction.

Adjust chapter titles and focal points in [lib/story.ts](lib/story.ts), timing in
[lib/timeline.ts](lib/timeline.ts), and styling in [app/globals.css](app/globals.css).

## Official branding and event descriptions

The header, footer, preview headers and favicon use the black-background logo
from Shega Events' [official Instagram profile](https://www.instagram.com/shega_events/).
The original orange Ethiopic artwork and light "Events" lettering are preserved;
this is not a recoloring of the older white-background version. There is no white
badge around the logo. The large SHEGA headline has a smaller, right-aligned
EVENTS descriptor beneath it; both scale responsively and fade together with the
opening title. This heading remains editorial display text, not a substitute logo.
The title scales to the vertical space remaining below the tagline, not just the
viewport width, keeping the complete introduction below the fixed header on short
desktop and landscape screens.

[Black-logo provenance](public/brand/shega-events-black-provenance.json) records
the original 150px JPEG, source URL and image/favicon hashes. The displayed image
is unchanged byte-for-byte, with a 128px downsample for the favicon. It appears at
64px on desktop and 56px on mobile, short landscape and in the footer, retaining
its square aspect ratio and at least a 44px home-link hit area. The source covers
these display sizes at 2x DPR without upscaling; it is never enlarged into the
full-screen headline. The older white-background artwork and its
[source record](public/brand/provenance.json) remain saved for reference.

Each chapter now has a description, two key facts and a source link. One
[event-details component](components/event-details.tsx) supplies both the active
film overlay and the readable overview on standalone previews. On the home page,
the panel appears as the opening title recedes; it fades during chapter bridges.
Reduced-motion and standalone views show event information immediately.

Descriptions and attribution notes live in [lib/story.ts](lib/story.ts). ETFC
is described at series level rather than borrowing the second edition's details.
The Kemen Lejemer selection follows the user's identified recap, not the separate
Sheraton launch. Rophnan's film is not assigned an unverified date or venue.
Keberaf's artist/live-band/venue information and Halo Hawassa's venue are supported
by the linked event listings and previously verified recap sources.

Yohanna's chapter also includes a clear, uncropped performance photograph from
[his own Hawassa recap](https://www.instagram.com/yohanaoriginal/p/DU6cP2yCkBV/?img_index=1),
a regular photo carousel rather than a Story or video frame. The credited image
appears in the standalone overview below the animation and in the Halo Hawassa
gallery card. It is deliberately excluded from the pinned animation overlay:
Yohanna uses the same compact text-only event panel as the other chapters so the
video remains visible. Mobile overview layouts stack the photo above the details.
[Photo provenance](public/events/yohanna-photo-provenance.json) records the source,
event evidence and original-file hash. The original gallery photo remains saved.

## Checks

Asset replacement safeguards (using the existing asset virtual environment):

```powershell
.\.venv-assets\Scripts\python.exe .\scripts\test_prepare_assets.py
.\.venv-assets\Scripts\python.exe .\scripts\prepare-assets.py --verify-only
```

```powershell
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

If the bundled Chromium download is unavailable, tests can use an installed Edge
browser without accessing its normal user profile:

```powershell
$env:PLAYWRIGHT_CHANNEL = "msedge"
npm run test:e2e
```

Browser tests exercise actual canvas output at the start, middle and end of
every chapter; reverse scrolling; sticky release; bounded caches; retina/mobile
resizing; restored scroll; reduced motion; and missing-frame recovery. The updated
Yohanna regression checks versioned frame/poster requests, served image hashes and
forward/reverse playback in both the merged and standalone experiences.

## Publication notes

Contact links point to the known Shega Instagram account; no unverified phone,
email, event dates or business statistics are invented. Gallery links point to
the original photo posts and preserve their marks. Kemen Lejemer and Rophnan
source selections are user-approved, with exact-edition attribution limits
recorded in [the photo sources](event-photos/sources.json). Public posting and
local availability do not establish republication rights: confirm asset rights
before public deployment.
