import React, { memo } from 'react';
import { CardPatternProps, CARD_PATTERNS } from '../../types/card';
import styles from './Card.module.css';

const getPatternClass = (pattern: string): string => {
  switch (pattern) {
    case CARD_PATTERNS.DIAGONAL:
      return styles.cardBackDiagonal;
    case CARD_PATTERNS.GRID:
      return styles.cardBackGrid;
    case CARD_PATTERNS.DOTS:
      return styles.cardBackDots;
    default:
      return styles.cardBackDefault;
  }
};

export const CardBack = memo<CardPatternProps>(({ 
  backPattern = CARD_PATTERNS.DEFAULT,
  backPrimaryColor,
  backSecondaryColor
}) => {
  const style = {
    ...(backPrimaryColor && { '--card-back-primary': backPrimaryColor }),
    ...(backSecondaryColor && { '--card-back-secondary': backSecondaryColor })
  } as React.CSSProperties;

  return (
    <div 
      className={`${styles.cardBack} ${getPatternClass(backPattern)}`} 
      style={style}
      data-testid="card-back"
      role="img"
      aria-label="Card back"
    />
  );
});

CardBack.displayName = 'CardBack'; 