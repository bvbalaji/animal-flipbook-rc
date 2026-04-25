import { useState, useEffect } from 'react';

interface BookSize {
  pageW: number;
  pageH: number;
  isMobile: boolean;
}

// The book shows TWO pages side-by-side, so total width = pageW * 2.
// We want to fit within the viewport with some padding on each side.
const BASE_W = 300;
const BASE_H = 400;
const PADDING = 24; // px each side

export function useBookSize(): BookSize {
  const getSize = (): BookSize => {
    if (typeof window === 'undefined') {
      return { pageW: BASE_W, pageH: BASE_H, isMobile: false };
    }

    const vw = window.innerWidth;
    const totalAvailable = vw - PADDING * 2;

    // Two pages side-by-side: each page = totalAvailable / 2
    // But cap at BASE_W so we don't blow up on huge screens
    const rawPageW = Math.min(Math.floor(totalAvailable / 2), BASE_W);

    // Scale height proportionally
    const scale   = rawPageW / BASE_W;
    const rawPageH = Math.floor(BASE_H * scale);

    // Snap to minimum readable size
    const pageW = Math.max(rawPageW, 120);
    const pageH = Math.max(rawPageH, 160);

    return {
      pageW,
      pageH,
      isMobile: vw < 700,
    };
  };

  const [size, setSize] = useState<BookSize>(getSize);

  useEffect(() => {
    const onResize = () => setSize(getSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}
