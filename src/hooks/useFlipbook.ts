import { useState, useEffect, useCallback } from 'react';
import { Animal, FilterType } from '../types/animal';
import { ANIMALS } from '../data/animals';

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
}

export function useFlipbook(): UseFlipbookReturn {
  const [filter, setFilterState] = useState<FilterType>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
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
  };
}
