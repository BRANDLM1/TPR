import { LayerSpecification, VectorSourceSpecification } from 'mapbox-gl';

interface LayerGroupItem {
  id: string;
  sourceId: string; // source id, separate from source details
  source: VectorSourceSpecification; // source config without id
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
export type { LayerGroupItem };
export default layerGroups