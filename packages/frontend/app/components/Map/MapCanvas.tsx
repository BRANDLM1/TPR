'use client'
import {useRef, useEffect, useState, useCallback} from 'react';
import mapboxgl from 'mapbox-gl';
import layerGroups from './LayerGroup';
import StoryModal from './StoryModal';
import { useQuery } from '@apollo/client';
import { GET_STORY_BY_ID } from '../../lib/queries';
import Nav from '../Global/Nav';
import dynamic from 'next/dynamic'
import Image from 'next/image';
const Dropdown = dynamic(() => import('../Global/Dropdown'), {ssr: false});

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface VisionState {
  currentStory: string | null;
  currentStep: number;
  showModal: boolean;
}
interface StepConfig {
  layersToShow: string[];
  layersToHide: string[];
  dynamicPoints?: any[];
  dynamicPolygons?: any[];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  latitude?: number;
  longitude?: number;
}

export default function MapContainer() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const addedLayers = useRef<Set<string>>(new Set());

  const [VisionState, setVisionState] = useState <VisionState>({
    currentStory: null,
    currentStep: 0,
    showModal: false
  });
  const { loading, error, data: storyData } = useQuery(GET_STORY_BY_ID, {
    variables: { id: VisionState.currentStory }, // Pass the selected story ID
    skip: !VisionState.currentStory, // IMPORTANT: Don't run the query until a story is selected
  });
  
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current!,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [-105.8, 39.5],
      zoom: 6,
      maxBounds: [-129.533,24.132,-66.896,52.180],
      minZoom: 1,
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
      
      const imageUrl = '/media/pictures/bison-icon.png';

      map.loadImage(imageUrl, (error, image) => {
        if (error) {
          console.error(`Failed to load image at path: ${imageUrl}`, error);
          return;
        }

        if (image) {
          if (!map.hasImage('bison-icon')) {
            map.addImage('bison-icon', image);
          }
        } else {
          console.error(`Image at ${imageUrl} loaded without an error, but the image object is missing.`);
        }
      });

      map.addSource('dynamic-polygons-source',{
        type:'geojson',
        data: {
          type :'FeatureCollection',
          features: []
        },
      });
      map.addLayer({
        id: 'dynamic-polygons-layer',
        source: 'dynamic-polygons-source',
        type: 'fill',
        paint: { 
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': ['get', 'fillOpacity'],
        }
      });
      map.addLayer({
          id: 'dynamic-polygons-stroke',
          type: 'line',
          source: 'dynamic-polygons-source', 
          paint: {
              'line-color': [
                  'get', 'lineColor'
              ],
              'line-width': [
                  'get', 'lineWidth'
              ]
          }
      });

      map.addSource('dynamic-points-source',{
        type:'geojson',
        data: {
          type :'FeatureCollection',
          features: []
        },
      });
      map.addLayer({
        id: 'dynamic-points-circles',
        type: 'circle',
        source: 'dynamic-points-source',
        paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': 8,
        },
        filter: ['==', ['get', 'renderType'], 'circle']
      });

      map.addLayer({
        id: 'dynamic-points-icons',
        type: 'symbol',
        source: 'dynamic-points-source',
        layout: {
            'icon-image': 'bison-icon', 
            'icon-size': 0.1,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
        },
        filter: ['==', ['get', 'renderType'], 'image']
      });

      map.on('click', 'dynamic-points-icons', (e) => {
       
      if (!e.features || e.features.length === 0) return;
    
      const feature = e.features[0];

      if (!feature.properties || feature.geometry.type !== 'Point') return;

      const coordinates = feature.geometry.coordinates.slice() as [number,number];
      const name = feature.properties.name || 'Details';
      const description = feature.properties.description || null;
      const link = feature.properties.link || null;
      

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<h3>${name}</h3><p>${description}</p> <p>${link}</p>`)
        .addTo(map);
    });
    map.on('click', 'dynamic-points-circles', (e) => {
       
      if (!e.features || e.features.length === 0) return;
    
      const feature = e.features[0];

      if (!feature.properties || feature.geometry.type !== 'Point') return;

      const coordinates = feature.geometry.coordinates.slice() as [number,number];
      const name = feature.properties.name || 'Details';
      const description = feature.properties.description || null;
      const link = feature.properties.link || null;
      

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<h3>${name}</h3><p>${description}</p> <p>${link}</p>`)
        .addTo(map);
    });


    // Changing the cursor to a pointer when over the points
    map.on('mouseenter', 'dynamic-points-icons', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseenter', 'dynamic-points-circles', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'dynamic-points-icons', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseleave', 'dynamic-points-circles', () => {
      map.getCanvas().style.cursor = '';
    });


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


  // Handle modal "Next" button
  const handleStoryNext = useCallback(() => {
    if (!storyData || !storyData.story) return;
    
    const story = storyData.story;

    const currentStepConfig = story.steps[VisionState.currentStep];
    
    // Apply layer changes when user clicks Next
    applyLayerChanges(currentStepConfig);
    
    // Move to next step or end story
    const nextStepIndex = VisionState.currentStep + 1;
    
    if (nextStepIndex < story.steps.length) {
      // Continue to next step
      setVisionState(prev => ({
        ...prev,
        currentStep: nextStepIndex,
        showModal: true // Always show modal for next step
      }));
    } else {
      // End of story
      setVisionState(prev =>({
        ...prev,
        showModal: false,
      }));
    }
  }, [VisionState, storyData]);

  // Handle going back
  const handleStoryBack = useCallback(() => {
    if (!storyData || !storyData.story || VisionState.currentStep === 0) return;
    
    const story = storyData.story;
    const prevStepIndex = VisionState.currentStep - 1;
    const prevStepConfig = story.steps[prevStepIndex];
    
    // Revert to previous step's layers
    applyLayerChanges(prevStepConfig);
    
    setVisionState(prev => ({
      ...prev,
      currentStep: prevStepIndex,
      showModal: true
    }));
  }, [VisionState, storyData]);

  // Apply layer visibility changes
  const applyLayerChanges = (stepConfig: StepConfig) => {
      
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Hide specified layers
    stepConfig.layersToHide.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
    
    // Show specified layers  
    stepConfig.layersToShow.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
      }
    });

    const pointsSource = map.getSource('dynamic-points-source') as mapboxgl.GeoJSONSource;
    if (pointsSource) {
      const pointsData = {
        type: 'FeatureCollection' as const,
        features: stepConfig.dynamicPoints || [], // Use the data or an empty array
      };
      pointsSource.setData(pointsData);
    }

    const polygonsSource = map.getSource('dynamic-polygons-source') as mapboxgl.GeoJSONSource;
    if (polygonsSource) {
      const polygonsData = {
        type: 'FeatureCollection' as const,
        features: stepConfig.dynamicPolygons || [], // Use the data or an empty array
      };
      polygonsSource.setData(polygonsData);
    }

    if (stepConfig.latitude && stepConfig.longitude) {
      map.flyTo({
        center: [stepConfig.longitude, stepConfig.latitude],
        zoom: stepConfig.zoom,
        pitch: stepConfig.pitch,
        bearing: stepConfig.bearing,
        essential: true, // Prioritize recentering
      });
    }
  };  

  // Hide all layers (reset state)
  const hideAllLayers = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    
    addedLayers.current.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
  };

  const handleDropdownChange = useCallback((storyId: string) => {
    console.log('[Vision Selected] Starting story:', storyId);
  
    // Clear all existing layers first
    hideAllLayers();
    
    // Initialize story
    setVisionState({
      currentStory: storyId,
      currentStep: 0,
      showModal: true,
    });
  }, []);

  // Get current modal content
  const getCurrentModalContent = () => {
    
    if (loading) 
      return {
      title: 'Loading...', 
      content: '', 
      mediaItems: [],
      canGoBack: false,
      isLastStep: false,
      };
    if (error) 
      return {
      title: 'Error', 
      content: 'Could not load story.', 
      mediaItems: [],
      canGoBack: false,
      isLastStep: false,
      };
  
    if (!storyData || !storyData.story || !VisionState.showModal) return null;

    const currentStepConfig = storyData.story.steps[VisionState.currentStep];
    if (!currentStepConfig) return null;

    return {
      title: currentStepConfig.title,
      content: currentStepConfig.content,
      mediaItems: currentStepConfig.mediaItems || [],
      nextButtonText: currentStepConfig.nextButtonText || 'Continue',
      position: currentStepConfig.modalPosition || 'CENTER',
      canGoBack: VisionState.currentStep > 0,
      isLastStep: VisionState.currentStep === storyData.story.steps.length - 1
    };
  };

  // Render logic
  const modalContent = getCurrentModalContent();
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
    
    {modalContent && (
      <StoryModal
        isOpen={VisionState.showModal}
          content={modalContent}
          onNext={handleStoryNext}
          onBack={handleStoryBack}
          onClose={() => setVisionState(prev => ({ ...prev, showModal: false }))}
          position={modalContent.position}
      />
    )}
    <Nav>
      <div 
      style={{ position: 'absolute', top: 35, left: 600, zIndex: 1 }}>
        <Dropdown 
          value ={VisionState.currentStory}
          onChange={handleDropdownChange} 
        />
      </div>
    </Nav>
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}