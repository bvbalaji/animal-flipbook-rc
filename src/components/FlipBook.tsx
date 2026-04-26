import React, { forwardRef, useRef, useCallback, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Animal } from '../types/animal';
import { useBookSize } from '../hooks/useBookSize';
import styles from './FlipBook.module.css';

// Page layout (0-indexed):
//   0          = CoverFront
//   1          = TitleRecto
//   2          = TitleVerso
//   3 … N+2   = Animal pages
//   N+3        = CoverBack
const ANIMAL_OFFSET = 3;

// ─── CSS variable injector ────────────────────────────────────────────────────
// Every page receives --pw so all rem/% sizing inside is relative to the
// actual rendered page width, not the viewport.
function pageStyle(pageW: number): React.CSSProperties {
  return { '--pw': `${pageW}px` } as React.CSSProperties;
}

// ─── Animal page ──────────────────────────────────────────────────────────────

interface PageProps { animal: Animal; index: number; total: number; pageW: number; }

const Page = forwardRef<HTMLDivElement, PageProps>(
  ({ animal, index, total, pageW }, ref) => {
    const wild = animal.type === 'wild';
    return (
      <div ref={ref} className={`${styles.page} ${wild ? styles.wild : styles.domestic}`}
           style={pageStyle(pageW)}>
        <div className={styles.spine} />
        <div className={styles.lines} />
        <div className={styles.content}>
          <div className={`${styles.badge} ${wild ? styles.badgeWild : styles.badgeDomestic}`}>
            {wild ? '🌿 Wild' : '🏠 Domestic'}
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

// ─── Title Recto ──────────────────────────────────────────────────────────────

interface SizedProps { pageW: number; }

const TitleRecto = forwardRef<HTMLDivElement, SizedProps>(
  ({ pageW }, ref) => (
    <div ref={ref} className={styles.titleRecto} style={pageStyle(pageW)}>
      <div className={styles.spine} />
      <div className={styles.lines} />
      <div className={styles.titleRectoContent}>
        <div className={styles.titleBand}>
          <span className={styles.titleBandText}>A Collection of Animals</span>
        </div>
        <div className={styles.titleEmojiRow}><span>🐕</span><span>🦁</span><span>🐈</span></div>
        <div className={styles.titleEmojiRow}><span>🐘</span><span>🐾</span><span>🦊</span></div>
        <div className={styles.titleEmojiRow}><span>🐄</span><span>🐺</span><span>🐇</span></div>
        <h1 className={styles.titleHeading}>Animal<br />Flipbook</h1>
        <p className={styles.titleSubtitle}>Discover domestic &amp; wild animals<br />from around the world</p>
        <div className={styles.titleDivider}><span /><span>🌿</span><span /></div>
        <p className={styles.titleEdition}>First Edition · 2026</p>
      </div>
    </div>
  )
);
TitleRecto.displayName = 'TitleRecto';

// ─── Title Verso ──────────────────────────────────────────────────────────────

const TitleVerso = forwardRef<HTMLDivElement, SizedProps>(
  ({ pageW }, ref) => (
    <div ref={ref} className={styles.titleVerso} style={pageStyle(pageW)}>
      <div className={styles.lines} />
      <div className={styles.titleVersoContent}>
        <div className={styles.versoCrest}>🐾</div>
        <p className={styles.versoPublisher}>Lokpriyanth Press</p>
        <div className={styles.versoDivider} />
        <h2 className={styles.versoTitle}>About This Book</h2>
        <p className={styles.versoBody}>
          This flipbook takes you on a journey through the animal kingdom —
          from faithful domestic companions to magnificent wild creatures.
        </p>
        <p className={styles.versoBody}>
          Each page features a fun fact, a description, and an illustration.
          Flip through and discover something new!
        </p>
        <div className={styles.versoAnimalList}>
          <span>🐕 Dog</span><span>🐈 Cat</span><span>🐄 Cow</span>
          <span>🐓 Chicken</span><span>🐑 Sheep</span><span>🐇 Rabbit</span>
          <span>🦁 Lion</span><span>🐘 Elephant</span><span>🦊 Fox</span>
          <span>🐺 Wolf</span><span>🦒 Giraffe</span><span>🐧 Penguin</span>
        </div>
        <div className={styles.versoCopyright}>
          <p>© 2026 Lokpriyanth. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
);
TitleVerso.displayName = 'TitleVerso';

// ─── Covers ───────────────────────────────────────────────────────────────────

const CoverFront = forwardRef<HTMLDivElement, SizedProps>(
  ({ pageW }, ref) => (
    <div ref={ref} className={styles.cover} style={pageStyle(pageW)}>
      <div className={styles.coverSpine} />
      <div className={styles.coverDecorTop} />
      <div className={styles.coverContent}>
        <div className={styles.coverEmoji}>🐾</div>
        <h1 className={styles.coverTitle}>Animal Flipbook</h1>
        <p className={styles.coverSub}>Drag a corner to turn</p>
      </div>
      <div className={styles.coverDecorBottom} />
    </div>
  )
);
CoverFront.displayName = 'CoverFront';

const CoverBack = forwardRef<HTMLDivElement, SizedProps>(
  ({ pageW }, ref) => (
    <div ref={ref} className={`${styles.cover} ${styles.coverBack}`} style={pageStyle(pageW)}>
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
  const bookRef   = useRef<HTMLFlipBook>(null);
  const prevIndex = useRef(currentIndex);
  const { pageW, pageH } = useBookSize();

  useEffect(() => {
    if (currentIndex !== prevIndex.current) {
      prevIndex.current = currentIndex;
      bookRef.current?.pageFlip().flip(currentIndex + ANIMAL_OFFSET);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(
    (e: { data: number }) => {
      const idx = e.data - ANIMAL_OFFSET;
      if (idx >= 0 && idx < animals.length) onPageChange(idx);
    },
    [animals.length, onPageChange]
  );

  return (
    <div className={styles.bookWrap}>
      <HTMLFlipBook
        ref={bookRef}
        width={pageW}
        height={pageH}
        size="fixed"
        minWidth={120}
        maxWidth={300}
        minHeight={160}
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
        swipeDistance={20}
        showPageCorners
        disableFlipByClick={false}
        onFlip={handleFlip}
        className={styles.flipBook}
      >
        <CoverFront  pageW={pageW} />
        <TitleRecto  pageW={pageW} />
        <TitleVerso  pageW={pageW} />

        {animals.map((animal, i) => (
          <Page
            key={`${animal.name}-${animal.type}`}
            animal={animal}
            index={i}
            total={animals.length}
            pageW={pageW}
          />
        ))}

        <CoverBack pageW={pageW} />
      </HTMLFlipBook>
    </div>
  );
};

export default FlipBook;
