import { useState, useEffect } from 'react';

interface BookSize {
  pageW: number;
  pageH: number;
}

const BASE_W = 300;
const BASE_H = 720;
const ASPECT = BASE_H / BASE_W; // 4/3

function compute(): BookSize {
  if (typeof window === 'undefined') return { pageW: BASE_W, pageH: BASE_H };

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // ── Width constraint ───────────────────────────────────────────────────────
  // Two pages side-by-side. Reserve 32px total horizontal padding.
  const maxWByWidth = Math.floor((vw - 32) / 2);

  // App chrome: header (~55px) + tabs (~44px) + hint (~24px) + footer (~28px) + gaps (~30px) = ~181px
  const CHROME_H = 181;
  const maxHByHeight = vh - CHROME_H;

  // Convert max height to the equivalent max width (keep aspect ratio)
  const maxWByHeight = Math.floor(maxHByHeight / ASPECT);

  // Most restrictive wins, capped at BASE_W
  const pageW = Math.max(Math.min(maxWByWidth, maxWByHeight, BASE_W), 80);
  const pageH = Math.round(pageW * ASPECT);

  return { pageW, pageH };
}

export function useBookSize(): BookSize {
  const [size, setSize] = useState<BookSize>(compute);

  useEffect(() => {
    const update = () => setSize(compute());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', () => setTimeout(update, 150));
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}
