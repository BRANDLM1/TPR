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
12. [Launching to production](#12-launching-to-production)
13. [Troubleshooting](#13-troubleshooting)
14. [Known limitations](#14-known-limitations)

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

- **Dynamic points** — geocoded markers with a custom color or icon (looked up against an Icon registry), clickable popups that show the point's text **and any attached images/videos**, and optional `link` text
- **Dynamic polygons** — GeoJSON regions with editable fill color/opacity and stroke color/width, optionally anchored to a "center point" marker
- **Toggleable base layers** — registered in `layerGroup.ts` and shown/hidden by referencing layer IDs in the step's `layersToShow` / `layersToHide` arrays

The story modal can be **minimized** (X button or Esc): the map stays fully interactive while a "Resume story" pill at the bottom of the screen brings the modal back at the same step. The only way to fully leave a story is picking another one from the dropdown.

If the story has `ImpactStat` rows, a **round impact button** (bottom-center, using the initiative's `impactIcon` from the Icon registry, or a chart glyph) toggles a compact card of rotating statistics — auto-cycling every few seconds, with manual arrows and dots, pausing on hover.

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
- Apollo Server v5 on Express 5 (port 4000) — Express is there so CORS can be configured; see [§12](#12-launching-to-production)
- Schema-first GraphQL (`schema.graphql`)
- Prisma 6 ORM + Prisma Client
- PostgreSQL

**Tooling**
- npm workspaces (monorepo)
- `dotenv-cli` to inject `.env.local` into both workspace dev scripts
- `concurrently` to run frontend + backend in one terminal
- ESLint + Prettier

## 4. Repository layout

```
.
├── package.json                 # workspace root + db:* scripts
├── .env.example                 # template; copy to .env.local
├── packages/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # source of truth for DB
│   │   │   ├── seed.js                  # inserts one sample story (npm run db:seed)
│   │   │   └── migrations/<timestamped>/migration.sql
│   │   ├── schema.graphql               # GraphQL SDL
│   │   └── src/
│   │       ├── resolvers.ts             # Query resolvers + GeoJSON transforms
│   │       └── services/
│   │           ├── apollo.ts            # server entrypoint
│   │           ├── context.ts           # GraphQL context (Prisma)
│   │           └── database.ts          # Prisma client instance
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
│                   ├── MapLegend.tsx     # auto legend for the step's polygons
│                   └── layerGroup.ts     # registry of base-map layers
```

## 5. First-time setup

Prerequisites:
- Node.js 20+ (the repo pins **Node 22** via `.nvmrc` — the version it was built and tested on; run `nvm use` to match it)
- npm 10+
- A running PostgreSQL 14+ (local Docker, Postgres.app, Supabase, etc.)
- A Mapbox public access token — create one at https://account.mapbox.com/

```bash
# 1. Match the pinned Node version (recommended)
nvm use                 # reads .nvmrc → Node 22 (install it first if nvm prompts)

# 2. Clone and install all workspaces
git clone <repo-url> tpr
cd tpr
npm install

# 3. Configure environment
cp .env.example .env.local
# then edit .env.local — set DATABASE_URL and NEXT_PUBLIC_MAPBOX_TOKEN

# 4. Apply migrations and generate the Prisma client
npm run db:migrate      # runs prisma migrate dev
npm run db:generate     # regenerates the Prisma client

# 5. Seed one sample story so the app has something to show
npm run db:seed         # inserts a sample story (safe to delete later)

# 6. (optional) Confirm the data in Studio
npm run db:studio
# → SiteSettings has a row with id = 1; Story has the sample story.
```

> **The seed is your proof-of-life.** A fresh database is empty, so without this
> step the story dropdown is blank and there's no way to tell "broken" from
> "empty." After `npm run dev`, pick **"Sample Story — Pine Ridge"** from the
> dropdown: you should fly through three steps — an intro, a highlighted area
> (which appears in the bottom-left legend), and a clickable marker. That single
> click-through confirms the whole stack (Postgres → Prisma → GraphQL → map) is
> wired correctly. Delete or edit the sample story in Studio whenever you're
> ready to build your own — see [§8](#8-editing-content-in-prisma-studio).

`.env.local` lives at the repo root and is read by **both** workspaces via `dotenv-cli` (see each workspace's `dev` script). The same file holds backend secrets (`DATABASE_URL`) and public frontend values (`NEXT_PUBLIC_*`).

> **Two files feed the frontend, and they must agree.** `npm run dev` loads the
> root `.env.local` through `dotenv-cli`, but `npm run build --workspace=frontend`
> is a plain `next build` — it never sees the root file and reads only
> `packages/frontend/.env.local`. So a value can be correct in development and
> wrong (or absent) in a local production build. Keep `NEXT_PUBLIC_GRAPHQL_ENDPOINT`
> and `NEXT_PUBLIC_MAPBOX_TOKEN` identical in both files, or you will chase a
> bug that only reproduces after `npm run build`.
>
> This bites harder than a normal config mistake because `NEXT_PUBLIC_*` values
> are **inlined into the JavaScript bundle at build time**, not read at runtime —
> a wrong value is frozen into the deployed site. `app/lib/apollo.ts` now
> validates `NEXT_PUBLIC_GRAPHQL_ENDPOINT` and logs a console error rather than
> silently 404ing against the page origin, which is how this was caught.
>
> On a real deploy none of this applies: Vercel/Render inject env vars directly
> (see [§12](#12-launching-to-production)) and no `.env` file is used. Symptom to
> recognize: the app works with `npm run dev`, but a built copy shows an empty
> story dropdown and "We couldn't load this story".

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

- `npm run db:migrate` — `prisma migrate dev` (local development)
- `npm run db:deploy` — `prisma migrate deploy` (production; applies pending migrations, never resets)
- `npm run db:generate` — `prisma generate` (run after editing `schema.prisma`)
- `npm run db:seed` — inserts the sample story (idempotent; re-running won't duplicate it)
- `npm run db:studio` — opens Prisma Studio
- `npm run db:pull` — pull schema from the DB (rare; see [Migrations](#11-migrations-and-schema-changes))
- `npm run build:frontend` / `npm run build:backend`

In development the backend runs with `ts-node-dev`. For production it has a real `build` (`tsc` → `packages/backend/dist/`) and `start` (`node dist/services/apollo.js`) script, and the listen port is read from `process.env.PORT` (default 4000) so a host can inject it. See [§12](#12-launching-to-production) for the deploy flow.

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
- `impactIcon` — optional `Icon.name` from the Icon registry; shown on the round impact button for this initiative (e.g. a bison for the Bison project). Null → generic chart glyph.
- `impactStats[]`, `steps[]` — the chapters.

### `ImpactStat`
Displayed in the rotating **impact panel** — the round button at the bottom-center of the map (visible whenever the selected story has at least one stat).
- `order` — rotation order, ascending (10, 20, 30…).
- `title` — the label under the number (e.g. "Families served").
- `statistic` — integer; rendered large with thousands separators.
- `content` — optional supporting sentence (a recent achievement, context, timeframe).
- `link` — optional; renders a "Learn more" link.
- `mediaItems[]` — optional; the first image renders above the number.

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
- `mediaItems[]` — images/videos attached to the point render inside its click popup (above the description, in `order`).
- `color` — hex string (e.g. `#ff8800`). Used for the fallback circle marker.
- `markerImage` — name of an entry in the `Icon` table. If set and the icon loads, the point renders as a custom symbol; if absent, the colored circle fallback is used.
- `order` — for stable draw order when staff care.

### `DynamicPolygon`
- `geometry` — a GeoJSON `Polygon` or `MultiPolygon` JSON object. Easiest authoring path: draw it in [geojson.io](https://geojson.io/) and paste the `geometry` value into the field.
- `name` — shown in the **map legend** (see below). Give every polygon a clear, human-readable name.
- `fillColor`, `fillOpacity` (0..1), `lineColor`, `lineWidth` — paint properties.
- `centerPointId` — optional one-to-one to a `DynamicPoint` that acts as the polygon's label/anchor.

> **The map legend / "map key" builds itself.** There is no legend table to
> maintain. The bottom-left legend on the map is generated at runtime from the
> polygons in the *current step*: each one contributes its `name` and a swatch
> of its `fillColor`/`lineColor`. Add a named polygon to a step and it shows up
> in the legend automatically; steps with no polygons show no legend. Point
> markers are intentionally left out of the legend — they're self-describing
> (click for a popup) and listing every point would crowd the map.

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

**Add a marker to a step.** In `DynamicPoint`, add a record pointing at the step's id, set `latitude`/`longitude`/`name`/`description`. Optionally set `color` for the fallback circle, or `markerImage` set to an `Icon.name` to use a custom icon. To show photos or video in the marker's popup, add `MediaItem` rows with `dynamicPointId` set to the point's id.

**Add rotating impact stats to an initiative.** In `ImpactStat`, add rows with `storyId` set — `order` (10, 20, 30…), `title`, `statistic` (whole number), optional `content`/`link`. The round impact button appears at the bottom of the map whenever the selected story has at least one stat. To brand the button, set `Story.impactIcon` to an `Icon.name` from the registry (e.g. a bison PNG for the Bison initiative).

**Add a polygon.** Author the GeoJSON in geojson.io, copy just the `"geometry": {...}` value, paste it into `DynamicPolygon.geometry`. Set a `name` (it appears in the auto-generated map legend) and `fillColor` etc. Optionally point `centerPointId` at a `DynamicPoint` for a label anchor.

**Register a new icon.** In `Icon`, add a row with a unique `name` and a `url`. Then any `DynamicPoint.markerImage = "<name>"` will use it.

**Show or hide a base layer in a step.** Put the layer's id (e.g. `"roads"`, `"country-boundaries"`) into `StoryStep.layersToShow` or `layersToHide`. The valid IDs come from `packages/frontend/app/components/Map/layerGroup.ts`. Typos log a warning in the browser dev console listing valid IDs.

> **Why some things are *not* in the database.** Mapbox base layers (`layerGroup.ts`) are intentionally code, not DB rows: editing raw Mapbox style-spec JSON in Studio is a poor authoring experience and a single typo would break the whole map. Adding a layer is a developer task — see the next section.

### Visitor controls reference

What a visitor can do while a story is active, and which fields you set in
Studio to shape it:

| Control | What the visitor sees | What you set |
| --- | --- | --- |
| Continue / Back | Buttons at the bottom of the modal | `StoryStep.nextButtonText` overrides the label. Back is hidden automatically on step 1 |
| Explore (final step) | Replaces Continue on the last step | Automatic, based on `order` — leave the last step's `nextButtonText` blank so "Explore" isn't overridden |
| Minimize / Resume | The X button or Esc hides the modal so the visitor can pan the map and click markers; a "Resume story (n/m)" pill appears bottom-center to bring it back at the same step | Not something you configure — always available. The only way for a visitor to fully leave a story is picking a different one from the dropdown |
| Impact panel | A round button bottom-center of the map toggles a card of rotating stats | Appears automatically once the `Story` has at least one `ImpactStat` row. `order` sets rotation sequence; `Story.impactIcon` brands the button with an `Icon` |
| Marker popup | Click a `DynamicPoint` marker | `name` / `description` / `link` show as text; any `MediaItem` rows attached to the point show as images or video above the text |
| Map legend | Swatch list, bottom-left of the map | Appears automatically for any *named* `DynamicPolygon` in the current step |

You don't need to think about screen space — the app automatically moves the
legend, impact panel, and resume pill out of each other's way based on where
the active step's modal is positioned (`modalPosition`), so nothing you build
will end up hidden behind something else.

### Worked example: authoring one Vision 2035 initiative

This walks through building a real initiative end to end. Vision 2035 is a
ten-year strategy made up of several named projects (Bison, TEC at the Hub,
Homes, …), so the natural mapping is **one `Story` per initiative**, with each
`StoryStep` a chapter of that initiative's narrative.

Using **Vision 2035 — Bison** as the example:

**1. Create the Story.** `Story` → Add record → `title` = `Vision 2035 — Bison`.
Save; Prisma generates the `id`. Copy that id — every step references it.

**2. Add the steps.** In `StoryStep`, one record per chapter. Suggested shape:

| Field | Step 1 (intro) | Step 2 (the place) | Step 3 (impact) |
| --- | --- | --- | --- |
| `storyId` | *(the id from step 1)* | same | same |
| `order` | `10` | `20` | `30` |
| `title` | `Bringing the Buffalo Home` | `Pine Ridge Reservation` | `Where We Are Today` |
| `content` | the narrative paragraph shown in the modal | … | … |
| `modalPosition` | `CENTER` | `TOP_RIGHT` | `TOP_RIGHT` |
| `latitude` / `longitude` | *(leave null — opens wide)* | `43.0` / `-102.5` | `43.0` / `-102.5` |
| `zoom` | *(null)* | `8` | `9` |
| `layersToShow` | `[]` | `[]` | `[]` |

Use `order` values of 10/20/30 so you can insert a chapter later (15, 25)
without renumbering everything.

**3. Outline the land.** For a step that highlights an area (a reservation
boundary, the Hub's acreage, a grazing range): draw it at
[geojson.io](https://geojson.io/), copy just the `"geometry": { … }` value, and
paste it into a new `DynamicPolygon` record with `storyStepId` set. Give it a
clear `name` — that's what appears in the map legend. Both `Polygon` and
`MultiPolygon` geometries are supported.

**4. Drop markers.** For specific sites (the Hub in Lafayette CO, a wood-bank
distribution point, a garden site), add `DynamicPoint` records with
`latitude`, `longitude`, `name`, and `description`. The description is what
readers see when they click the marker.

**5. Add photos.** For each image, add a `MediaItem` with `storyStepId` set,
`type = IMAGE`, `source` = the image URL, `alt` = a short description, and
`order` ascending. They render above the narrative text, in `order`.

**6. Click through it.** Run `npm run dev`, pick the initiative from the
dropdown, and walk every step. This is the only reliable way to catch a
mistyped coordinate (the camera flies somewhere unexpected) or a bad polygon
(nothing appears and the legend stays empty).

> **Tip — the dropdown is sorted alphabetically by title.** To control the
> order initiatives appear in, prefix the titles (`1. Bison`, `2. Homes`, …)
> or name them so alphabetical order is the order you want. There is no
> separate ordering field on `Story` today (see
> [Known limitations](#14-known-limitations)).

**Seeding real content instead of hand-entering it.** Content lives in the
database, so stories written on one machine don't automatically appear on
another — *but a seed script does travel with the repo*. If you want a set of
initiatives to exist on every fresh install (including the org's production
database), add them to `packages/backend/prisma/seed.js` alongside the sample
story and they become one `npm run db:seed` away. That is the only way to hand
over prepared content through GitHub.

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

## 12. Launching to production

The Explorer has three deployable pieces and one external dependency. To go live, an owner needs to provision and connect all four:

| Piece | What it is | Who hosts it |
| --- | --- | --- |
| Frontend | The Next.js app the public visits | Subdomain on `thetipiraisers.org` **or** Vercel |
| Backend | The Apollo GraphQL server | Render / Fly / Railway / similar |
| Database | PostgreSQL | Supabase / Neon / RDS / similar |
| Mapbox token | Public access token used by the map | A Mapbox account owned by the org |

Recommended order to set them up: **DB first → backend → Mapbox token → frontend**. Each step depends on the one before it.

### Step 1 — Provision the production database

Pick a managed Postgres provider. For this scale, free tiers are sufficient:
- **Supabase** (free tier: 500 MB) — easiest, includes a web SQL editor.
- **Neon** (free tier: 0.5 GB) — serverless, scales to zero between requests.
- **AWS RDS / DigitalOcean / etc.** — only if the org already uses one.

After provisioning, you'll get a connection string like `postgresql://user:pass@host:5432/dbname`. Save it; this becomes `DATABASE_URL` everywhere.

**Recommended:** create **two database roles**, not one:
- A **migration role** with full DDL privileges (creates tables, alters columns). Used only when running migrations.
- A **runtime role** with `SELECT/INSERT/UPDATE/DELETE` on the app tables, but **no DDL**. Used by the running backend.

This means a compromised backend can't drop tables. It's optional but cheap insurance for production.

Apply the schema:

```bash
# from a machine with the migration role's URL in DATABASE_URL
DATABASE_URL="postgresql://migration-role@..." \
  npx prisma migrate deploy --schema=./packages/backend/prisma/schema.prisma
```

> Use `migrate deploy`, **not** `migrate dev`. `deploy` applies pending migrations idempotently without prompting. `dev` prompts for confirmation and can reset the DB — never run it in production.

After the migration, verify in Prisma Studio (or any SQL client) that the `SiteSettings` row exists with `id = 1`. If for some reason it doesn't, insert it: `INSERT INTO "SiteSettings" ("id") VALUES (1) ON CONFLICT DO NOTHING;`.

Then have staff open `SiteSettings` in Studio and customize the copy / URLs before launch.

### Step 2 — Production build is ready; set one environment variable (CORS)

The production build/start path already exists and has been verified end-to-end — you don't need to write it:

- `npm run build --workspace=backend` compiles to `packages/backend/dist/` (`tsc`).
- `npm start --workspace=backend` runs `node dist/services/apollo.js`.
- The listen port reads from `process.env.PORT` (default 4000), so the host can inject it.
- The server finds `schema.graphql` from the compiled location automatically (no copy step needed).

**Before exposing the backend publicly, set `CORS_ORIGIN`.** No code change is
needed — add it alongside `DATABASE_URL` in your host's environment variables:

```
CORS_ORIGIN=https://vision2035.thetipiraisers.org
```

Several origins are comma-separated, which is useful if you keep a staging site:

```
CORS_ORIGIN=https://vision2035.thetipiraisers.org,https://staging.thetipiraisers.org
```

A value is an **origin** — scheme + host + port, with no trailing slash or path.
Use `https://example.org`, not `https://example.org/` or `https://example.org/graphql`.

Leave it unset locally: with no value, every origin is allowed, which is what
you want while developing against `localhost:3000`. If it is unset while
`NODE_ENV=production`, the server still starts — it will not take a live site
down over a missing variable — but it prints a warning to the host's logs:

```
[cors] CORS_ORIGIN is not set — every origin is allowed. Set it to the frontend URL ...
```

On boot the server always logs what it settled on, so you can confirm it from
the host's log tab without guessing:

```
Server ready at: http://localhost:4000/
CORS allowed origins: https://vision2035.thetipiraisers.org
```

<details>
<summary>What CORS is doing here, and why the server uses Express</summary>

CORS is a browser rule: a page served from one origin cannot read responses
from a different origin unless that server says it may. The frontend and
backend are always different origins (different ports in development, usually
different domains in production), so this applies to every request the map
makes.

This API is read-only — `schema.graphql` defines only `type Query`, there are
no mutations, no login, and no cookies — so a permissive setting does not
expose private data. What it does allow is any other website calling this
backend from its visitors' browsers, serving the org's content at the org's
hosting expense. That is the reason to set it.

The server is built on Express rather than Apollo's simpler
`startStandaloneServer` specifically because of this. That helper hardcodes
`cors()` with no arguments — allow every origin — and accepts no CORS option,
so on the standalone server there is no way to restrict origins at all.

</details>

> **Do not run `npm run db:seed` against production.** The seed inserts a *sample*
> story for local proof-of-life. Production content is created by staff in Studio
> (or migrated from your dev DB). If you do seed it by accident, delete the
> "Sample Story — Pine Ridge" row in Studio before launch.

### Step 3 — Deploy the backend

Pick a Node host. **Render** is the easiest — free tier with cold starts, ~$7/mo for always-on. Fly and Railway are equivalent.

On the host:
1. Connect the repo, set the build command to `npm install && npm run build --workspace=backend` and start command to `npm start --workspace=backend`.
2. Set environment variable `DATABASE_URL` = the **runtime role's** connection string (not the migration one).
3. The host will assign a public URL, e.g. `https://tpr-backend.onrender.com`. Save this; it becomes `NEXT_PUBLIC_GRAPHQL_ENDPOINT` for the frontend.
4. Hit `https://<your-backend-url>/` in a browser — you should see the Apollo Sandbox landing page. Run a `query { stories { id title } }` to confirm the DB connection works.

**Whenever the schema changes after launch:** the migration role must run `prisma migrate deploy` against production *before* deploying the new backend code. If you deploy code that expects a column the DB doesn't have, the resolvers will throw. The safe order is always: migrate first, then deploy code.

### Step 4 — Hand over the Mapbox account

The app uses Mapbox's public `outdoors-v11` style — there's nothing custom on your account that needs transferring. What's tied to your account is just the **public access token**.

Cleanest handover (5 minutes):

1. Org creates a Mapbox account at https://account.mapbox.com/.
2. In their dashboard → **Tokens** → **Create a token**.
3. Set scope to **Public** (default scopes are fine).
4. **Critical: add URL restrictions** under "URL restrictions" before saving. List exactly the domains the token may be used from, e.g.:
   - `https://vision2035.thetipiraisers.org`
   - `https://www.thetipiraisers.org` (if embedding)

   Without this, anyone who views the page source can copy the token and burn through the org's free-tier quota on their own sites.

5. Copy the token (starts with `pk.`). This is the new `NEXT_PUBLIC_MAPBOX_TOKEN`.
6. Billing now lives on the org's account. The free tier (50k map renders + 100k vector-tile renders / month) is enough for the expected traffic; the landing splash gating the map mount keeps casual visitors from burning renders unnecessarily.

The token in your dev environment can stay as-is or be revoked once the org's token is in production.

### Step 5 — Deploy the frontend

Two options:

**Option A — Vercel (lowest friction).**
1. Import the repo. Set the project root to `packages/frontend`.
2. Add environment variables in Vercel:
   - `NEXT_PUBLIC_GRAPHQL_ENDPOINT` = the backend URL from Step 3 (e.g. `https://tpr-backend.onrender.com/`)
   - `NEXT_PUBLIC_MAPBOX_TOKEN` = the org's new token from Step 4
3. Deploy. Vercel returns a `*.vercel.app` URL.
4. Add the custom domain (e.g. `vision2035.thetipiraisers.org`). Vercel gives a CNAME target; the org's IT person adds it to the DNS record for `thetipiraisers.org`.

**Option B — Subdomain on existing hosting.**
If their existing host can serve a Node app, build with `npm run build --workspace=frontend` and serve `packages/frontend/.next` with `npm run start --workspace=frontend`. Same env vars as above. This route is more work and only worth it if their IT prefers everything under one host.

After DNS propagates (minutes to a few hours), the Explorer is live at `vision2035.thetipiraisers.org`.

### Launch checklist

Before flipping DNS, walk through:

- [ ] Production DB is migrated (`prisma migrate deploy` ran cleanly).
- [ ] `SiteSettings` row exists; staff have edited copy + URLs.
- [ ] At least one real `Story` with at least one `StoryStep` exists, otherwise the dropdown is empty.
- [ ] The sample seed story is **not** in production (it's for local setup only — delete it if present).
- [ ] Backend is reachable at the URL set in `NEXT_PUBLIC_GRAPHQL_ENDPOINT`.
- [ ] `CORS_ORIGIN` is set on the backend host to the frontend's production origin (check the boot log: `CORS allowed origins: ...`).
- [ ] Mapbox token has URL restrictions matching the production domain.
- [ ] Mapbox token in production env vars is the org's, not yours.
- [ ] Click through every story end-to-end on the staging URL once.

## 13. Troubleshooting

**"Cannot find module @prisma/client" / runtime "PrismaClient is unable to be run".** You changed `schema.prisma` and didn't regenerate. `npm run db:generate`.

**Backend won't start: "schema.graphql not found".** `apollo.ts` reads `../../schema.graphql` relative to the compiled file. If you're running it from a different cwd, fix the working directory or the path.

**Map shows but markers don't.** Open the dev console. Common causes:
- `Failed to load icon "<name>" from <url>` — the `Icon` row's URL is wrong.
- `StoryStep.layersToShow references unknown layer id "<typo>"` — fix the value in Studio (the warning lists valid ids).

**A polygon doesn't render.** Check that `geometry` is valid GeoJSON. Paste it into geojson.io to verify. Also confirm `fillOpacity` is between 0 and 1.

**Stories dropdown is empty / "Unable to load stories".** The frontend can't reach the GraphQL endpoint. Verify:
- Backend is running on the URL in `NEXT_PUBLIC_GRAPHQL_ENDPOINT`.
- CORS isn't blocking — check the backend's boot log for `CORS allowed origins:`. If it lists an origin that doesn't exactly match where the frontend is served from (scheme, host and port all have to match), fix `CORS_ORIGIN` on the host. In the browser console a CORS failure names the blocked origin explicitly.

**Studio shows no `SiteSettings` row.** The migration includes an `INSERT ... ON CONFLICT DO NOTHING`. If your DB pre-dates that migration, add the row manually with `id = 1` — the server's `siteSettings` resolver will also upsert on first read.

**A story shows nothing at all when selected.** It probably has no `StoryStep`
records yet. A story with zero steps is valid in the database and the API
returns it happily, but there is nothing for the app to display, so the map
just sits there. Add at least one step.

**The impact button doesn't appear.** The selected story has no `ImpactStat`
rows — the button only renders when there is at least one stat to show.

**The impact button shows a chart glyph instead of the initiative's icon.**
`Story.impactIcon` is empty, doesn't match any `Icon.name` in the registry, or
the icon's `url` doesn't load. The glyph is the designed fallback, not an error.

**The story modal disappeared and I can't get it back.** It was minimized (X
or Esc). Click the "Resume story" pill at the bottom-center of the map — the
story reopens at the same step. Selecting the story again from the dropdown
restarts it from step 1 instead.

## 14. Known limitations

Things a future developer should know are *deliberately* incomplete, so nobody
loses a day discovering them the hard way. None of these break the app.

**`DynamicPoint.renderType` is unused.** It's in the schema and the query, but
the map decides between an icon and a circle purely by whether `markerImage`
is set and its image loaded. Treat the field as reserved.

**Stories are ordered alphabetically by title.** `Story` has no `order` column,
so the dropdown sorts by `title` ascending. Prefix titles to control ordering,
or add an `order` field (schema + migration + `orderBy` in the `stories`
resolver) if a curated sequence matters.

**One error anywhere fails the whole story.** The Apollo client sets no
`errorPolicy`, so it uses the default (`none`): if any field in the `story`
query errors, the client discards the entire response and the UI shows
"We couldn't load this story" rather than rendering the parts that worked.
This is deliberate for now — during setup you *want* loud failures — but it
means a single malformed record takes down its whole initiative. If you'd
rather degrade gracefully in production, set `errorPolicy: 'all'` on the query
and adjust the error branch in `getCurrentModalState` so it only shows the
error modal when `data` is genuinely absent.

**No route back to the landing screen.** Once the map mounts, the splash page
is gone until the browser is reloaded.

---
Built during a 10-week internship with The Tipi Raisers.