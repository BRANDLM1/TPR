'use client';
import { useState } from 'react';
import MapCanvas from "./MapCanvas"
import FadeIn from '../Animations/FadeIn'

export default function InitMap() {
  const [shopwMap, setShowMap] = useState(false);

    if (!shopwMap) {
      return(
      <div className="w-full h-full flex flex-col justify-center items-center bg-gray-950 text-white py-20 shadow-lg">
        
        <FadeIn duration = {1500}>
            <h1 className="text-8xl font-fell mb-4">Vision 2035</h1>
            <p className="text-7xl font-lato mb-12 text-center">The Tipi Raisers invites you to join us in thinking big...</p>
        </FadeIn>

        <FadeIn delay = {500}>
            <button
              onClick={() => setShowMap(true)}
              className="bg-amber-300 text-black font-bold py-6 px-10 text-2xl shadow-md hover:bg-amber-400 transition-transform hover:scale-105"
              style={{cursor:'pointer'}}
            >
              Explore Our Campaign
            </button>
        </FadeIn>

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