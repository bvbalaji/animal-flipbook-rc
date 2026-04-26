import { useState, useEffect } from 'react';

interface BookSize {
  pageW: number;
  pageH: number;
}

const BASE_W = 300;
const BASE_H = 400;
const SIDE_PAD = 24;

function compute(): BookSize {
  if (typeof window === 'undefined') return { pageW: BASE_W, pageH: BASE_H };
  const vw = window.innerWidth;
  const available = (vw - SIDE_PAD * 2) / 2;
  const pageW = Math.round(Math.min(available, BASE_W));
  const pageH = Math.round((pageW / BASE_W) * BASE_H);
  return { pageW: Math.max(pageW, 120), pageH: Math.max(pageH, 160) };
}

export function useBookSize(): BookSize {
  const [size, setSize] = useState<BookSize>(compute);

  useEffect(() => {
    const onResize = () => setSize(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}
