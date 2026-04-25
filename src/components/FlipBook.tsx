import React, { forwardRef, useRef, useCallback, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Animal } from '../types/animal';
import styles from './FlipBook.module.css';

// ─── Single animal page ───────────────────────────────────────────────────────

interface PageProps {
  animal: Animal;
  index: number;
  total: number;
}

const Page = forwardRef<HTMLDivElement, PageProps>(
  ({ animal, index, total }, ref) => {
    const wild = animal.type === 'wild';
    return (
      <div ref={ref} className={`${styles.page} ${wild ? styles.wild : styles.domestic}`}>
        <div className={styles.spine} />
        <div className={styles.lines} />
        <div className={styles.content}>
          <div className={`${styles.badge} ${wild ? styles.badgeWild : styles.badgeDomestic}`}>
            {wild ? '🌿 Wild Animal' : '🏠 Domestic'}
          </div>
          <div className={styles.emoji}>{animal.emoji}</div>
          <h2 className={styles.name}>{animal.name}</h2>
          <p className={styles.desc}>{animal.desc}</p>
          <div className={styles.fact}>
            <span className={styles.factLabel}>⚡ Fun fact:</span>
            <span className={styles.factText}> {animal.fact}</span>
          </div>
          <div className={styles.pageNum}>{index + 1} / {total}</div>
        </div>
      </div>
    );
  }
);
Page.displayName = 'Page';

// ─── Cover pages ──────────────────────────────────────────────────────────────

// forwardRef<Ref type, Props type> — covers with no custom props use Record<string,never>
const CoverFront = forwardRef<HTMLDivElement, Record<string, never>>(
  (_props, ref) => (
    <div ref={ref} className={styles.cover}>
      <div className={styles.coverSpine} />
      <div className={styles.coverContent}>
        <div className={styles.coverEmoji}>🐾</div>
        <h1 className={styles.coverTitle}>Animal Flipbook</h1>
        <p className={styles.coverSub}>Drag a page corner to turn</p>
      </div>
    </div>
  )
);
CoverFront.displayName = 'CoverFront';

const CoverBack = forwardRef<HTMLDivElement, Record<string, never>>(
  (_props, ref) => (
    <div ref={ref} className={`${styles.cover} ${styles.coverBack}`}>
      <div className={styles.coverContent}>
        <div className={styles.coverEmoji}>🐾</div>
        <p className={styles.coverBackText}>© Made by Lokpriyanth — 2026</p>
      </div>
    </div>
  )
);
CoverBack.displayName = 'CoverBack';

// ─── FlipBook wrapper ─────────────────────────────────────────────────────────

interface FlipBookProps {
  animals: Animal[];
  currentIndex: number;
  onPageChange: (index: number) => void;
}

const FlipBook: React.FC<FlipBookProps> = ({ animals, currentIndex, onPageChange }) => {
  // Type the ref directly as HTMLFlipBook so .pageFlip() is visible to TS
  const bookRef = useRef<HTMLFlipBook>(null);
  const prevIndex = useRef(currentIndex);

  // When the filter tab resets the index to 0, jump the book back to cover
  useEffect(() => {
    if (currentIndex !== prevIndex.current) {
      prevIndex.current = currentIndex;
      // +1 because page 0 is the front cover
      bookRef.current?.pageFlip().flip(currentIndex + 1);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(
    (e: { data: number }) => {
      // page 0 = front cover, 1..N = animals, N+1 = back cover
      const animalIndex = e.data - 1;
      if (animalIndex >= 0 && animalIndex < animals.length) {
        onPageChange(animalIndex);
      }
    },
    [animals.length, onPageChange]
  );

  return (
    <div className={styles.bookWrap}>
      <HTMLFlipBook
        ref={bookRef}
        width={300}
        height={400}
        size="fixed"
        minWidth={300}
        maxWidth={300}
        minHeight={400}
        maxHeight={400}
        drawShadow
        flippingTime={700}
        usePortrait
        startZIndex={0}
        autoSize={false}
        maxShadowOpacity={0.6}
        showCover
        mobileScrollSupport={false}
        clickEventForward
        useMouseEvents
        swipeDistance={30}
        showPageCorners
        disableFlipByClick={false}
        onFlip={handleFlip}
        className={styles.flipBook}
      >
        <CoverFront />

        {animals.map((animal, i) => (
          <Page
            key={`${animal.name}-${animal.type}`}
            animal={animal}
            index={i}
            total={animals.length}
          />
        ))}

        <CoverBack />
      </HTMLFlipBook>
    </div>
  );
};

export default FlipBook;
