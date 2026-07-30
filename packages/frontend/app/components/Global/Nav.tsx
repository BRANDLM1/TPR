'use client';
import React from 'react';
import { useSiteSettings } from '../../lib/useSiteSettings';

export default function Nav({ children }: { children?: React.ReactNode }) {
  const settings = useSiteSettings();

  return (
    <nav className="fixed border-3 border-black top-0 left-0 z-50 w-full bg-white-100 backdrop-blur shadow-md">
      {/* min-w-0 + truncate let the org name give up space first, so the
          story dropdown and the Donate/Contact buttons never collide on
          narrower windows. gap-8 keeps them from touching. */}
      <div className="flex items-center justify-between gap-8 px-12 py-3">
        <div className="flex items-center space-x-6 min-w-0">
          <img
            src="/media/pictures/logo.png"
            width="75"
            height="75"
            alt={settings.organizationName}
            className="shrink-0"
          />
          <h1 className="text-5xl font-fell text-black truncate">{settings.organizationName}</h1>
          {children}
        </div>

        <div className="flex space-x-4 shrink-0">
          <a
            href={settings.donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-300 text-black font-bold py-3 px-5 rounded-xl text-2xl float-end shadow-md hover:bg-amber-200"
            style={{ cursor: 'pointer' }}
          >
            {settings.donateLabel}
          </a>
          <a
            href={settings.contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-300 text-black font-bold py-3 px-5 rounded-xl text-2xl float-end shadow-md hover:bg-amber-200"
            style={{ cursor: 'pointer' }}
          >
            {settings.contactLabel}
          </a>
        </div>
      </div>
    </nav>
  );
}
