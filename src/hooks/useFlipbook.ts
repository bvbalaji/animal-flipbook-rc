import { useState, useEffect, useCallback, useRef } from 'react';
import { Animal, FilterType } from '../types/animal';
import { ANIMALS } from '../data/animals';

const SWIPE_THRESHOLD = 50; // minimum px to count as a swipe

interface UseFlipbookReturn {
  filteredAnimals: Animal[];
  currentIndex: number;
  currentAnimal: Animal | null;
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  goNext: () => void;
  goPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  swipeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

export function useFlipbook(): UseFlipbookReturn {
  const [filter, setFilterState] = useState<FilterType>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const filteredAnimals: Animal[] =
    filter === 'all' ? ANIMALS : ANIMALS.filter((a) => a.type === filter);

  const currentAnimal = filteredAnimals[currentIndex] ?? null;
  const canGoNext = currentIndex < filteredAnimals.length - 1;
  const canGoPrev = currentIndex > 0;

  const setFilter = useCallback((f: FilterType) => {
    setFilterState(f);
    setCurrentIndex(0);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, filteredAnimals.length - 1));
  }, [filteredAnimals.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  // Touch swipe handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX < -SWIPE_THRESHOLD) goNext();       // swipe left  → next
    else if (deltaX > SWIPE_THRESHOLD) goPrev();   // swipe right → prev
    touchStartX.current = null;
  }, [goNext, goPrev]);

  return {
    filteredAnimals,
    currentIndex,
    currentAnimal,
    filter,
    setFilter,
    goNext,
    goPrev,
    canGoNext,
    canGoPrev,
    swipeHandlers: { onTouchStart, onTouchEnd },
  };
}
