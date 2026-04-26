import React, { forwardRef, useRef, useCallback, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Animal } from '../types/animal';
import { useBookSize } from '../hooks/useBookSize';
import styles from './FlipBook.module.css';

const ANIMAL_OFFSET = 3;

// ─── Colour palette per animal type ──────────────────────────────────────────
const WILD_HUE     = { bg: '#0d3d2e', accent: '#22c55e', light: '#dcfce7', text: '#052e16' };
const DOMESTIC_HUE = { bg: '#78350f', accent: '#f59e0b', light: '#fef3c7', text: '#451a03' };

// ─── Animal page — Hey Zine editorial style ───────────────────────────────────

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  animal: Animal;
  index: number;
  total: number;
}

const Page = forwardRef<HTMLDivElement, PageProps>(
  ({ animal, index, total, ...rest }, ref) => {
    const wild = animal.type === 'wild';
    const hue  = wild ? WILD_HUE : DOMESTIC_HUE;
    return (
      <div ref={ref} className={styles.page} {...rest}
        style={{ '--accent': hue.accent, '--hue-bg': hue.bg, '--hue-light': hue.light, '--hue-text': hue.text } as React.CSSProperties}>

        {/* ── Full-bleed header block ── */}
        <div className={styles.pageHeader}>
          {/* Category pill */}
          <div className={styles.catPill}>
            {wild ? '🌿 Wild Animal' : '🏠 Domestic'}
          </div>
          {/* Giant emoji */}
          <div className={styles.pageEmoji}>{animal.emoji}</div>
        </div>

        {/* ── Body ── */}
        <div className={styles.pageBody}>
          {/* Name */}
          <h2 className={styles.pageName}>{animal.name}</h2>

          {/* Thin rule */}
          <div className={styles.pageRule} />

          {/* Description */}
          <p className={styles.pageDesc}>{animal.desc}</p>

          {/* Fun fact card */}
          <div className={styles.pageFact}>
            <span className={styles.pageFactIcon}>⚡</span>
            <div>
              <span className={styles.pageFactLabel}>Fun fact</span>
              <span className={styles.pageFactText}>{animal.fact}</span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className={styles.pageFooter}>
          <span className={styles.pageFooterBrand}>Animal Flipbook</span>
          <span className={styles.pageFooterNum}>{index + 1} / {total}</span>
        </div>
      </div>
    );
  }
);
Page.displayName = 'Page';

// ─── Title Recto — Hey Zine style ─────────────────────────────────────────────

const TitleRecto = forwardRef<HTMLDivElement, Record<string, never>>(
  (_props, ref) => (
    <div ref={ref} className={styles.titleRecto}>
      {/* Dark hero block */}
      <div className={styles.titleHero}>
        <p className={styles.titleHeroEyebrow}>A Collection of Animals</p>
        <div className={styles.titleHeroEmojis}>
          🐕 🦁 🐈 🐘 🦊 🐄 🐺 🐇 🐧
        </div>
        <h1 className={styles.titleHeroHeading}>Animal<br/>Flipbook</h1>
      </div>
      {/* White lower block */}
      <div className={styles.titleLower}>
        <p className={styles.titleLowerSub}>
          Discover domestic &amp; wild animals from around the world
        </p>
        <div className={styles.titleLowerMeta}>
          <span>First Edition</span>
          <span className={styles.titleLowerDot}>·</span>
          <span>2026</span>
        </div>
      </div>
    </div>
  )
);
TitleRecto.displayName = 'TitleRecto';

// ─── Title Verso — Hey Zine style ─────────────────────────────────────────────

const TitleVerso = forwardRef<HTMLDivElement, Record<string, never>>(
  (_props, ref) => (
    <div ref={ref} className={styles.titleVerso} data-density="hard">
      <div className={styles.versoInner}>
        {/* Publisher mark */}
        <div className={styles.versoMark}>
          <span className={styles.versoMarkEmoji}>🐾</span>
          <span className={styles.versoMarkName}>Lokpriyanth Press</span>
        </div>

        <div className={styles.versoHRule} />

        <h2 className={styles.versoAboutTitle}>About This Book</h2>
        <p className={styles.versoAboutText}>
          This flipbook takes you on a journey through the animal kingdom —
          from faithful domestic companions who share our homes, to magnificent
          wild creatures that roam forests, savannas, and oceans.
        </p>
        <p className={styles.versoAboutText}>
          Each page features a description, a fun fact, and an illustration.
          Flip through and discover something new!
        </p>

        {/* Animal index grid */}
        <div className={styles.versoGrid}>
          {['🐕 Dog','🐈 Cat','🐄 Cow','🐓 Chicken','🐑 Sheep','🐇 Rabbit',
            '🦁 Lion','🐘 Elephant','🦊 Fox','🐺 Wolf','🦒 Giraffe','🐧 Penguin']
            .map(a => <span key={a} className={styles.versoGridItem}>{a}</span>)}
        </div>

        <div className={styles.versoCopyright}>
          © 2026 Lokpriyanth. All rights reserved.
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
  const bookRef   = useRef<HTMLFlipBook>(null);
  const prevIndex = useRef(currentIndex);
  const { pageW, pageH } = useBookSize();
  const [isOpen, setIsOpen] = React.useState(false);

  const wrapStyle = { '--pw': `${pageW}px` } as React.CSSProperties;

  useEffect(() => {
    if (currentIndex !== prevIndex.current) {
      prevIndex.current = currentIndex;
      bookRef.current?.pageFlip().flip(currentIndex + ANIMAL_OFFSET);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(
    (e: { data: number }) => {
      const idx = e.data - ANIMAL_OFFSET;
      // Book is "open" once we're past the front cover (page 0)
      setIsOpen(e.data > 0 && e.data < animals.length + ANIMAL_OFFSET + 1);
      if (idx >= 0 && idx < animals.length) onPageChange(idx);
    },
    [animals.length, onPageChange]
  );

  // Stable child list — left pages get data-density="hard" so the library
  // doesn't apply a soft curl toward the spine on them.
  // Global layout: 0=CoverFront 1=TitleRecto 2=TitleVerso 3..=Animals N+3=CoverBack
  // Even global index sits on LEFT side of the spread.
  const pages = useRef(
    animals.map((animal, i) => {
      const globalPos = ANIMAL_OFFSET + i;
      const isLeft = globalPos % 2 === 0;
      return (
        <Page
          key={`${animal.name}-${animal.type}`}
          animal={animal}
          index={i}
          total={animals.length}
          data-density={isLeft ? 'hard' : 'soft'}
        />
      );
    })
  );

  return (
    <div
      className={`${styles.bookWrap} ${isOpen ? styles.bookOpen : styles.bookClosed}`}
      style={wrapStyle}
    >
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
        <CoverFront />
        <TitleRecto />
        <TitleVerso />
        {pages.current}
        <CoverBack />
      </HTMLFlipBook>

      {/* Center spine — drawn over the book at the seam between the two pages.
          Visible only when the book is OPEN (past the cover).                  */}
      <div className={styles.centerSpine} aria-hidden="true" />
    </div>
  );
};

export default FlipBook;
