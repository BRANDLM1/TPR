'use client'
import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapContainer() {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [-105.8, 39.5],
      zoom: 6,
      "bbox": [ -125.0011, 24.9493, -66.9326, 49.5904 ]

    });


    //Removing initialized state territory layers of streetmap 
    map.on('load', () => {

        const layersToHide = [
            'admin-1-boundary',     // US State lines
            '/admin-1-boundary-bg'   // Background of state lines
        ]

        layersToHide.forEach(id => {
            if (map.getLayer(id)){
                map.removeLayer(id);
            }
        })
    });

    // Example: Add GeoJSON source and territory layer
    // map.on('load', () => {
    //   map.addSource('territories', {
    //     type: 'geojson',
    //     data: '/data/territories.geojson',
    //   });

    //   map.addLayer({
    //     id: 'territory-fill',
    //     type: 'fill',
    //     source: 'territories',
    //     paint: {
    //       'fill-color': '#088',
    //       'fill-opacity': 0.4,
    //     },
    //   });
    // });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}