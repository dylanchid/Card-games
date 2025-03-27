import React, { memo } from 'react';
import styles from './Card.module.css';

export const CardBack: React.FC = memo(() => {
  return (
    <div className={styles.cardBack} />
  );
});

CardBack.displayName = 'CardBack'; 