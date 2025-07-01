'use client';
import { useState } from 'react';
import MapCanvas from "./MapCanvas"

export default function InitMap() {
  const [shopwMap, setShowMap] = useState(false);

    if (!shopwMap) {
      return(
      <div className="flex flex-col justify-center items-center bg-gray-800 text-white py-20 rounded-lg shadow-lg">
        <h1 className="text-5xl font-bold mb-4">Welcome to Vision 2035</h1>
        <p className="text-xl mb-8">Ready to explore the map?</p>
        <button
          onClick={() => setShowMap(true)}
          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-md hover:bg-blue-700 transition-transform hover:scale-105"
          style={{cursor:'pointer'}}
        >
          Start
        </button>
      </div>
      );
    }
    
  // Else render map if showMap is true
  return (
    <div className="w-full h-[600px]">
      <MapCanvas accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} />
    </div>
  );
}