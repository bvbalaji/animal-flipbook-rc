import React from 'react';
import styles from './NavButton.module.css';

interface NavButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ direction, onClick, disabled }) => (
  <button
    className={styles.btn}
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === 'prev' ? 'Previous animal' : 'Next animal'}
  >
    {direction === 'prev' ? '←' : '→'}
  </button>
);

export default NavButton;
