// Database seed — inserts ONE complete sample story so a freshly set-up
// machine has something to look at immediately after `npm run db:migrate`.
//
// Why this exists:
//   • Proof of life. After cloning, installing, and migrating, the database
//     is empty — the story dropdown would be blank and you'd have no way to
//     tell "is it broken?" from "is it just empty?". Running this seed gives
//     you a working story to click through end-to-end.
//   • Worked example. Every field staff will edit in Prisma Studio is filled
//     in here with a real value, so this file doubles as a reference for how
//     the pieces (steps, polygons, points, icons) fit together.
//
// It is intentionally plain CommonJS JavaScript (not TypeScript): it runs with
// a bare `node` and needs no ts-node, tsconfig, or build step, so it behaves
// identically on every machine.
//
// Run it with:   npm run db:seed         (from the repo root)
// Re-seed clean: npx prisma migrate reset --schema=./packages/backend/prisma/schema.prisma
//                (drops everything, re-applies migrations, then runs this seed)
//
// SAFE TO DELETE the sample story before launch: open Story in Studio and
// delete the "Sample Story" row (delete its steps/points/polygons first, since
// the schema has no cascade). Or just leave it — staff can edit it in place.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// A stable title we can detect so re-running the seed doesn't pile up
// duplicate sample stories.
const SAMPLE_TITLE = 'Sample Story — Pine Ridge (delete or edit me)';

async function main() {
  // 1. SiteSettings singleton. The migration already inserts row id=1 with the
  //    schema defaults; this upsert just guarantees it exists even on a DB that
  //    predates that migration. We don't overwrite staff edits on update.
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  // 2. An icon registry entry, to demonstrate the Icon table. DynamicPoints can
  //    reference this by `markerImage: "tipi"`. (The sample point below uses the
  //    colored-circle fallback instead, so the demo never depends on this image
  //    actually loading — see the note on the point.)
  await prisma.icon.upsert({
    where: { name: 'tipi' },
    update: {},
    create: {
      name: 'tipi',
      // Replace with the org's own hosted PNG. A '/'-prefixed path served from
      // packages/frontend/public also works (e.g. "/icons/tipi.png").
      url: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Tipi.png',
    },
  });

  // 3. Idempotency guard: if the sample story is already here, stop. Use
  //    `prisma migrate reset` for a full wipe-and-reseed.
  const existing = await prisma.story.findFirst({ where: { title: SAMPLE_TITLE } });
  if (existing) {
    console.log(`Seed: sample story already present (id=${existing.id}); skipping.`);
    console.log('To wipe and re-seed: npx prisma migrate reset --schema=./packages/backend/prisma/schema.prisma');
    return;
  }

  // 4. The sample story, created with nested writes so its steps — and each
  //    step's points/polygons — are inserted in one call. Three steps walk
  //    through the three things a step can do: a text intro, a highlighted
  //    area (polygon → shows in the bottom-left legend), and an interactive
  //    marker (point → click popup).
  const story = await prisma.story.create({
    data: {
      title: SAMPLE_TITLE,
      steps: {
        create: [
          // --- Step 1: text-only intro, centered modal, wide camera ---
          {
            order: 10,
            title: 'Welcome',
            content:
              "This is a sample story seeded so you can see the Explorer working before you build your own. " +
              "Click Continue to fly to a highlighted area, then to an interactive marker. " +
              "Edit or delete this story in Prisma Studio whenever you're ready.",
            modalPosition: 'CENTER',
            layersToShow: [],
            layersToHide: [],
            // Wide view over the northern Great Plains.
            latitude: 43.2,
            longitude: -102.4,
            zoom: 6,
            pitch: 0,
            bearing: 0,
          },

          // --- Step 2: a highlighted area (polygon). Because the polygon has a
          //     `name` and fill/line colors, it appears in the bottom-left map
          //     legend automatically — no separate "map key" to maintain. ---
          {
            order: 20,
            title: 'A highlighted area',
            content:
              'Polygons highlight regions. This one has a name and colors, so it shows up in the ' +
              'legend at the bottom-left of the map. Author polygon shapes at geojson.io and paste ' +
              'the geometry into the DynamicPolygon.geometry field.',
            modalPosition: 'TOP_RIGHT',
            layersToShow: [],
            layersToHide: [],
            latitude: 43.2,
            longitude: -102.4,
            zoom: 8,
            pitch: 0,
            bearing: 0,
            dynamicPolygons: {
              create: [
                {
                  name: 'Sample Highlighted Area',
                  fillColor: '#d98a3d',
                  fillOpacity: 0.4,
                  lineColor: '#7a4a1e',
                  lineWidth: 2,
                  order: 0,
                  // A simple rectangle. GeoJSON is [longitude, latitude] order,
                  // and the ring must close (first point == last point).
                  geometry: {
                    type: 'Polygon',
                    coordinates: [
                      [
                        [-103.0, 43.0],
                        [-101.8, 43.0],
                        [-101.8, 43.4],
                        [-103.0, 43.4],
                        [-103.0, 43.0],
                      ],
                    ],
                  },
                },
              ],
            },
          },

          // --- Step 3: an interactive marker (point), last step ("Explore"). ---
          {
            order: 30,
            title: 'An interactive marker',
            content:
              'Points are clickable markers. Click the dot on the map to open its popup. ' +
              'A point can render as a custom icon (via the Icon registry + markerImage) or, ' +
              'as here, a simple colored circle.',
            modalPosition: 'BOTTOM_LEFT',
            nextButtonText: 'Explore the map',
            layersToShow: [],
            layersToHide: [],
            latitude: 43.2,
            longitude: -102.4,
            zoom: 9,
            pitch: 0,
            bearing: 0,
            dynamicPoints: {
              create: [
                {
                  // latitude/longitude are required on a point — this is where
                  // the marker sits on the map.
                  latitude: 43.2,
                  longitude: -102.4,
                  name: 'Sample Marker',
                  description:
                    'Click a marker to see details like this. Name and description are plain text ' +
                    '(HTML is escaped, so untrusted content is safe).',
                  link: 'https://www.thetipiraisers.org/',
                  // `color` drives the circle fallback. We deliberately leave
                  // markerImage unset so this marker is always visible even if
                  // the icon image fails to load.
                  color: '#c0392b',
                  order: 0,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Seed: created sample story "${story.title}" (id=${story.id}) with 3 steps.`);
  console.log('Start the app (npm run dev) and pick it from the story dropdown to verify.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
