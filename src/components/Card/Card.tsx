import React, { useCallback, memo } from 'react';
import { Suit, Rank, CardProps, CardType, CARD_PATTERNS } from '../../types/card';
import { CardFace } from './CardFace';
import { CardBack } from './CardBack';
import { useCardStyles } from './useCardStyles';
import styles from './Card.module.css';

export const Card = memo<CardProps>(({
  card,
  onClick,
  onDragStart: propDragStart,
  onDragEnd: propDragEnd,
  disabled = false,
  selected = false,
  index = 0,
  style,
  id,
  backPattern = CARD_PATTERNS.DEFAULT,
  backPrimaryColor,
  backSecondaryColor,
  isLoading = false,
  error
}) => {
  // Type validation
  if (!Object.values(Suit).includes(card.suit as Suit) || !Object.values(Rank).includes(card.rank as Rank)) {
    console.error('[Card] Invalid card data:', { rank: card.rank, suit: card.suit });
    return (
      <div 
        className={`${styles.playingCard} ${styles.error}`} 
        role="alert"
        data-testid={`card-error-${card.id}`}
      >
        Invalid card data
      </div>
    );
  }

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.dataTransfer.setData('card', JSON.stringify(card));
      e.dataTransfer.effectAllowed = 'move';
      if (propDragStart) propDragStart(e);
    },
    [card, disabled, propDragStart]
  );

  const handleDragEnd = useCallback(() => {
    if (propDragEnd) propDragEnd();
  }, [propDragEnd]);

  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleClick();
      }
    },
    [disabled, handleClick]
  );

  const { cardClasses, cardStyle } = useCardStyles(card, selected, index, style, disabled);

  // Add color class based on suit
  const colorClass = card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS ? styles.red : styles.black;
  const finalCardClasses = `${cardClasses} ${colorClass}`;

  const cardContent = !card.isFaceUp ? (
    <CardBack 
      backPattern={backPattern}
      backPrimaryColor={backPrimaryColor}
      backSecondaryColor={backSecondaryColor}
    />
  ) : error ? (
    <div className={styles.errorMessage} role="alert">
      {error || 'Failed to load card'}
    </div>
  ) : (
    <CardFace 
      isLoading={isLoading}
      card={card}
    />
  );

  return (
    <div
      className={finalCardClasses}
      onClick={handleClick}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={cardStyle}
      role="button"
      aria-label={!card.isFaceUp ? 'Face down card' : `${card.rank.toLowerCase()} of ${card.suit.toLowerCase()}`}
      aria-disabled={disabled}
      aria-pressed={selected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      id={id}
      data-testid={`card-${card.id}`}
    >
      <div className={styles.cardInner}>
        {cardContent}
      </div>
    </div>
  );
});

Card.displayName = 'Card'; 