import React from 'react';
import { Animal } from '../types/animal';
import styles from './AnimalPage.module.css';

interface AnimalPageProps {
  animal: Animal;
  index: number;
  total: number;
  isActive: boolean;
}

const AnimalPage: React.FC<AnimalPageProps> = ({ animal, index, total, isActive }) => (
  <div
    className={`${styles.page} ${styles[animal.type]} ${isActive ? styles.active : ''}`}
    aria-hidden={!isActive}
  >
    <div className={styles.spine} />
    <div className={styles.lines} />

    <div className={styles.content}>
      <span className={styles.badge}>
        {animal.type === 'domestic' ? '🏠 Domestic' : '🌿 Wild'}
      </span>

      <span className={styles.emoji} role="img" aria-label={animal.name}>
        {animal.emoji}
      </span>

      <h2 className={styles.name}>{animal.name}</h2>

      <p className={styles.desc}>{animal.desc}</p>

      <div className={styles.fact}>
        <strong>Fun fact:</strong> {animal.fact}
      </div>

      <div className={styles.pageNum}>
        {index + 1} / {total}
      </div>
    </div>
  </div>
);

export default AnimalPage;
