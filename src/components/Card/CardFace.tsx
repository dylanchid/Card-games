import React, { memo } from 'react';
import { CardType, getCardColor, isFaceCard, Suit, Rank } from '../../types/card';
import styles from './Card.module.css';

interface CardFaceProps {
  isLoading: boolean;
  card: CardType;
}

const SuitSymbol: React.FC<{ suit: Suit; className?: string }> = ({ suit, className }) => {
  const symbols: Record<Suit, string> = {
    [Suit.HEARTS]: '♥',
    [Suit.DIAMONDS]: '♦',
    [Suit.CLUBS]: '♣',
    [Suit.SPADES]: '♠',
  };
  return <span className={`${styles.suitSymbol} ${className || ''}`}>{symbols[suit]}</span>;
};

const RankDisplay: React.FC<{ rank: Rank; className?: string }> = ({ rank, className }) => {
  const displayMap: Record<Rank, string> = {
    [Rank.ACE]: 'A',
    [Rank.KING]: 'K',
    [Rank.QUEEN]: 'Q',
    [Rank.JACK]: 'J',
    [Rank.TEN]: '10',
    [Rank.NINE]: '9',
    [Rank.EIGHT]: '8',
    [Rank.SEVEN]: '7',
    [Rank.SIX]: '6',
    [Rank.FIVE]: '5',
    [Rank.FOUR]: '4',
    [Rank.THREE]: '3',
    [Rank.TWO]: '2',
  };
  return <span className={`${styles.rankDisplay} ${className || ''}`}>{displayMap[rank]}</span>;
};

const getCardPattern = (rank: Rank): number[][] => {
  // Define patterns for each card rank
  const patterns: Record<Rank, number[][]> = {
    [Rank.ACE]: [[0, 1, 0]],
    [Rank.TWO]: [[1, 0, 1]],
    [Rank.THREE]: [[1, 0, 1], [0, 1, 0]],
    [Rank.FOUR]: [[1, 0, 1], [1, 0, 1]],
    [Rank.FIVE]: [[1, 0, 1], [0, 1, 0], [1, 0, 1]],
    [Rank.SIX]: [[1, 0, 1], [1, 0, 1], [1, 0, 1]],
    [Rank.SEVEN]: [[1, 0, 1], [1, 1, 1], [1, 0, 1]],
    [Rank.EIGHT]: [[1, 1, 1], [1, 0, 1], [1, 1, 1]],
    [Rank.NINE]: [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
    [Rank.TEN]: [[1, 1, 1], [1, 1, 1], [1, 1, 1], [0, 1, 0]],
    [Rank.JACK]: [[0]],  // Face cards don't use patterns
    [Rank.QUEEN]: [[0]], // Face cards don't use patterns
    [Rank.KING]: [[0]],  // Face cards don't use patterns
  };
  return patterns[rank] || [[0]];
};

const NumberCardPattern: React.FC<{ rank: Rank; suit: Suit }> = ({ rank, suit }) => {
  const pattern = getCardPattern(rank);
  
  return (
    <div className={styles.numberPattern}>
      {pattern.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.patternRow}>
          {row.map((show, colIndex) => (
            show ? (
              <SuitSymbol 
                key={`${rowIndex}-${colIndex}`} 
                suit={suit} 
                className={styles.patternSymbol} 
              />
            ) : (
              <span key={`${rowIndex}-${colIndex}`} className={styles.patternEmpty} />
            )
          ))}
        </div>
      ))}
    </div>
  );
};

const FaceCardContent: React.FC<{ rank: Rank; suit: Suit }> = ({ rank, suit }) => {
  const faceSymbols: Record<Rank, string> = {
    [Rank.KING]: '♔',
    [Rank.QUEEN]: '♕',
    [Rank.JACK]: '♖',
    [Rank.ACE]: '♠',
    [Rank.TWO]: '',
    [Rank.THREE]: '',
    [Rank.FOUR]: '',
    [Rank.FIVE]: '',
    [Rank.SIX]: '',
    [Rank.SEVEN]: '',
    [Rank.EIGHT]: '',
    [Rank.NINE]: '',
    [Rank.TEN]: '',
  };

  return (
    <div className={styles.faceCard}>
      <span className={styles.faceSymbol}>{faceSymbols[rank]}</span>
      <SuitSymbol suit={suit} className={styles.faceSuitSymbol} />
    </div>
  );
};

export const CardFace: React.FC<CardFaceProps> = memo(({ isLoading, card }) => {
  if (isLoading) {
    return <div className={styles.cardLoading} data-testid="card-loading" />;
  }

  const cardColor = getCardColor(card);
  const isFace = isFaceCard(card);

  return (
    <div 
      className={`${styles.cardFront} ${styles[cardColor.toLowerCase()]}`} 
      data-testid="card-face"
    >
      {/* Top left corner */}
      <div className={styles.topLeft}>
        <RankDisplay rank={card.rank} />
        <SuitSymbol suit={card.suit} />
      </div>

      {/* Center content */}
      <div className={styles.centerContent}>
        {isFace ? (
          <FaceCardContent rank={card.rank} suit={card.suit} />
        ) : (
          <NumberCardPattern rank={card.rank} suit={card.suit} />
        )}
      </div>

      {/* Bottom right corner (inverted) */}
      <div className={styles.bottomRight}>
        <RankDisplay rank={card.rank} />
        <SuitSymbol suit={card.suit} />
      </div>
    </div>
  );
});

CardFace.displayName = 'CardFace'; 