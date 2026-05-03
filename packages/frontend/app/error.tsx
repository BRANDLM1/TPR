'use client';

import { useEffect } from 'react';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center bg-gray-950 text-white p-8">
      <h1 className="text-5xl font-fell mb-4">Something went wrong</h1>
      <p className="text-xl font-lato mb-8 text-center max-w-2xl">
        The map couldn&apos;t load. This is usually a temporary connection issue.
      </p>
      <button
        onClick={reset}
        className="bg-amber-300 text-black font-lato py-3 px-5 text-2xl shadow-md hover:bg-amber-400 transition-transform hover:scale-105"
        style={{ cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}
