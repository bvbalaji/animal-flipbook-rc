import React, { forwardRef, useRef, useCallback, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Animal } from '../types/animal';
import styles from './FlipBook.module.css';

// Page layout (0-indexed) in landscape/spread mode:
//   0 = CoverFront   (right side, hard cover)
//   1 = BlankLeft    (left side of first spread — shows back of cover)
//   2..N+1 = Animal pages
//   N+2 = CoverBack  (left side, hard cover)
const ANIMAL_OFFSET = 2;

// ─── Animal page ──────────────────────────────────────────────────────────────

interface PageProps {
  animal: Animal;
  index: number;
  total: number;
}

const Page = forwardRef<HTMLDivElement, PageProps>(({ animal, index, total }, ref) => {
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
});
Page.displayName = 'Page';

// ─── Blank left page (back of front cover, shown on first open) ───────────────

const BlankLeft = forwardRef<HTMLDivElement, Record<string, never>>((_props, ref) => (
  <div ref={ref} className={styles.blankLeft} data-density="hard" />
));
BlankLeft.displayName = 'BlankLeft';

// ─── Covers ───────────────────────────────────────────────────────────────────

const CoverFront = forwardRef<HTMLDivElement, Record<string, never>>((_props, ref) => (
  <div ref={ref} className={styles.cover}>
    <div className={styles.coverContent}>
      <div className={styles.coverEmoji}>🐾</div>
      <h1 className={styles.coverTitle}>Animal Flipbook</h1>
      <p className={styles.coverSub}>Drag the page corner to turn</p>
    </div>
    <div className={styles.coverSpine} />
  </div>
));
CoverFront.displayName = 'CoverFront';

const CoverBack = forwardRef<HTMLDivElement, Record<string, never>>((_props, ref) => (
  <div ref={ref} className={`${styles.cover} ${styles.coverBack}`}>
    <div className={styles.coverContent}>
      <div className={styles.coverEmoji}>🐾</div>
      <p className={styles.coverBackText}>© Made by Lokpriyanth — 2026</p>
      <p className={styles.coverBackSub}>Thank you for reading!</p>
    </div>
  </div>
));
CoverBack.displayName = 'CoverBack';

// ─── FlipBook wrapper ─────────────────────────────────────────────────────────

interface FlipBookProps {
  animals: Animal[];
  currentIndex: number;
  onPageChange: (index: number) => void;
}

const FlipBook: React.FC<FlipBookProps> = ({ animals, currentIndex, onPageChange }) => {
  const bookRef   = useRef<HTMLFlipBook>(null);
  const prevIndex = useRef(currentIndex);

  useEffect(() => {
    if (currentIndex !== prevIndex.current) {
      prevIndex.current = currentIndex;
      bookRef.current?.pageFlip().flip(currentIndex + ANIMAL_OFFSET);
    }
  }, [currentIndex]);

  const handleFlip = useCallback((e: { data: number }) => {
    const animalIndex = e.data - ANIMAL_OFFSET;
    if (animalIndex >= 0 && animalIndex < animals.length) {
      onPageChange(animalIndex);
    }
  }, [animals.length, onPageChange]);

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
        flippingTime={800}
        usePortrait={false}
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
        {/* Hard front cover — right side */}
        <CoverFront />

        {/* Blank left page — first thing you see when you open the cover.
            data-density="hard" stops it curling like a soft page. */}
        <BlankLeft />

        {/* Animal pages */}
        {animals.map((animal, i) => (
          <Page
            key={`${animal.name}-${animal.type}`}
            animal={animal}
            index={i}
            total={animals.length}
          />
        ))}

        {/* Hard back cover — left side */}
        <CoverBack />
      </HTMLFlipBook>
    </div>
  );
};

export default FlipBook;
