import { useState, useEffect } from 'react';

interface BookSize {
  pageW: number;
  pageH: number;
}

const BASE_W = 300;
const BASE_H = 400;
// Horizontal padding on each side of the two-page spread
const H_PAD = 24;
// Vertical space consumed by header, tabs, hint, footer (approximate)
const V_CHROME = 200;
// Extra breathing room so the book doesn't touch the very edge
const V_PAD = 24;

function compute(): BookSize {
  if (typeof window === 'undefined') return { pageW: BASE_W, pageH: BASE_H };

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Width constraint: two pages side-by-side fit in the viewport
  const maxWFromWidth = Math.floor((vw - H_PAD * 2) / 2);

  // Height constraint: page must fit in viewport minus chrome
  const maxHFromHeight = Math.floor(vh - V_CHROME - V_PAD);

  // Width that satisfies the height constraint (maintain aspect ratio)
  const maxWFromHeight = Math.floor(maxHFromHeight * (BASE_W / BASE_H));

  // Take the most restrictive constraint, capped at BASE_W
  const pageW = Math.max(Math.min(maxWFromWidth, maxWFromHeight, BASE_W), 100);
  const pageH = Math.max(Math.round((pageW / BASE_W) * BASE_H), 133);

  return { pageW, pageH };
}

export function useBookSize(): BookSize {
  const [size, setSize] = useState<BookSize>(compute);

  useEffect(() => {
    const onResize = () => setSize(compute());
    window.addEventListener('resize', onResize);
    // Also recompute on orientation change (phone rotation)
    window.addEventListener('orientationchange', () => {
      // Small delay to let the browser finish the rotation
      setTimeout(() => setSize(compute()), 100);
    });
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return size;
}
