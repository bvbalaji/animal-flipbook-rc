import React from 'react';
import { Animal } from '../types/animal';
import PageContent from './PageContent';
import styles from './AnimalPage.module.css';

export type TurnDirection = 'next' | 'prev' | null;

interface AnimalPageProps {
  animal: Animal;
  nextAnimal: Animal | null;
  prevAnimal: Animal | null;
  index: number;
  total: number;
  turning: TurnDirection;
  zIndex: number;
  visible: boolean;
}

const AnimalPage: React.FC<AnimalPageProps> = ({
  animal,
  nextAnimal,
  prevAnimal,
  index,
  total,
  turning,
  zIndex,
  visible,
}) => {
  const turning_next = turning === 'next';
  const turning_prev = turning === 'prev';
  const backAnimal = turning_next ? nextAnimal : turning_prev ? prevAnimal : null;

  return (
    <div
      className={[
        styles.flipper,
        turning_next ? styles.flipNext : '',
        turning_prev ? styles.flipPrev : '',
      ].join(' ')}
      style={{ zIndex, opacity: visible ? 1 : 0 }}
      aria-hidden={!visible}
    >
      <PageContent animal={animal} index={index} total={total} face="front" />

      {backAnimal && (
        <PageContent
          animal={backAnimal}
          index={turning_next ? index + 1 : index - 1}
          total={total}
          face="back"
        />
      )}

      <div
        className={[
          styles.shadow,
          turning_next ? styles.shadowNext : '',
          turning_prev ? styles.shadowPrev : '',
        ].join(' ')}
      />
    </div>
  );
};

export default AnimalPage;
