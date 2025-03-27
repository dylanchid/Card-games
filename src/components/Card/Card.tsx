import React, { useCallback, memo } from 'react';
import { CardType, getCardColor, isFaceCard, Suit, Rank } from '../../types/card';
import { CardFace } from './CardFace';
import { CardBack } from './CardBack';
import { useCardStyles } from './useCardStyles';
import styles from './Card.module.css';

export interface CardProps {
  card: CardType;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  disabled?: boolean;
  selected?: boolean;
  index?: number;
  style?: React.CSSProperties;
  id?: string;
}

export const Card: React.FC<CardProps> = memo(
  ({ 
    card, 
    onClick, 
    onDragStart: propDragStart, 
    onDragEnd: propDragEnd, 
    disabled = false, 
    selected = false, 
    index = 0, 
    style,
    id 
  }) => {
    // Type validation
    if (!Object.values(Suit).includes(card.suit as Suit) || !Object.values(Rank).includes(card.rank as Rank)) {
      console.error('[Card] Invalid card data:', { rank: card.rank, suit: card.suit });
      return (
        <div className={`${styles.playingCard} ${styles.error}`} role="alert">
          Invalid card data
        </div>
      );
    }

    const handleDragStart = useCallback(
      (e: React.DragEvent) => {
        if (disabled) return;
        e.dataTransfer.setData('card', JSON.stringify(card));
        e.dataTransfer.effectAllowed = 'move';
        if (propDragStart) propDragStart();
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
    const colorClass = getCardColor(card) === 'red' ? styles.red : styles.black;
    const finalCardClasses = `${cardClasses} ${colorClass}`;

    const cardContent = !card.isFaceUp ? (
      <CardBack />
    ) : card.error ? (
      <div className={styles.errorMessage} role="alert">
        {card.error || 'Failed to load card'}
      </div>
    ) : (
      <CardFace 
        isLoading={card.isLoading || false}
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
      >
        <div className={styles.cardInner}>
          {cardContent}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card'; 