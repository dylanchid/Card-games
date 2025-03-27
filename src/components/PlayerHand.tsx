import React, { useCallback, useState } from 'react';
import { Card } from './Card/Card';
import { CardType, GamePhaseType } from '@/types/card';
import './PlayerHand.css';

interface PlayerHandProps {
  cards: CardType[];
  onCardClick: (card: CardType) => void;
  selectedCards: CardType[];
  disabled?: boolean;
  phase?: GamePhaseType;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  onCardClick,
  selectedCards,
  disabled = false,
  phase = GamePhaseType.PLAYING
}) => {
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);

  const handleCardClick = useCallback(
    (card: CardType) => {
      if (!disabled) {
        onCardClick(card);
      }
    },
    [disabled, onCardClick]
  );

  const isCardSelected = useCallback(
    (card: CardType) => {
      return selectedCards.some(selectedCard => selectedCard.id === card.id);
    },
    [selectedCards]
  );

  const handleMouseEnter = (index: number) => {
    setHoveredCardIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredCardIndex(null);
  };

  // Sort cards by suit and rank for better organization
  const sortedCards = [...cards].sort((a, b) => {
    if (a.suit !== b.suit) {
      return a.suit.localeCompare(b.suit);
    }
    return a.rank.localeCompare(b.rank);
  });

  return (
    <div className={`player-hand ${disabled ? 'disabled' : ''}`}>
      {sortedCards.map((card, index) => {
        const selected = isCardSelected(card);
        const zIndex = hoveredCardIndex === index ? 100 : index;

        return (
          <div 
            key={card.id}
            className={`card-container ${selected ? 'selected' : ''}`}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            style={{ zIndex }}
          >
            <Card
              card={card}
              onClick={() => handleCardClick(card)}
              selected={selected}
              disabled={disabled}
              index={index}
            />
          </div>
        );
      })}
    </div>
  );
}; 