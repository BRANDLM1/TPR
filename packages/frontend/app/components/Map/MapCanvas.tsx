'use client'
import {useRef, useEffect, useState, useCallback} from 'react';
import mapboxgl from 'mapbox-gl';
import layerGroups, { availableLayerIds } from './layerGroup';
import StoryModal from './StoryModal';
import MapLegend from './MapLegend';
import ImpactPanel from './ImpactPanel';
import type { ImpactStatItem } from './ImpactPanel';
import { useQuery } from '@apollo/client';
import { GET_STORY_BY_ID, GET_ICONS } from '../../lib/queries';
import { safeUrl } from '../../lib/safeUrl';
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

// Camera "home" — used both to initialize the map and to snap back on
// resetMapState so a re-selected story always starts from a clean view
// even if its step 0 leaves latitude/longitude null in Studio.
const HOME_VIEW = {
  center: [-105.8, 39.5] as [number, number],
  zoom: 6,
  pitch: 0,
  bearing: 0,
};

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
      center: HOME_VIEW.center,
      zoom: HOME_VIEW.zoom,
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
        // Narrowed copy — TS can't carry the null-check above into the
        // media forEach closure below.
        const props = feature.properties;

        const coordinates = (feature.geometry.coordinates as number[]).slice() as [number, number];
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Build the popup body with textContent + element creation so DB
        // values are never injected as HTML. Media sources only ever land in
        // src attributes, which browsers treat as URLs, not markup.
        const container = document.createElement('div');
        container.style.maxWidth = '300px';
        container.style.maxHeight = '320px';
        container.style.overflowY = 'auto';

        const heading = document.createElement('h3');
        heading.textContent = props.name || 'Details';
        heading.style.margin = '0 0 4px';
        container.appendChild(heading);

        // Media attached to the point (images/videos). Mapbox GL serializes
        // nested feature properties to JSON strings when features come back
        // from an event, so mediaItems arrives as a string here and has to
        // be parsed back into an array.
        type PopupMedia = {
          order?: number;
          type?: string;
          source?: string;
          alt?: string | null;
          caption?: string | null;
        };
        let popupMedia: PopupMedia[] = [];
        const rawMedia: unknown = props.mediaItems;
        if (Array.isArray(rawMedia)) {
          popupMedia = rawMedia as PopupMedia[];
        } else if (typeof rawMedia === 'string') {
          try {
            const parsed = JSON.parse(rawMedia);
            if (Array.isArray(parsed)) popupMedia = parsed;
          } catch {
            /* malformed JSON in properties — skip media, keep the text popup */
          }
        }
        popupMedia
          .filter((m) => m && typeof m.source === 'string' && m.source)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .forEach((m) => {
            const fig = document.createElement('figure');
            fig.style.margin = '6px 0';
            if ((m.type || '').toUpperCase() === 'VIDEO') {
              const video = document.createElement('video');
              video.src = m.source!;
              video.controls = true;
              video.preload = 'metadata';
              video.style.width = '100%';
              video.style.borderRadius = '6px';
              video.onerror = () => { fig.style.display = 'none'; };
              fig.appendChild(video);
            } else {
              const img = document.createElement('img');
              img.src = m.source!;
              img.alt = m.alt || props.name || '';
              img.style.width = '100%';
              img.style.borderRadius = '6px';
              img.onerror = () => { fig.style.display = 'none'; };
              fig.appendChild(img);
            }
            if (m.caption) {
              const cap = document.createElement('figcaption');
              cap.textContent = m.caption;
              cap.style.fontSize = '12px';
              cap.style.color = '#555';
              cap.style.marginTop = '2px';
              fig.appendChild(cap);
            }
            container.appendChild(fig);
          });

        if (props.description) {
          const desc = document.createElement('p');
          desc.textContent = props.description;
          desc.style.margin = '0 0 4px';
          container.appendChild(desc);
        }

        // safeUrl drops javascript:/data: hrefs — this anchor is built with
        // raw DOM calls, which do no scheme filtering of their own.
        const linkHref = safeUrl(props.link);
        if (linkHref) {
          const anchor = document.createElement('a');
          anchor.href = linkHref;
          anchor.textContent = 'Learn more';
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          container.appendChild(anchor);
        }

        new mapboxgl.Popup({ maxWidth: '340px' })
          .setLngLat(coordinates)
          .setDOMContent(container)
          .addTo(map);
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

    // Always fly somewhere on a step change — to the step's coords if set,
    // otherwise back to HOME_VIEW. This makes Back/Continue and dropdown
    // re-selects feel deliberate even when staff leave a step's lat/lng
    // null in Studio. Pitch/bearing fall back to 0 when not set so a step
    // without orientation undoes the previous step's orientation.
    const hasCoords = stepConfig.latitude != null && stepConfig.longitude != null;
    map.flyTo({
      center: hasCoords ? [stepConfig.longitude!, stepConfig.latitude!] : HOME_VIEW.center,
      zoom: hasCoords ? (stepConfig.zoom ?? HOME_VIEW.zoom) : HOME_VIEW.zoom,
      pitch: stepConfig.pitch ?? 0,
      bearing: stepConfig.bearing ?? 0,
      essential: true,
    });
  }, []);

  // Hide static layers from the previous story so step 0 of the new one
  // starts from a known visibility state. Dynamic point/polygon sources
  // are not emptied here — applyLayerChanges immediately replaces them
  // with the new step's data, and an empty interim was racing with that
  // setData call on Mapbox's side.
  const resetMapState = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    addedLayers.current.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    });
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
        // Pass through as-is. Defaulting to 'Continue' here would make it
        // always truthy and shadow StoryModal's own fallback, which shows
        // "Explore" on the final step to signal the story is handing the
        // map over.
        nextButtonText: currentStepConfig.nextButtonText ?? undefined,
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

  const legendPolygons = (
    storyData?.story?.steps[VisionState.currentStep]?.dynamicPolygons ?? []
  ).flatMap((f: GeoJsonFeature) => {
    const p = f.properties;
    if (!p?.name || !p?.fillColor || !p?.lineColor) return [];
    return [{
      id: (p.id as number | string) ?? String(p.name),
      name: p.name as string,
      fillColor: p.fillColor as string,
      fillOpacity: (p.fillOpacity as number) ?? 0.5,
      lineColor: p.lineColor as string,
    }];
  });

  // A BOTTOM_LEFT modal covers the legend's default corner entirely, so send
  // the legend to the opposite corner while such a step is showing.
  const legendAlign =
    VisionState.showModal && modalState?.position === 'BOTTOM_LEFT' ? 'right' : 'left';

  const steps = storyData?.story?.steps ?? [];
  const impactStats: ImpactStatItem[] = storyData?.story?.impactStats ?? [];
  // Resolve the initiative's impact icon against the already-fetched Icon
  // registry (same registry the map markers use). Null → chart-glyph fallback.
  const impactIconUrl = storyData?.story?.impactIcon
    ? iconsData?.icons.find((i) => i.name === storyData.story.impactIcon)?.url ?? null
    : null;
  // The story stays active while its modal is hidden (X / Esc minimizes, and
  // finishing the last step also hides it) — this pill is the way back in.
  const canResume = Boolean(
    storyData?.story && steps.length > 0 && !VisionState.showModal && !loading && !error
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
    <MapLegend polygons={legendPolygons} align={legendAlign} />

    {/* Bottom-center chrome, kept clear of the legend (bottom corners), the
        Mapbox attribution (bottom-right), and the corner modals. The wrapper
        ignores pointer events so the map stays pannable around the buttons.
        Centered with flex on a full-width bar, NOT translate-x: a transform
        here would become the containing block for the impact card's
        position:fixed, breaking its viewport-relative left/right anchoring. */}
    <div className="fixed bottom-6 inset-x-0 z-10 flex justify-center items-center gap-3 pointer-events-none">
      {impactStats.length > 0 && (
        <ImpactPanel
          stats={impactStats}
          iconUrl={impactIconUrl}
          initiative={storyData.story.title}
          panelSide={
            VisionState.showModal && modalState?.position === 'BOTTOM_LEFT'
              ? 'right'
              : VisionState.showModal && modalState?.position === 'BOTTOM_RIGHT'
                ? 'left'
                : 'center'
          }
        />
      )}
      {canResume && (
        <button
          onClick={() => setVisionState(prev => ({ ...prev, showModal: true }))}
          className="pointer-events-auto bg-amber-300 hover:bg-amber-400 text-black font-lato font-bold px-5 py-3 rounded-full shadow-md transition-transform hover:scale-105"
        >
          Resume story ({VisionState.currentStep + 1}/{steps.length})
        </button>
      )}
    </div>

    {modalState && (
      <StoryModal
        isOpen={VisionState.showModal}
          content={modalState.content}
          position={modalState.position}
          canMinimize={!modalState.isErrorState && !loading}
          onNext={modalState.isErrorState ? () => refetch() : handleStoryNext}
          onBack={handleStoryBack}
          onClose={() => setVisionState(prev => ({ ...prev, showModal: false }))}/>
    )}
    <Nav>
      {/* Flows inside the nav's left-hand flex row rather than being pinned
          at an absolute left offset. A fixed offset collided with the
          right-aligned Donate/Contact buttons on any window narrower than
          ~1190px (an unmaximized window or a smaller laptop). */}
      <div style={{ minWidth: 200, maxWidth: 260, flex: '0 1 auto', zIndex: 1 }}>
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
