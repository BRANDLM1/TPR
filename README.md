# Vision 2035 Explorer

An interactive, narrative-driven mapping application built for [The Tipi Raisers](https://www.thetipiraisers.org/), a 501(c)(3) nonprofit supporting Native communities. The Explorer turns the organization's *Vision 2035* campaign into a guided tour: each initiative is a "story" composed of ordered "steps" that fly the camera around a Mapbox map, surface impact statistics, drop dynamic markers and shaded regions, and play media — all editable from a Prisma Studio UI without touching code.

This README is the operational guide for the staff and future developers who may edit content and maintain the app.

---

## Table of contents

1. [What it does](#1-what-it-does)
2. [Architecture](#2-architecture-at-a-glance)
3. [Tech stack](#3-tech-stack)
4. [Repo layout](#4-repository-layout)
5. [First-time setup](#5-first-time-setup)
6. [Running locally](#6-running-locally)
7. [The data model](#7-the-data-model)
8. [Editing content in Prisma Studio](#8-editing-content-in-prisma-studio)
9. [Adding a new map base layer (developer task)](#9-adding-a-new-map-base-layer-developer-task)
10. [GraphQL API](#10-graphql-api)
11. [Migrations and schema changes](#11-migrations-and-schema-changes)
12. [Deployment](#12-deployment)
13. [Troubleshooting](#13-troubleshooting)
14. [Future improvements](#14-future-improvements)

---

## 1. What it does

When a visitor lands on the site they see a dark splash screen with the campaign title, a tagline, and an "Explore Our Campaign" call-to-action. (All three pieces of copy are staff-editable — see [Editing content](#8-editing-content-in-prisma-studio).) Clicking the CTA renders Mapbox map.

A nav bar exposes a story-picker dropdown plus Donate and Contact buttons that link to the main `thetipiraisers.org` site.

Selecting a story opens a modal positioned anywhere from CENTER to one of the four corners (the position is per-step). Each modal contains:

- **Title and body copy** (per step)
- **Media items** — one or more images or videos with captions, ordered by an `order` integer
- **Next / Back buttons** with custom button text on the final step
- **Map flight** — when the step has lat/long/zoom/pitch/bearing set, the camera flies there

While the step is active, the map renders:

- **Dynamic points** — geocoded markers with a custom color or icon (looked up against an Icon registry), clickable popups, and optional `link` text
- **Dynamic polygons** — GeoJSON regions with editable fill color/opacity and stroke color/width, optionally anchored to a "center point" marker
- **Toggleable base layers** — registered in `layerGroup.ts` and shown/hidden by referencing layer IDs in the step's `layersToShow` / `layersToHide` arrays

Stepping forward or back updates the camera, swaps in the next step's points/polygons, and toggles the next step's layers. There is no full-page navigation — the entire experience is a single Mapbox canvas. If the GraphQL request fails, the modal becomes an error state with a Retry button, and a Next.js error boundary catches any unrecoverable route error.

## 2. Architecture at a glance

```
                ┌────────────────────────────┐
   visitor ───▶ │  Next.js 15 App Router      │
                │  (packages/frontend)        │
                │  React 19 · Mapbox GL JS    │
                │  Apollo Client · Mantine    │
                └──────────────┬──────────────┘
                               │ GraphQL  (HTTP)
                               ▼
                ┌────────────────────────────┐
                │  Apollo Server (port 4000)  │
                │  (packages/backend)         │
                │  schema-first SDL           │
                └──────────────┬──────────────┘
                               │ Prisma Client
                               ▼
                ┌────────────────────────────┐
                │  PostgreSQL                 │
                │  + Prisma migrations        │
                └────────────────────────────┘

Staff edit content via Prisma Studio (web UI) connected to the same DB.
```

A single GraphQL query — `story(id)` — eager-loads the entire tree of steps, media, points, and polygons in one round-trip via Prisma's `include` option. This avoids the N+1 problem that a REST API would have introduced, and lets the frontend render the whole story without further fetches.

GeoJSON is **not** stored as a PostGIS geometry. `DynamicPoint` keeps `latitude` and `longitude` as `Float`s; `DynamicPolygon.geometry` is a Prisma `Json` column. The backend resolver transforms both into proper GeoJSON Features at query time. This keeps Prisma as the only data-access path and avoids raw SQL for staff.

## 3. Tech stack

**Frontend** (`packages/frontend`)
- Next.js 15 (App Router) + React 19 + TypeScript
- Mapbox GL JS for the map canvas
- Apollo Client for GraphQL
- Mantine v8 (`@mantine/core` + `@mantine/modals`) for the modal
- Tailwind CSS v4 for layout styling
- `react-select` for the story dropdown

**Backend** (`packages/backend`)
- Apollo Server v5 (standalone, port 4000)
- Schema-first GraphQL (`schema.graphql`)
- Prisma 6 ORM + Prisma Client
- PostgreSQL

**Tooling**
- npm workspaces (monorepo)
- `dotenv-cli` to inject `.env.local` into both workspace dev scripts
- `concurrently` to run frontend + backend in one terminal
- ESLint + Prettier

**Optional**
- `packages/backend/src/services/etl.py` — a Python script for pulling Google Sheets impact data into Postgres. Not currently scheduled; see [Future improvements](#14-future-improvements).

## 4. Repository layout

```
.
├── package.json                 # workspace root + db:* scripts
├── .env.example                 # template; copy to .env.local
├── packages/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # source of truth for DB
│   │   │   └── migrations/<timestamped>/migration.sql
│   │   ├── schema.graphql               # GraphQL SDL
│   │   └── src/
│   │       ├── resolvers.ts             # Query resolvers + GeoJSON transforms
│   │       └── services/
│   │           ├── apollo.ts            # server entrypoint
│   │           ├── context.ts           # GraphQL context (Prisma)
│   │           ├── database.ts          # Prisma client instance
│   │           └── etl.py               # optional Sheets → Postgres ETL
│   └── frontend/
│       └── app/
│           ├── layout.tsx               # server component, Metadata
│           ├── providers.tsx            # Apollo + Mantine providers
│           ├── page.tsx                 # mounts <InitMap />
│           ├── error.tsx                # route-level error boundary
│           ├── lib/
│           │   ├── apollo.ts            # Apollo Client config
│           │   ├── queries.ts           # GraphQL queries + fragments
│           │   └── useSiteSettings.ts   # hook for editable site copy
│           └── components/
│               ├── Animations/FadeIn.tsx
│               ├── Global/{Nav,Dropdown}.tsx
│               └── Map/
│                   ├── InitMap.tsx       # landing splash → map mount
│                   ├── MapCanvas.tsx     # the Mapbox map + step engine
│                   ├── StoryModal.tsx    # narrative modal
│                   └── layerGroup.ts     # registry of base-map layers
```

## 5. First-time setup

Prerequisites:
- Node.js 20+
- npm 10+
- A running PostgreSQL 14+ (local Docker, Postgres.app, Supabase, etc.)
- A Mapbox public access token — create one at https://account.mapbox.com/

```bash
# 1. Clone and install all workspaces
git clone <repo-url> tpr
cd tpr
npm install

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local — set DATABASE_URL and NEXT_PUBLIC_MAPBOX_TOKEN

# 3. Apply migrations and generate the Prisma client
npm run db:migrate      # runs prisma migrate dev
npm run db:generate     # regenerates the Prisma client

# 4. Confirm the DB has a SiteSettings row (id = 1)
npm run db:studio
# → in Studio, open SiteSettings; the row should already exist from the
#   migration's INSERT. If it doesn't, add a row with id = 1.
```

`.env.local` lives at the repo root and is read by **both** workspaces via `dotenv-cli` (see each workspace's `dev` script). The same file holds backend secrets (`DATABASE_URL`) and public frontend values (`NEXT_PUBLIC_*`).

## 6. Running locally

From the repo root:

```bash
npm run dev
```

This starts both servers in parallel via `concurrently`:

| Service          | Port | URL                            |
| ---------------- | ---- | ------------------------------ |
| Frontend (Next)  | 3000 | http://localhost:3000          |
| Backend (Apollo) | 4000 | http://localhost:4000          |
| Prisma Studio    | 5555 | run `npm run db:studio`        |

Other useful root scripts (defined in `package.json`):

- `npm run db:migrate` — `prisma migrate dev`
- `npm run db:generate` — `prisma generate` (run after editing `schema.prisma`)
- `npm run db:studio` — opens Prisma Studio
- `npm run db:pull` — pull schema from the DB (rare; see [Migrations](#11-migrations-and-schema-changes))
- `npm run build:frontend` / `npm run build:backend`

The backend has no `build` step today — it's run with `ts-node-dev` in development. Production deployment compiles via Next on the frontend and runs the backend through `ts-node` (or you can switch to a precompiled `tsc` step).

## 7. The data model

Defined in `packages/backend/prisma/schema.prisma`. Top-level entities:

```
Story ──┬── ImpactStat ── MediaItem
        │
        └── StoryStep ──┬── MediaItem
                        │
                        ├── DynamicPoint  ── MediaItem
                        │
                        └── DynamicPolygon ── (centerPoint → DynamicPoint)
                                              MediaItem

Icon         (registry, referenced by DynamicPoint.markerImage by name)
SiteSettings (singleton, id = 1, holds editable nav + landing copy)
```

Field-level notes for the staff-editable models:

### `Story`
- `id` — cuid; staff usually don't edit this.
- `title` — appears in the story dropdown.
- `impactStats[]`, `steps[]` — the chapters.

### `StoryStep`
- `order` — integer; steps are sorted ascending. Use 10, 20, 30 to leave room to insert.
- `title`, `content` — modal heading and body.
- `link` — optional; not yet rendered, reserved for future use.
- `mediaItems[]` — images/videos shown above the body, ordered by `order`.
- `layersToShow[]`, `layersToHide[]` — arrays of strings naming base-map layer IDs (see [Adding a base layer](#9-adding-a-new-map-base-layer-developer-task)). Typos are caught in dev: the console warns with the list of valid IDs.
- `nextButtonText` — overrides the default "Continue" / "Explore" label.
- `modalPosition` — `CENTER` | `TOP_LEFT` | `TOP_RIGHT` | `BOTTOM_LEFT` | `BOTTOM_RIGHT`.
- `zoom`, `latitude`, `longitude`, `pitch`, `bearing` — Mapbox `flyTo` parameters. All optional; if `latitude` and `longitude` are both null the camera doesn't move.
- `dynamicPoints[]`, `dynamicPolygons[]` — the geometry rendered while this step is active.

### `DynamicPoint`
- `latitude`, `longitude` — required floats.
- `name`, `description` — appear in the click popup. **Plain text only** — both are inserted via DOM `textContent`, so HTML in the field is rendered as literal text (anti-XSS).
- `link` — optional URL; renders a "Learn more" anchor in the popup.
- `color` — hex string (e.g. `#ff8800`). Used for the fallback circle marker.
- `markerImage` — name of an entry in the `Icon` table. If set and the icon loads, the point renders as a custom symbol; if absent, the colored circle fallback is used.
- `order` — for stable draw order when staff care.

### `DynamicPolygon`
- `geometry` — a GeoJSON `Polygon` or `MultiPolygon` JSON object. Easiest authoring path: draw it in [geojson.io](https://geojson.io/) and paste the `geometry` value into the field.
- `fillColor`, `fillOpacity` (0..1), `lineColor`, `lineWidth` — paint properties.
- `centerPointId` — optional one-to-one to a `DynamicPoint` that acts as the polygon's label/anchor.

### `MediaItem`
- `type` — `IMAGE` or `VIDEO`.
- `source` — URL. Either an absolute URL (S3, Cloudinary, YouTube direct, etc.) or a path served from `packages/frontend/public/` (e.g. `/media/pictures/foo.jpg`).
- `alt`, `caption` — optional. `alt` is required by accessibility best practice on images.
- `order` — ascending.

### `Icon`
- `name` — unique key, referenced by `DynamicPoint.markerImage`.
- `url` — absolute URL or `/`-prefixed public path. PNGs work best.

### `SiteSettings` (singleton, `id = 1`)
- `organizationName`, `landingTitle`, `landingSubtitle`, `landingCtaText`
- `donateUrl`, `donateLabel`, `contactUrl`, `contactLabel`

Edit the row to change copy; refresh the site to see it.

## 8. Editing content in Prisma Studio

Staff workflow for adding / editing content:

```bash
npm run db:studio       # opens http://localhost:5555
```

Recipes:

**Edit landing or nav copy.** Open `SiteSettings`, edit fields on the row with `id = 1`. There is only one row by design.

**Add a new story.**
1. Open `Story` → "Add record" → set `title` → Save. Prisma generates the `id`.
2. Open `StoryStep` → add records, each pointing at `storyId` from step 1. Set `order` (10, 20, 30…), `title`, `content`. Optionally set camera fields (`zoom`, `latitude`, `longitude`, `pitch`, `bearing`).

**Add an image to a step.**
1. Upload the image to wherever the org hosts media (or drop it in `packages/frontend/public/media/...` if a developer is involved).
2. In `MediaItem`, add a record with `storyStepId` set, `type = IMAGE`, `source = <url>`, `alt = "..."`, `order` ascending.

**Add a marker to a step.** In `DynamicPoint`, add a record pointing at the step's id, set `latitude`/`longitude`/`name`/`description`. Optionally set `color` for the fallback circle, or `markerImage` set to an `Icon.name` to use a custom icon.

**Add a polygon.** Author the GeoJSON in geojson.io, copy just the `"geometry": {...}` value, paste it into `DynamicPolygon.geometry`. Set `fillColor` etc. Optionally point `centerPointId` at a `DynamicPoint` for a label anchor.

**Register a new icon.** In `Icon`, add a row with a unique `name` and a `url`. Then any `DynamicPoint.markerImage = "<name>"` will use it.

**Show or hide a base layer in a step.** Put the layer's id (e.g. `"roads"`, `"country-boundaries"`) into `StoryStep.layersToShow` or `layersToHide`. The valid IDs come from `packages/frontend/app/components/Map/layerGroup.ts`. Typos log a warning in the browser dev console listing valid IDs.

> **Why some things are *not* in the database.** Mapbox base layers (`layerGroup.ts`) are intentionally code, not DB rows: editing raw Mapbox style-spec JSON in Studio is a poor authoring experience and a single typo would break the whole map. Adding a layer is a developer task — see the next section.

## 9. Adding a new map base layer (developer task)

`layerGroup.ts` is a registry of base-map layers (roads, political boundaries, future custom tilesets) that staff can toggle from `StoryStep.layersToShow` / `layersToHide`.

```ts
// packages/frontend/app/components/Map/layerGroup.ts
const layerGroups: Record<string, LayerGroupItem[]> = {
  '0': [
    {
      id: 'roads',                    // ← the string staff type into Studio
      sourceId: 'roads',
      source: { type: 'vector', url: 'mapbox://mapbox.mapbox-streets-v8' },
      layer: {
        id: 'roads',
        type: 'line',
        source: 'roads',
        'source-layer': 'road',
        paint: { 'line-color': '#555', 'line-width': 2 },
      },
    },
  ],
  // ...
};
```

To add a layer:
1. Append an entry with a unique `id`. The `id` is what staff will type into `layersToShow` / `layersToHide`.
2. `source` accepts any Mapbox source spec (vector tileset URL, GeoJSON, etc.). `sourceId` should match the source's id.
3. The layer is registered hidden on map load; it becomes visible only when a step lists it in `layersToShow`.
4. Tell the comms team the new id exists.

`availableLayerIds` is auto-derived from this file and used by `MapCanvas` to warn (in dev only) when a step references an id that isn't registered.

## 10. GraphQL API

Schema lives in `packages/backend/schema.graphql`. The frontend's queries and the `MediaItemFields` fragment are in `packages/frontend/app/lib/queries.ts`.

| Query | Purpose |
| ----- | ------- |
| `stories` | Lightweight `[Story]` for the dropdown — id + title only. |
| `story(id)` | Full nested story tree. The whole experience for one initiative comes back in this single request. |
| `icons` | Icon registry — preloaded into Mapbox via `map.addImage` on map ready. |
| `siteSettings` | Singleton row of editable site copy / nav URLs. The resolver upserts it so a missing seed never breaks the query. |

GeoJSON shape is computed in `resolvers.ts`:
- `DynamicPoint` rows → GeoJSON `Feature<Point>` with `properties` carrying the editable fields.
- `DynamicPolygon` rows → `Feature` whose `geometry` is the JSON column verbatim, plus paint properties.

You can poke the API directly via Apollo Sandbox at http://localhost:4000.

## 11. Migrations and schema changes

Migrations live in `packages/backend/prisma/migrations/`, one timestamped folder per change, each with a `migration.sql`.

Workflow when changing the schema:

```bash
# 1. Edit packages/backend/prisma/schema.prisma
# 2. Generate a migration and apply it to the local DB
npm run db:migrate
#    → prompts for a name, creates the migration folder, runs it
# 3. Regenerate the Prisma client (db:migrate usually does this; if not:)
npm run db:generate
# 4. Update GraphQL schema + resolvers if the change is user-facing
# 5. Update the frontend queries + types
# 6. Commit schema.prisma + the new migration folder + code edits together
```

For singleton tables (like `SiteSettings`) the migration should `INSERT ... ON CONFLICT DO NOTHING` so a fresh DB has the row immediately.

Avoid `db:pull` unless you've edited the database out-of-band — Prisma is the source of truth in this repo, not the live schema.

## 12. Deployment

The current plan (per the capstone report) is to host the Explorer alongside `thetipiraisers.org` either on a subdomain or embedded as a page. That decision will dictate the host:

**Frontend (Next.js)**
- Vercel is the lowest-friction host: connect the repo, set `NEXT_PUBLIC_GRAPHQL_ENDPOINT` and `NEXT_PUBLIC_MAPBOX_TOKEN` as project env vars, deploy.
- Set the project root to `packages/frontend` (or use a Vercel monorepo config).
- Lock the Mapbox token down by setting URL restrictions in the Mapbox account.

**Backend (Apollo + Postgres)**
- Any Node host works (Render, Fly, Railway, a small EC2). The server reads `DATABASE_URL` and listens on port 4000 by default — change the port in `apollo.ts` if your host requires it.
- The Postgres instance can be managed (Supabase, Neon, RDS) or self-hosted. Whichever it is, run `prisma migrate deploy` (not `migrate dev`) on the first boot to apply migrations idempotently.

**Mapbox usage**
- Free tier: 50k map renders + 100k vector tile renders / month.
- The landing splash is intentional, gating the map mount to prevent abuse.
- Add Mapbox URL restrictions to the production token to prevent token theft.

## 13. Troubleshooting

**"Cannot find module @prisma/client" / runtime "PrismaClient is unable to be run".** You changed `schema.prisma` and didn't regenerate. `npm run db:generate`.

**Backend won't start: "schema.graphql not found".** `apollo.ts` reads `../../schema.graphql` relative to the compiled file. If you're running it from a different cwd, fix the working directory or the path.

**Map shows but markers don't.** Open the dev console. Common causes:
- `Failed to load icon "<name>" from <url>` — the `Icon` row's URL is wrong.
- `StoryStep.layersToShow references unknown layer id "<typo>"` — fix the value in Studio (the warning lists valid ids).

**A polygon doesn't render.** Check that `geometry` is valid GeoJSON. Paste it into geojson.io to verify. Also confirm `fillOpacity` is between 0 and 1.

**Stories dropdown is empty / "Unable to load stories".** The frontend can't reach the GraphQL endpoint. Verify:
- Backend is running on the URL in `NEXT_PUBLIC_GRAPHQL_ENDPOINT`.
- CORS isn't blocking — Apollo Server's standalone mode allows all origins by default; if you've put it behind a proxy, add the frontend origin.

**Studio shows no `SiteSettings` row.** The migration includes an `INSERT ... ON CONFLICT DO NOTHING`. If your DB pre-dates that migration, add the row manually with `id = 1` — the server's `siteSettings` resolver will also upsert on first read.

## 14. Future improvements

Open work, in rough priority order:

1. **Backend production build step.** Add `tsc`/`tsup` + a `start` script so production doesn't depend on `ts-node`.
2. **Scheduled ETL from Google Sheets.** A Python script (`packages/backend/src/services/etl.py`) is in place but not scheduled. Wire it up to a cron job or Google Cloud Scheduler so impact statistics update without staff touching Studio. Keep its DB role narrowly scoped (write-only on `ImpactStat`).
3. **Authenticated content for sensitive blog/event material.** A lightweight CAPTCHA on the landing CTA, or a credential-gated section, would harden against scraping bots if the org wants to host less-public material.
4. **Custom Mapbox tilesets for heavy data viz.** When dense statistical layers (heatmaps, choropleths) become available, register them in `layerGroup.ts` so steps can toggle them. Doing it this way keeps render counts low.
5. **Automated tests.** None today. Useful starting points: a Jest/Vitest test on the GeoJSON transform in `resolvers.ts`, plus a Playwright test that loads a story and clicks through every step.
---
Built during a 10-week internship with The Tipi Raisers.