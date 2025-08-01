'use client'
import {useRef, useEffect, useState, useCallback} from 'react';
import mapboxgl from 'mapbox-gl';
import layerGroups from './LayerGroup';
import StoryConfig, { Step } from './StoryGroup';
import { StoryContent } from './StoryContent'
import StoryModal from './StoryModal';
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


  // Handle modal "Next" button
  const handleStoryNext = useCallback(() => {
    if (!VisionState.currentStory) return;
    
    const story = StoryConfig[VisionState.currentStory];
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
  }, [VisionState]);

  // Handle going back
  const handleStoryBack = useCallback(() => {
    if (!VisionState.currentStory || VisionState.currentStep === 0) return;
    
    const prevStepIndex = VisionState.currentStep - 1;
    const story = StoryConfig[VisionState.currentStory];
    const prevStepConfig = story.steps[prevStepIndex];
    
    // Revert to previous step's layers
    applyLayerChanges(prevStepConfig);
    
    setVisionState(prev => ({
      ...prev,
      currentStep: prevStepIndex,
      showModal: true
    }));
  }, [VisionState]);

  // Apply layer visibility changes
  const applyLayerChanges = (stepConfig: Step) => {
      
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
    const storyKey = VisionState.currentStory;

    if (!storyKey || !VisionState.showModal) return null;
    
    const story = StoryConfig[storyKey];

    if (!story) { console.warn(`No story found for key: ${storyKey}`); }
    if (!story || !story.steps || !story.steps[VisionState.currentStep]) return null;

    const currentStepConfig = story.steps[VisionState.currentStep];    
    const contentData = StoryContent[currentStepConfig.modalContent];

    return {
      ...contentData,
      nextButtonText: currentStepConfig.nextButtonText,
      canGoBack: VisionState.currentStep > 0,
      isLastStep: VisionState.currentStep === story.steps.length - 1
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