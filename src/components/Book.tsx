import React from 'react';
import { Animal } from '../types/animal';
import AnimalPage from './AnimalPage';
import NavButton from './NavButton';
import styles from './Book.module.css';

interface BookProps {
  animals: Animal[];
  currentIndex: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const Book: React.FC<BookProps> = ({
  animals,
  currentIndex,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}) => (
  <div className={styles.wrapper}>
    <NavButton direction="prev" onClick={onPrev} disabled={!canGoPrev} />

    <div className={styles.bookOuter}>
      {/* Stacked pages depth effect */}
      <div className={styles.stackBack} />
      <div className={styles.stackMid} />

      <div
        className={styles.book}
        role="region"
        aria-label="Animal flipbook"
        aria-live="polite"
      >
        {animals.map((animal, i) => (
          <AnimalPage
            key={`${animal.name}-${animal.type}`}
            animal={animal}
            index={i}
            total={animals.length}
            isActive={i === currentIndex}
          />
        ))}
      </div>
    </div>

    <NavButton direction="next" onClick={onNext} disabled={!canGoNext} />
  </div>
);

export default Book;
