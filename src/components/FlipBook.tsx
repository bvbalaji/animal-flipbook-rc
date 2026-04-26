import React, { forwardRef, useRef, useCallback, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Animal } from '../types/animal';
import { useBookSize } from '../hooks/useBookSize';
import styles from './FlipBook.module.css';

// Page layout (0-indexed) in landscape/spread mode:
//   0          = CoverFront  (right, hard cover)
//   1          = BlankLeft   (left,  hard — back of front cover)
//   2          = IntroRight  (right — introduction recto)
//   3          = IntroLeft   (left  — introduction verso)
//   4 .. N+3   = Animal pages
//   N+4        = CoverBack   (left,  hard cover)
const ANIMAL_OFFSET = 4;

// ─── Animal page ──────────────────────────────────────────────────────────────
// The PAGE SHELL is rotated 180° so the curl originates from the correct edge.
// The CONTENT WRAPPER is counter-rotated 180° so everything inside reads normally.

interface PageProps {
  animal: Animal;
  index: number;
  total: number;
  isLeft: boolean;
}

const Page = forwardRef<HTMLDivElement, PageProps>(({ animal, index, total, isLeft }, ref) => {
  const wild = animal.type === 'wild';
  return (
    <div
      ref={ref}
      className={`${styles.page} ${styles.pageFlipped} ${isLeft ? styles.pageLeft : styles.pageRight} ${wild ? styles.wild : styles.domestic}`}
    >
      {/* Spine only on right-hand pages — but since page is rotated 180°,
          spine must be on the RIGHT edge of the div so it appears on the
          correct inner edge after rotation */}
      {!isLeft && <div className={styles.spine} />}
      <div className={styles.lines} />
      {/* Counter-rotate the content so it reads right-way up */}
      <div className={`${isLeft ? styles.contentLeft : styles.content} ${styles.contentUnflipped}`}>
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

// ─── Introduction pages ───────────────────────────────────────────────────────

const IntroRight = forwardRef<HTMLDivElement, Record<string, never>>((_props, ref) => (
  <div ref={ref} className={`${styles.page} ${styles.pageFlipped} ${styles.pageRight} ${styles.introRight}`}>
    <div className={styles.spine} />
    <div className={styles.lines} />
    <div className={`${styles.content} ${styles.contentUnflipped}`}>
      <div className={styles.introBand}><span>🐾 Animal Flipbook</span></div>
      <div className={styles.introEmojiCluster}>🐕 🦁 🐈 🐘 🦊 🐄 🐺 🐇 🐧</div>
      <h1 className={styles.introTitle}>Welcome!</h1>
      <p className={styles.introBody}>
        This flipbook takes you on a journey through the animal kingdom —
        from loyal domestic companions to magnificent wild creatures.
      </p>
      <p className={styles.introBody}>
        Each page features an animal portrait, a short description, and a
        surprising fun fact. Flip through and discover something new!
      </p>
      <div className={styles.introDivider}><span /><span>🌿</span><span /></div>
      <p className={styles.introEdition}>First Edition · 2026 · By Lokpriyanth</p>
    </div>
  </div>
));
IntroRight.displayName = 'IntroRight';

const IntroLeft = forwardRef<HTMLDivElement, Record<string, never>>((_props, ref) => (
  <div ref={ref} className={`${styles.page} ${styles.pageFlipped} ${styles.pageLeft} ${styles.introLeft}`}>
    <div className={styles.lines} />
    <div className={`${styles.contentLeft} ${styles.contentUnflipped}`}>
      <p className={styles.introPublisher}>Lokpriyanth Press</p>
      <div className={styles.introHRule} />
      <h2 className={styles.introContentsTitle}>Contents</h2>
      <div className={styles.introAnimalGrid}>
        {['🐕 Dog','🐈 Cat','🐄 Cow','🐓 Chicken','🐑 Sheep','🐇 Rabbit',
          '🦁 Lion','🐘 Elephant','🦊 Fox','🐺 Wolf','🦒 Giraffe','🐧 Penguin']
          .map(a => <span key={a} className={styles.introAnimalItem}>{a}</span>)}
      </div>
      <div className={styles.introHRule} />
      <p className={styles.introCopyright}>© 2026 Lokpriyanth. All rights reserved.</p>
    </div>
  </div>
));
IntroLeft.displayName = 'IntroLeft';

// ─── Blank left page ──────────────────────────────────────────────────────────

const BlankLeft = forwardRef<HTMLDivElement, Record<string, never>>((_props, ref) => (
  <div ref={ref} className={styles.blankLeft} data-density="hard" />
));
BlankLeft.displayName = 'BlankLeft';

// ─── Covers (NOT rotated) ─────────────────────────────────────────────────────

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
  const { pageW, pageH } = useBookSize();

  // Inject --pw so CSS can use calc(var(--pw) * ratio) for fluid sizing
  const wrapStyle = { '--pw': `${pageW}px` } as React.CSSProperties;

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

  // Stable page list — isLeft never changes so safe to memoize
  const animalPages = useRef(
    animals.map((animal, i) => {
      const globalPos = ANIMAL_OFFSET + i;
      const isLeft = globalPos % 2 === 0;
      return (
        <Page
          key={`${animal.name}-${animal.type}`}
          animal={animal}
          index={i}
          total={animals.length}
          isLeft={isLeft}
        />
      );
    })
  );

  return (
    <div className={styles.bookWrap} style={wrapStyle}>
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
        maxShadowOpacity={0.6}
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
        <BlankLeft />
        <IntroRight />
        <IntroLeft />
        {animalPages.current}
        <CoverBack />
      </HTMLFlipBook>
    </div>
  );
};

export default FlipBook;
