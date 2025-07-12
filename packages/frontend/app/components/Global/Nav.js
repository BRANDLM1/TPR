'use client';
import React from 'react';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const Dropdown = dynamic(() => import('./Dropdown'), { ssr: false });

export default function Nav() {
  const [shopwMap, setShowMap] = useState(false);


    if (!shopwMap) {
      return(        
        <nav className="fixed border-3 border-black top-0 left-0 z-50 w-full bg-white-100 backdrop-blur shadow-md">
          <div className = "flex items-center justify-between px-12 py-2">
            <div className="flex items-center space-x-6">
                <img src={'./media/pictures/logo.png'} width="135" height="135"/>
            
            <h1 className="text-7xl font-fell ml-8 text-black">The Tipi Raisers</h1>
            <div className= 'py-6 px-10 text-4xl'>
            <Dropdown/>
            </div>
            </div>
            
            <div className="flex space-x-4">
            <a
              href="https://www.thetipiraisers.org/donate.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-300 text-black font-bold py-6 px-10 rounded-xl text-4xl float-end shadow-md hover:bg-amber-200"
              style={{ cursor: 'pointer' }}
            >
              Donate Today!
            </a>
            <a
              href="https://www.thetipiraisers.org/contact-us.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-300 text-black font-bold py-6 px-10 rounded-xl text-4xl float-end shadow-md hover:bg-amber-200"
              style={{ cursor: 'pointer' }}
            >
              Contact Us
            </a>
            </div>
          </div>
        </nav>
        
      );
    }
    
  // Else render map if showMap is true
  return (
    <div className="w-full h-full">
      <MapCanvas accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} />
    </div>
  );
}