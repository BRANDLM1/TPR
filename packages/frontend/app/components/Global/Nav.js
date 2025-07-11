'use client';
import { useState } from 'react';


export default function Nav() {
  const [shopwMap, setShowMap] = useState(false);

    if (!shopwMap) {
      return(        
        <nav className="fixed border-3 border-black top-0 left-0 z-50 w-full bg-amber-100 backdrop-blur shadow-md">
            <div className="flex items-center ml-12 space-x-6">
                <img src={'./media/pictures/logo.png'} width="135" height="135"/>
            
            <h1 className="text-7xl font-fell ml-8 text-black">The Tipi Raisers</h1>
            
            
            <a to={{ pathname: "https://www.thetipiraisers.org/contact-us.html" }} target="_blank"
              className="bg-white opacity-70 text-black font-bold py-15 px-20 rounded-xl text-2xl shadow-md hover:bg-amber-400 transition-transform hover:scale-102"
              style={{cursor:'pointer'}}
            >
              Donate
            </a>
            <button
             onClick={() => 
<a            target='_blank'
              rel='noopener noreferrer' href="https://www.thetipiraisers.org/contact-us.html">Policies</a>             }
              className="bg-white opacity-70 text-black font-bold py-15 px-20 rounded-xl text-2xl shadow-md hover:bg-amber-400 transition-transform hover:scale-102"
              style={{cursor:'pointer'}}
            >
              
            </button>

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