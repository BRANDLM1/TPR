'use client'
import {useRef, useEffect, useState, useCallback} from 'react';
import mapboxgl from 'mapbox-gl';
import layerGroups from './LayerGroup';
import StoryModal from './StoryModal';
import { useQuery } from '@apollo/client';
import { GET_STORY_BY_ID } from '../../lib/queries';
import Nav from '../Global/Nav';
import dynamic from 'next/dynamic'
const Dropdown = dynamic(() => import('../Global/Dropdown'), {ssr: false});

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface VisionState {
  currentStory: string | null;
  currentStep: number;
  showModal: boolean;
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

      map.addSource('dynamic-points-source',{
        type:'geojson',
        data: {type :'FeatureCollection', features: []},
      });
      map.addLayer({
        id: 'dynamic-points-layer',
        source: 'dynamic-points-source',
        type: 'circle',
        paint: { 'circle-color' : '#ff0000', 'circle-radius': 8 }
      });

      map.on('click', 'dynamic-points-layer', (e) => {
       
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
    map.on('mouseenter', 'dynamic-points-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'dynamic-points-layer', () => {
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
  const applyLayerChanges = (stepConfig: { layersToShow: string[]; layersToHide: string[] }) => {
      
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
      media: undefined,
      canGoBack: false,
      isLastStep: false,
      };
    if (error) 
      return {
      title: 'Error', 
      content: 'Could not load story.', 
      media: undefined,
      canGoBack: false,
      isLastStep: false,
      };
  
    if (!storyData || !storyData.story || !VisionState.showModal) return null;

    const currentStepConfig = storyData.story.steps[VisionState.currentStep];
    if (!currentStepConfig) return null;

    return {
      title: currentStepConfig.title,
      content: currentStepConfig.content,
      media: {
        type: currentStepConfig.mediaType,
        src: currentStepConfig.mediaSrc,
      },
      nextButtonText: currentStepConfig.nextButtonText || 'Continue',
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
          onClose={() => setVisionState(prev => ({ ...prev, showModal: false }))}/>
    )}
    <Nav>
      <div 
      style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
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