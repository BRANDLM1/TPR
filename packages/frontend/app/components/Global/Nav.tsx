'use client';
import React from 'react';
import { useState } from 'react';

export default function Nav({ children }: { children?: React.ReactNode }) {
  const [shopwMap] = useState(false);


    if (!shopwMap) {
      return(        
        <nav className="fixed border-3 border-black top-0 left-0 z-50 w-full bg-white-100 backdrop-blur shadow-md">
          <div className = "flex items-center justify-between px-12 py-3">
            <div className="flex items-center space-x-6">
                <img src={'./media/pictures/logo.png'} width="75" height="75"/>
            
            <h1 className="text-5xl font-fell text-black">The Tipi Raisers</h1>
            {/* <div className= ' top-30 left-60 text-xl'> */}
            {children}
            {/* </div> */}
            </div>
            
            <div className="flex space-x-4">
            <a
              href="https://www.thetipiraisers.org/donate.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-300 text-black font-bold py-3 px-5 rounded-xl text-2xl float-end shadow-md hover:bg-amber-200"
              style={{ cursor: 'pointer' }}
            >
              Donate Today!
            </a>
            <a
              href="https://www.thetipiraisers.org/contact-us.html"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-300 text-black font-bold py-3 px-5 rounded-xl text-2xl float-end shadow-md hover:bg-amber-200"
              style={{ cursor: 'pointer' }}
            >
              Contact Us
            </a>
            </div>
          </div>
        </nav>
        
      );
    }
}