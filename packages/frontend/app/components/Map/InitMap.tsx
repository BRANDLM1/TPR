'use client';
import { useState } from 'react';
import MapCanvas from './MapCanvas';
import FadeIn from '../Animations/FadeIn';
import Nav from '../Global/Nav';
import { useSiteSettings } from '../../lib/useSiteSettings';

export default function InitMap() {
  const [showMap, setShowMap] = useState(false);
  const settings = useSiteSettings();

  if (showMap) {
    return (
      <div className="w-full h-full">
        <MapCanvas />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center bg-gray-950 text-white py-20 shadow-lg">
      <Nav />
      <div className="mt-12">
        <FadeIn duration={1500}>
          <h1 className="text-7xl font-fell mb-4">{settings.landingTitle}</h1>
          <p className="text-5xl font-lato font-thin mb-12 text-center">
            {settings.landingSubtitle}
          </p>
        </FadeIn>
        <div className="text-center">
          <FadeIn delay={500}>
            <button
              onClick={() => setShowMap(true)}
              className="bg-amber-300 text-black font-lato py-3 px-5 text-3xl shadow-md hover:bg-amber-400 transition-transform hover:scale-105"
              style={{ cursor: 'pointer' }}
            >
              {settings.landingCtaText}
            </button>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
