'use client'
import { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import layerGroups, { LayerGroupItem } from './layerGroup';
import Nav from '../Global/Nav';
import dynamic from 'next/dynamic'
const Dropdown = dynamic(() => import('../Global/Dropdown'), { ssr: false });

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapContainer() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const addedLayers = useRef<Set<string>>(new Set());

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current!,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [-105.8, 39.5],
      zoom: 6,
      maxBounds: [-129.533,24.132,-66.896,52.180],
      minZoom: 4,
      maxZoom: 10,
    });

    mapRef.current = map;

    map.on('error', (e) => {
      console.error('Map error:', e);
    });

    map.on('sourcedataloading', (e) => {
      console.log('Loading source:', e.sourceId);
    });

    map.on('sourcedata', (e) => {
      if (e.isSourceLoaded) {
        console.log('Source loaded successfully:', e.sourceId);
      }
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

      Object.values(layerGroups).flat().forEach(({id, sourceId, source, layer}) => {
        if(!map.getSource(sourceId)){
          map.addSource(sourceId, source);
        }
        if (!map.getLayer(layer.id)) {
          map.addLayer({
            ...layer,
            layout: { visibility: 'none' },
          });
          addedLayers.current.add(id);
        }
      });
    });
    return () => map.remove();
  },[]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !selectedGroup) return;
    console.log('[Effect] selectedGroup changed:', selectedGroup);
    addedLayers.current.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    // Show selected group layers
    if (!selectedGroup) return;
    const group = layerGroups[selectedGroup] || [];
    group.forEach(({ id }) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', 'visible');
      }
    });
  }, [selectedGroup]);


  const handleGroupChange = useCallback((val: string) => {
    console.log('[Parent] Group changed to:', val);
    setSelectedGroup(val);
  }, []);

  console.log('[Parent] Rendering with selectedGroup:', selectedGroup);



  
  return (<div style={{ width: '100%', height: '100%' }}>
    <Nav>
      <div 
      style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>

        <Dropdown 
          value ={selectedGroup}
          onChange={handleGroupChange} />
      </div>
    </Nav>

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}