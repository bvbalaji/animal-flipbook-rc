import React from 'react';
import { useFlipbook } from './hooks/useFlipbook';
import FilterTabs from './components/FilterTabs';
import Book from './components/Book';
import styles from './App.module.css';

const App: React.FC = () => {
  const {
    filteredAnimals,
    currentIndex,
    filter,
    setFilter,
    goNext,
    goPrev,
    canGoNext,
    canGoPrev,
  } = useFlipbook();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>🐾 Animal Flipbook</h1>
        <p className={styles.subtitle}>
          Discover domestic &amp; wild animals — flip the pages!
        </p>
      </header>

      <FilterTabs active={filter} onChange={setFilter} />

      <Book
        animals={filteredAnimals}
        currentIndex={currentIndex}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={goPrev}
        onNext={goNext}
      />

      <div className={styles.counter}>
        {currentIndex + 1} / {filteredAnimals.length}
      </div>
      <p className={styles.hint}>Use arrow keys or buttons to flip ✍</p>
    </div>
  );
};

export default App;
