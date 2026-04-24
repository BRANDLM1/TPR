// Registry of base-map layers (roads, political boundaries, future tilesets)
// that a StoryStep can toggle via layersToShow / layersToHide in Studio.
//
// HOW TO ADD A NEW LAYER
//   1. Add an entry below with a unique `id`. The id is the string staff
//      will type into StoryStep.layersToShow / layersToHide.
//   2. Set `source` to a VectorSourceSpecification (or any source spec
//      Mapbox accepts). `sourceId` must match the id on the source.
//   3. The layer is registered hidden on map load; a step shows it by
//      listing its id in layersToShow.
//   4. Update packages/frontend/README (or hand-off doc) so the nonprofit
//      knows the id exists.
//
// Base-map layers are intentionally NOT in the database: editing a raw
// Mapbox style-spec JSON in Prisma Studio is a poor authoring experience
// and a single typo breaks the whole map. Points, polygons, stories, and
// icons ARE in the database because those are the day-to-day content.

import { LayerSpecification, VectorSourceSpecification } from 'mapbox-gl';

interface LayerGroupItem {
  id: string;
  sourceId: string;
  source: VectorSourceSpecification;
  layer: LayerSpecification & { id: string };
}

const layerGroups: Record<string, LayerGroupItem[]> = {

  '0': [
    {
      id: 'roads',
      sourceId: 'roads',
      source: {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'
      },
      layer: {
        id: 'roads',
        type: 'line',
        source: 'roads',
        'source-layer': 'road',
        paint: {
          'line-color': '#555',
          'line-width': 2,
        }
      }
    },
  ],
  '1': [
    {
      id: 'country-boundaries',
      sourceId: 'country-boundaries',
      source: {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
      },
      layer: {
        id: 'country-boundaries',
        type: 'line',
        source: 'country-boundaries',
        'source-layer': 'country_boundaries',
        paint: {
          'line-color': '#3887be',
          'line-width': 3
        }
      }
    }
  ]
};

// Every layer id staff can reference from Studio. Exported so callers
// can validate that a layersToShow / layersToHide value actually resolves.
export const availableLayerIds: ReadonlyArray<string> = Object.values(layerGroups)
  .flat()
  .map(item => item.layer.id);

export type { LayerGroupItem };
export default layerGroups;
