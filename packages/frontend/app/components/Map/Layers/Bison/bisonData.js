
export const tribalHerdsData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-105.583333, 45.316667] }, // Northern Cheyenne Tribe, MT
      properties: { name: 'Northern Cheyenne Buffalo Herd' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-98.6796, 34.8115] }, // Kiowa Tribe, OK
      properties: { name: 'Kiowa Tribe Buffalo Herd' },
    },
  ],
};

export const ghostBisonData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-89.6501, 39.7817] }, // Central Illinois (historical range)
      properties: { location: 'Illinois Plains' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-83.4479, 41.6639] }, // Ohio Valley (historical range)
      properties: { location: 'Ohio Valley' },
    },
  ],
};