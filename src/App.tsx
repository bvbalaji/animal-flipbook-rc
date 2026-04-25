import React, { useState } from 'react';
import { FilterType } from './types/animal';
import { ANIMALS } from './data/animals';
import FilterTabs from './components/FilterTabs';
import FlipBook from './components/FlipBook';
import styles from './App.module.css';

const App: React.FC = () => {
  const [filter, setFilter]       = useState<FilterType>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredAnimals = filter === 'all'
    ? ANIMALS
    : ANIMALS.filter(a => a.type === filter);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setCurrentIndex(0);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>🐾 Animal Flipbook</h1>
        <p className={styles.subtitle}>Drag a page corner to turn — pages rest on the left as you read</p>
      </header>

      <FilterTabs active={filter} onChange={handleFilterChange} />

      <FlipBook
        animals={filteredAnimals}
        currentIndex={currentIndex}
        onPageChange={setCurrentIndex}
      />

      <p className={styles.hint}>
        {currentIndex + 1} / {filteredAnimals.length} &nbsp;·&nbsp; open like a real book — turned pages stack left
      </p>

      <footer className={styles.footer}>© Made by Lokpriyanth — 2026</footer>
    </div>
  );
};

export default App;
