'use client';

// Floating impact-stats widget for the active initiative.
//
// Renders a small round button (the initiative's icon from the Icon
// registry via Story.impactIcon, falling back to a chart glyph) that
// toggles a compact card of rotating statistics — ImpactStat rows for the
// story, cycling automatically every few seconds with manual prev/next
// controls. Deliberately small and bottom-center so it never fights the
// story modal (corners), the legend (bottom-left/right), or the nav (top).
// Renders nothing when the story has no stats.

import { useEffect, useState } from 'react';
import FadeIn from '../Animations/FadeIn';
import type { MediaItem } from './StoryModal';
import { safeUrl } from '../../lib/safeUrl';

export interface ImpactStatItem {
  id: string;
  order: number;
  title: string;
  statistic: number;
  content?: string | null;
  link?: string | null;
  mediaItems?: MediaItem[] | null;
}

const ROTATE_MS = 6000;

export default function ImpactPanel({
  stats,
  iconUrl,
  initiative,
  panelSide = 'center',
}: {
  stats: ImpactStatItem[];
  iconUrl?: string | null;
  initiative: string;
  // Where the opened card sits. Default bottom-center; MapCanvas shifts it
  // toward the free side while a bottom-corner story modal is showing so
  // the two never stack (a BOTTOM_LEFT modal overlapped a centered card by
  // ~68px at 1024px wide, and the modal's higher z-index hid the card).
  panelSide?: 'center' | 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [iconBroken, setIconBroken] = useState(false);

  // New initiative selected → close the card and start from the first stat.
  useEffect(() => {
    setOpen(false);
    setIdx(0);
    setIconBroken(false);
  }, [initiative]);

  // Auto-rotate while open (and not hovered). Manual nav keeps working.
  useEffect(() => {
    if (!open || paused || stats.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % stats.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [open, paused, stats.length]);

  if (!stats || stats.length === 0) return null;

  const stat = stats[Math.min(idx, stats.length - 1)];
  const image = stat.mediaItems?.find((m) => m.type === 'IMAGE');
  // Authored in Studio, so screen out javascript:/data: before it hits href.
  const statLink = safeUrl(stat.link);

  return (
    <div className="pointer-events-auto">
      {open && (
        <div
          role="region"
          aria-label={`Impact statistics for ${initiative}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className={`fixed bottom-24 z-10 w-80 max-w-[90vw] bg-white/95 backdrop-blur rounded-xl shadow-lg px-5 py-4 ${
            panelSide === 'right'
              ? 'right-6'
              : panelSide === 'left'
                ? 'left-6'
                : 'left-1/2 -translate-x-1/2'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-lato font-bold tracking-widest text-gray-500 uppercase">
              Impact
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close impact statistics"
              className="text-gray-400 hover:text-black text-lg leading-none px-1"
            >
              ×
            </button>
          </div>

          {/* key remounts FadeIn per stat so each rotation fades in */}
          <FadeIn key={stat.id} duration={400} delay={0}>
            {image && (
              <img
                src={image.source}
                alt={image.alt ?? stat.title}
                className="w-full h-24 object-cover rounded-md mb-2"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="text-3xl font-bold text-amber-600 font-lato">
              {stat.statistic.toLocaleString()}
            </div>
            <div className="font-fell text-lg text-black">{stat.title}</div>
            {stat.content && (
              <p className="text-sm font-lato text-gray-700 mt-1">{stat.content}</p>
            )}
            {statLink && (
              <a
                href={statLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-lato underline text-amber-700 hover:text-amber-900 mt-1 inline-block"
              >
                Learn more
              </a>
            )}
          </FadeIn>

          {stats.length > 1 && (
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setIdx((i) => (i - 1 + stats.length) % stats.length)}
                aria-label="Previous statistic"
                className="text-gray-500 hover:text-black px-2 text-lg"
              >
                ‹
              </button>
              <div className="flex gap-1.5" aria-hidden>
                {stats.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setIdx(i)}
                    className={`w-2 h-2 rounded-full ${
                      i === idx ? 'bg-amber-500' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setIdx((i) => (i + 1) % stats.length)}
                aria-label="Next statistic"
                className="text-gray-500 hover:text-black px-2 text-lg"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle impact statistics"
        aria-expanded={open}
        title={`Impact — ${initiative}`}
        className="w-12 h-12 rounded-full bg-amber-300 hover:bg-amber-400 shadow-md flex items-center justify-center transition-transform hover:scale-105"
      >
        {iconUrl && !iconBroken ? (
          <img
            src={iconUrl}
            alt=""
            className="w-7 h-7 object-contain"
            onError={() => setIconBroken(true)}
          />
        ) : (
          <span className="text-xl" aria-hidden>
            📊
          </span>
        )}
      </button>
    </div>
  );
}
