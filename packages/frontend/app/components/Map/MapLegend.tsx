'use client';

// Small map key, bottom-left, listing each polygon visible at the current
// step with a swatch of its fill/line color + its name. Renders nothing
// when the step has no polygons (so the initial pre-story view stays
// clean). Keep this scoped to polygons — point icons are self-describing
// and have click popups, and listing every point would crowd the UI.

interface LegendPolygon {
  id: number | string;
  name: string;
  fillColor: string;
  fillOpacity: number;
  lineColor: string;
}

export default function MapLegend({ polygons }: { polygons: LegendPolygon[] }) {
  if (!polygons || polygons.length === 0) return null;

  return (
    <aside
      className="fixed bottom-6 left-6 z-10 bg-white/95 backdrop-blur rounded-lg shadow-md px-4 py-3 max-w-xs pointer-events-none"
      aria-label="Map legend"
    >
      <h4 className="font-fell text-base text-black mb-2">Legend</h4>
      <ul className="space-y-1.5">
        {polygons.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-2 text-sm font-lato text-black"
          >
            <span
              className="inline-block w-4 h-4 rounded-sm flex-shrink-0"
              style={{
                backgroundColor: p.fillColor,
                opacity: p.fillOpacity,
                border: `1px solid ${p.lineColor}`,
              }}
              aria-hidden
            />
            <span>{p.name}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
