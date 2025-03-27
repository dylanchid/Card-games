import React, { useCallback } from 'react';
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

  return (
    <div className="player-hand">
      {cards.map((card, index) => {
        const offset = index * 30;
        const selected = isCardSelected(card);

        return (
          <Card
            key={card.id}
            card={card}
            onClick={() => handleCardClick(card)}
            selected={selected}
            disabled={disabled}
            index={index}
            style={{
              transform: `translateX(${offset}px)`,
              zIndex: index,
            }}
          />
        );
      })}
    </div>
  );
}; 