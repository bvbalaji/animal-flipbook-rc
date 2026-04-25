import React from 'react';
import { FilterType } from '../types/animal';
import styles from './FilterTabs.module.css';

interface FilterTabsProps {
  active: FilterType;
  onChange: (f: FilterType) => void;
}

const TABS: { label: string; value: FilterType }[] = [
  { label: 'All Animals', value: 'all' },
  { label: '🏠 Domestic', value: 'domestic' },
  { label: '🌿 Wild', value: 'wild' },
];

const FilterTabs: React.FC<FilterTabsProps> = ({ active, onChange }) => (
  <div className={styles.tabs} role="tablist" aria-label="Filter animals by type">
    {TABS.map((tab) => (
      <button
        key={tab.value}
        role="tab"
        aria-selected={active === tab.value}
        className={`${styles.tab} ${active === tab.value ? styles.active : ''}`}
        onClick={() => onChange(tab.value)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default FilterTabs;
