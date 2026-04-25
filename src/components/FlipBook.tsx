import React, { forwardRef, useRef, useCallback, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Animal } from '../types/animal';
import styles from './FlipBook.module.css';

// ─── Page offset constants ────────────────────────────────────────────────────
// Page layout inside react-pageflip (0-indexed):
//   0 = CoverFront  (hard cover, right side)
//   1 = TitleRecto  (right side of title spread)
//   2 = TitleVerso  (left side of title spread — back of TitleRecto)
//   3..N+2 = Animal pages
//   N+3 = CoverBack (hard cover, left side)
const ANIMAL_PAGE_OFFSET = 3; // first animal is at index 3

// ─── Animal page ──────────────────────────────────────────────────────────────

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

// ─── Title page — Recto (right-hand page, shown first) ───────────────────────

const TitleRecto = forwardRef<HTMLDivElement, Record<string, never>>(
  (_props, ref) => (
    <div ref={ref} className={styles.titleRecto}>
      <div className={styles.spine} />
      <div className={styles.lines} />
      <div className={styles.titleRectoContent}>
        {/* Decorative top band */}
        <div className={styles.titleBand}>
          <span className={styles.titleBandText}>A Collection of Animals</span>
        </div>

        {/* Main emoji cluster */}
        <div className={styles.titleEmojiRow}>
          <span>🐕</span><span>🦁</span><span>🐈</span>
        </div>
        <div className={styles.titleEmojiRow}>
          <span>🐘</span><span>🐾</span><span>🦊</span>
        </div>
        <div className={styles.titleEmojiRow}>
          <span>🐄</span><span>🐺</span><span>🐇</span>
        </div>

        {/* Title */}
        <h1 className={styles.titleHeading}>Animal<br />Flipbook</h1>

        {/* Subtitle */}
        <p className={styles.titleSubtitle}>
          Discover domestic &amp; wild animals<br />from around the world
        </p>

        {/* Decorative divider */}
        <div className={styles.titleDivider}>
          <span />
          <span>🌿</span>
          <span />
        </div>

        {/* Edition line */}
        <p className={styles.titleEdition}>First Edition · 2026</p>
      </div>
    </div>
  )
);
TitleRecto.displayName = 'TitleRecto';

// ─── Title page — Verso (left-hand page, shown as the back/spread) ───────────

const TitleVerso = forwardRef<HTMLDivElement, Record<string, never>>(
  (_props, ref) => (
    <div ref={ref} className={styles.titleVerso}>
      {/* No spine here — this is the LEFT page */}
      <div className={styles.lines} />
      <div className={styles.titleVersoContent}>

        {/* Publisher block top */}
        <div className={styles.versoCrest}>🐾</div>
        <p className={styles.versoPublisher}>Lokpriyanth Press</p>

        <div className={styles.versoDivider} />

        {/* About this book */}
        <h2 className={styles.versoTitle}>About This Book</h2>
        <p className={styles.versoBody}>
          This flipbook takes you on a journey through the animal kingdom —
          from faithful domestic companions who share our homes, to magnificent
          wild creatures that roam forests, savannas, and oceans.
        </p>
        <p className={styles.versoBody}>
          Each page features a fun fact, a description, and an illustration.
          Flip through and discover something new about the animals we share
          our world with.
        </p>

        <div className={styles.versoAnimalList}>
          <span>🐕 Dog</span><span>🐈 Cat</span><span>🐄 Cow</span>
          <span>🐓 Chicken</span><span>🐑 Sheep</span><span>🐇 Rabbit</span>
          <span>🦁 Lion</span><span>🐘 Elephant</span><span>🦊 Fox</span>
          <span>🐺 Wolf</span><span>🦒 Giraffe</span><span>🐧 Penguin</span>
        </div>

        {/* Copyright block bottom */}
        <div className={styles.versoCopyright}>
          <p>© 2026 Lokpriyanth. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
);
TitleVerso.displayName = 'TitleVerso';

// ─── Covers ───────────────────────────────────────────────────────────────────

const CoverFront = forwardRef<HTMLDivElement, Record<string, never>>(
  (_props, ref) => (
    <div ref={ref} className={styles.cover}>
      <div className={styles.coverSpine} />
      <div className={styles.coverDecorTop} />
      <div className={styles.coverContent}>
        <div className={styles.coverEmoji}>🐾</div>
        <h1 className={styles.coverTitle}>Animal Flipbook</h1>
        <p className={styles.coverSub}>Drag a page corner to turn</p>
      </div>
      <div className={styles.coverDecorBottom} />
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
        <p className={styles.coverBackSub}>Thank you for reading!</p>
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
  const bookRef    = useRef<HTMLFlipBook>(null);
  const prevIndex  = useRef(currentIndex);

  // When filter tabs reset index, jump book back to first animal page
  useEffect(() => {
    if (currentIndex !== prevIndex.current) {
      prevIndex.current = currentIndex;
      bookRef.current?.pageFlip().flip(currentIndex + ANIMAL_PAGE_OFFSET);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(
    (e: { data: number }) => {
      // Subtract the offset to get the animal array index
      const animalIndex = e.data - ANIMAL_PAGE_OFFSET;
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
        flippingTime={800}
        usePortrait={false}
        startZIndex={0}
        autoSize={false}
        maxShadowOpacity={0.7}
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
        {/* Hard front cover */}
        <CoverFront />

        {/* Title spread: Recto (right) + Verso (left) */}
        <TitleRecto />
        <TitleVerso />

        {/* Animal pages */}
        {animals.map((animal, i) => (
          <Page
            key={`${animal.name}-${animal.type}`}
            animal={animal}
            index={i}
            total={animals.length}
          />
        ))}

        {/* Hard back cover */}
        <CoverBack />
      </HTMLFlipBook>
    </div>
  );
};

export default FlipBook;
