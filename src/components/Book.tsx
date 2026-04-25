import React, { useState, useCallback, useEffect } from 'react';
import { Animal } from '../types/animal';
import AnimalPage, { TurnDirection } from './AnimalPage';
import NavButton from './NavButton';
import styles from './Book.module.css';

const FLIP_DURATION = 650; // ms — must match CSS animation duration

interface BookProps {
  animals: Animal[];
  currentIndex: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  swipeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

const Book: React.FC<BookProps> = ({
  animals,
  currentIndex,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  swipeHandlers,
}) => {
  // Which page index is currently mid-flip and in which direction
  const [turningIndex, setTurningIndex] = useState<number | null>(null);
  const [turningDir, setTurningDir] = useState<TurnDirection>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerFlip = useCallback(
    (direction: 'next' | 'prev', navigate: () => void) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setTurningIndex(currentIndex);
      setTurningDir(direction);

      // Let animation play, then commit the navigation
      setTimeout(() => {
        navigate();
        setTurningIndex(null);
        setTurningDir(null);
        setIsAnimating(false);
      }, FLIP_DURATION);
    },
    [isAnimating, currentIndex]
  );

  const handleNext = useCallback(
    () => triggerFlip('next', onNext),
    [triggerFlip, onNext]
  );

  const handlePrev = useCallback(
    () => triggerFlip('prev', onPrev),
    [triggerFlip, onPrev]
  );

  // Expose animated handlers to keyboard/swipe (override parent's direct calls)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && canGoNext) handleNext();
      if (e.key === 'ArrowLeft' && canGoPrev) handlePrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNext, handlePrev, canGoNext, canGoPrev]);

  // Swipe handlers wired to the animated version
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    (swipeHandlers as any)._startX = e.touches[0].clientX;
  }, [swipeHandlers]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const startX = (swipeHandlers as any)._startX;
    if (startX == null) return;
    const delta = e.changedTouches[0].clientX - startX;
    if (delta < -50 && canGoNext) handleNext();
    else if (delta > 50 && canGoPrev) handlePrev();
    (swipeHandlers as any)._startX = null;
  }, [handleNext, handlePrev, canGoNext, canGoPrev, swipeHandlers]);

  return (
    <div className={styles.wrapper}>
      <NavButton direction="prev" onClick={handlePrev} disabled={!canGoPrev || isAnimating} />

      <div
        className={styles.bookOuter}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.stackBack} />
        <div className={styles.stackMid} />

        <div
          className={styles.book}
          role="region"
          aria-label="Animal flipbook"
          aria-live="polite"
        >
          {animals.map((animal, i) => {
            const isTurning = i === turningIndex;
            const isVisible = i === currentIndex || isTurning;

            return (
              <AnimalPage
                key={`${animal.name}-${animal.type}`}
                animal={animal}
                nextAnimal={animals[i + 1] ?? null}
                prevAnimal={animals[i - 1] ?? null}
                index={i}
                total={animals.length}
                turning={isTurning ? turningDir : null}
                zIndex={isTurning ? 10 : i === currentIndex ? 5 : i}
                visible={isVisible}
              />
            );
          })}
        </div>
      </div>

      <NavButton direction="next" onClick={handleNext} disabled={!canGoNext || isAnimating} />
    </div>
  );
};

export default Book;
