'use client';
import { useState } from 'react';
import MapCanvas from "./MapCanvas"
import FadeIn from '../Animations/FadeIn'
import { useSiteSettings } from '../../lib/useSiteSettings'

export default function InitMap() {
  const [showMap, setShowMap] = useState(false);
  const settings = useSiteSettings();

    if (!showMap) {
      return(
      <div className="w-full h-full flex flex-col justify-center items-center bg-gray-950 text-white py-20 shadow-lg">

        <nav className="fixed border-3 border-gray-950 top-0 left-0 z-50 w-full bg-white-100 backdrop-blur shadow-md">
          <div className = "flex items-center justify-between px-12 py-3">
            <div className="flex items-center space-x-6">
                <img src={'./media/pictures/logo.png'} width="75" height="75" alt={settings.organizationName}/>

            <h1 className="text-5xl font-fell text-white">{settings.organizationName}</h1>
            </div>
          </div>
        </nav>
        <div className = "mt-12">
        <FadeIn duration = {1500}>
            <h1 className="text-7xl font-fell  mb-4">{settings.landingTitle}</h1>
            <p className="text-5xl font-lato font-thin mb-12 text-center">{settings.landingSubtitle}</p>
        </FadeIn>
        <div className = "text-center">
        <FadeIn delay = {500}>
            <button
              onClick={() => setShowMap(true)}
              className="bg-amber-300 text-black font-lato py-3 px-5 text-3xl shadow-md hover:bg-amber-400 transition-transform hover:scale-105"
              style={{cursor:'pointer'}}
            >
              {settings.landingCtaText}
            </button>
        </FadeIn>
        </div>
        </div>

      </div>
      );
    }
    
  // Else render map if showMap is true
  return (
    <div className="w-full h-full">
      <MapCanvas accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} />
    </div>
  );
}