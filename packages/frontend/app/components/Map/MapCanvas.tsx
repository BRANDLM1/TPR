'use client'
import {useRef, useEffect, useState, useCallback} from 'react';
import mapboxgl from 'mapbox-gl';
import layerGroups, { availableLayerIds } from './layerGroup';
import StoryModal from './StoryModal';
import { useQuery } from '@apollo/client';
import { GET_STORY_BY_ID, GET_ICONS } from '../../lib/queries';
import Nav from '../Global/Nav';
import dynamic from 'next/dynamic'
const Dropdown = dynamic(() => import('../Global/Dropdown'), {ssr: false});

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface VisionState {
  currentStory: string | null;
  currentStep: number;
  showModal: boolean;
  // Bumped every time the user picks a story from the dropdown so the
  // step-apply effect re-fires even when the new currentStep matches the
  // old one (e.g. they re-select the current story while on step 0).
  sessionId: number;
}

// Shape of the GeoJSON Feature objects the backend resolver emits for
// dynamic points / polygons. Properties are open since Studio fields may grow.
type GeoJsonFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>;

interface StepConfig {
  layersToShow: string[];
  layersToHide: string[];
  dynamicPoints?: GeoJsonFeature[];
  dynamicPolygons?: GeoJsonFeature[];
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
    showModal: false,
    sessionId: 0,
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const { loading, error, data: storyData, refetch } = useQuery(GET_STORY_BY_ID, {
    variables: { id: VisionState.currentStory }, // Pass the selected story ID
    skip: !VisionState.currentStory, // IMPORTANT: Don't run the query until a story is selected
  });
  const { data: iconsData } = useQuery<{ icons: Array<{ name: string; url: string }> }>(
    GET_ICONS
  );

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

    //Removing initialized state territory layers of streetmap
    map.on('load', () => {
      const layersToHide = [
          'admin-1-boundary',     // US State lines
          'admin-1-boundary-bg'   // Background of state lines
      ]
      layersToHide.forEach(id => {
          if (map.getLayer(id)){
              map.removeLayer(id);
          }
      })

      map.addSource('dynamic-polygons-source',{
        type:'geojson',
        data: {
          type :'FeatureCollection',
          features: []
        },
      });
      map.addLayer({
        id: 'dynamic-polygons-fill-layer',
        source: 'dynamic-polygons-source',
        type: 'fill',
        paint: {
          'fill-color': ['coalesce', ['get', 'fillColor'], '#088'],
          'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.5],
        },
      });
      map.addLayer({
        id: 'dynamic-polygons-line-layer',
        source: 'dynamic-polygons-source',
        type: 'line',
        paint: {
          'line-color': ['coalesce', ['get', 'lineColor'], '#000000'],
          'line-width': ['coalesce', ['get', 'lineWidth'], 1],
        },
      });

      map.addSource('dynamic-points-source',{
        type:'geojson',
        data: {
          type :'FeatureCollection',
          features: []
        },
      });

      // Fallback circle: only for points without a loaded icon.
      map.addLayer({
        id: 'dynamic-points-circle-layer',
        source: 'dynamic-points-source',
        type: 'circle',
        filter: ['!', ['has', 'markerImage']],
        paint: {
          'circle-color': ['coalesce', ['get', 'color'], '#ff0000'],
          'circle-radius': 8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        }
      });

      // Symbol layer: used whenever markerImage is set on the feature.
      map.addLayer({
        id: 'dynamic-points-symbol-layer',
        source: 'dynamic-points-source',
        type: 'symbol',
        filter: ['has', 'markerImage'],
        layout: {
          'icon-image': ['get', 'markerImage'],
          'icon-size': 0.6,
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
        },
      });

      const interactivePointLayers = ['dynamic-points-circle-layer', 'dynamic-points-symbol-layer'];

      const openPointPopup = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        if (!feature.properties || feature.geometry.type !== 'Point') return;

        const coordinates = (feature.geometry.coordinates as number[]).slice() as [number, number];
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Build the popup body with textContent + anchor element so DB values are never injected as HTML.
        const container = document.createElement('div');
        const heading = document.createElement('h3');
        heading.textContent = feature.properties.name || 'Details';
        heading.style.margin = '0 0 4px';
        container.appendChild(heading);

        if (feature.properties.description) {
          const desc = document.createElement('p');
          desc.textContent = feature.properties.description;
          desc.style.margin = '0 0 4px';
          container.appendChild(desc);
        }

        if (feature.properties.link) {
          const anchor = document.createElement('a');
          anchor.href = feature.properties.link;
          anchor.textContent = 'Learn more';
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          container.appendChild(anchor);
        }

        new mapboxgl.Popup().setLngLat(coordinates).setDOMContent(container).addTo(map);
      };

      interactivePointLayers.forEach(layerId => {
        map.on('click', layerId, openPointPopup);
        map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
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

      setMapLoaded(true);
    });
    return () => map.remove();
  },[]);


  // Next/Back only update state — an effect below applies the target step's layers.
  const handleStoryNext = useCallback(() => {
    if (!storyData?.story) return;
    const steps = storyData.story.steps;
    setVisionState(prev => {
      const next = prev.currentStep + 1;
      if (next >= steps.length) return { ...prev, showModal: false };
      return { ...prev, currentStep: next, showModal: true };
    });
  }, [storyData]);

  const handleStoryBack = useCallback(() => {
    setVisionState(prev =>
      prev.currentStep === 0
        ? prev
        : { ...prev, currentStep: prev.currentStep - 1, showModal: true }
    );
  }, []);

  // Apply layer visibility changes
  const applyLayerChanges = useCallback((stepConfig: StepConfig) => {

    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // In dev, warn on layer ids that don't resolve — silent skips make
    // Studio typos invisible. Prod stays quiet so end-users see no noise.
    const warnUnknown = (layerId: string, field: 'layersToShow' | 'layersToHide') => {
      if (process.env.NODE_ENV !== 'production' && !availableLayerIds.includes(layerId)) {
        console.warn(
          `[MapCanvas] StoryStep.${field} references unknown layer id "${layerId}". ` +
          `Valid ids: ${availableLayerIds.join(', ')}`
        );
      }
    };

    stepConfig.layersToHide.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      } else {
        warnUnknown(layerId, 'layersToHide');
      }
    });

    stepConfig.layersToShow.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'visible');
      } else {
        warnUnknown(layerId, 'layersToShow');
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

    if (stepConfig.latitude != null && stepConfig.longitude != null) {
      map.flyTo({
        center: [stepConfig.longitude, stepConfig.latitude],
        zoom: stepConfig.zoom,
        pitch: stepConfig.pitch,
        bearing: stepConfig.bearing,
        essential: true, // Prioritize recentering
      });
    }
  }, []);

  // Hide every static layer added from layerGroups and clear dynamic sources.
  const resetMapState = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    addedLayers.current.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });

    const empty = { type: 'FeatureCollection' as const, features: [] };
    (map.getSource('dynamic-points-source') as mapboxgl.GeoJSONSource | undefined)?.setData(empty);
    (map.getSource('dynamic-polygons-source') as mapboxgl.GeoJSONSource | undefined)?.setData(empty);
  }, []);

  // Apply the current step whenever data/step/map-readiness changes.
  // This covers "story selected" (step 0), "Next/Back" transitions, and
  // re-selecting the active story (sessionId bump forces a re-fire even
  // when currentStep is unchanged).
  useEffect(() => {
    if (!mapLoaded || !storyData?.story) return;
    const step = storyData.story.steps[VisionState.currentStep];
    if (step) applyLayerChanges(step);
  }, [mapLoaded, storyData, VisionState.currentStep, VisionState.sessionId, applyLayerChanges]);

  // Preload the DB-driven icon registry into the map as addImage entries so
  // `icon-image: ['get', 'markerImage']` resolves. Runs when both are ready.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map || !iconsData?.icons) return;

    iconsData.icons.forEach(({ name, url }) => {
      if (map.hasImage(name)) return;
      map.loadImage(url, (err, image) => {
        if (err || !image) {
          console.warn(`Failed to load icon "${name}" from ${url}`, err);
          return;
        }
        if (!map.hasImage(name)) map.addImage(name, image);
      });
    });
  }, [mapLoaded, iconsData]);

  const handleDropdownChange = useCallback((storyId: string) => {
    resetMapState();
    setVisionState(prev => ({
      currentStory: storyId,
      currentStep: 0,
      showModal: true,
      sessionId: prev.sessionId + 1,
    }));
  }, [resetMapState]);

  // Get current modal content + position (position lives on the Modal itself, not content)
  const getCurrentModalState = () => {
    if (loading)
      return {
        content: { title: 'Loading...', content: '', canGoBack: false, isLastStep: false },
        position: 'CENTER' as const,
        isErrorState: false,
      };
    if (error)
      return {
        content: {
          title: "We couldn't load this story",
          content:
            'There was a problem reaching the server. Please check your connection and try again.',
          nextButtonText: 'Retry',
          canGoBack: false,
          isLastStep: false,
        },
        position: 'CENTER' as const,
        isErrorState: true,
      };

    if (!storyData || !storyData.story || !VisionState.showModal) return null;

    const currentStepConfig = storyData.story.steps[VisionState.currentStep];
    if (!currentStepConfig) return null;

    return {
      content: {
        title: currentStepConfig.title,
        content: currentStepConfig.content,
        mediaItems: currentStepConfig.mediaItems ?? [],
        nextButtonText: currentStepConfig.nextButtonText || 'Continue',
        canGoBack: VisionState.currentStep > 0,
        isLastStep: VisionState.currentStep === storyData.story.steps.length - 1,
      },
      position: (currentStepConfig.modalPosition || 'CENTER') as
        | 'CENTER'
        | 'TOP_LEFT'
        | 'TOP_RIGHT'
        | 'BOTTOM_LEFT'
        | 'BOTTOM_RIGHT',
      isErrorState: false,
    };
  };

  const modalState = getCurrentModalState();

  return (
    <div style={{ width: '100%', height: '100%' }}>
    {modalState && (
      <StoryModal
        isOpen={VisionState.showModal}
          content={modalState.content}
          position={modalState.position}
          onNext={modalState.isErrorState ? () => refetch() : handleStoryNext}
          onBack={handleStoryBack}
          onClose={() => setVisionState(prev => ({ ...prev, showModal: false }))}/>
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
