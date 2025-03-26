import React, { useCallback } from 'react';
import { Card } from './Card';
import { CardType, GamePhase } from '@/types/card';
import './PlayerHand.css';

interface PlayerHandProps {
  cards: CardType[];
  phase: GamePhase;
  isCurrentTurn: boolean;
  selectedCards: CardType[];
  onCardSelect: (card: CardType) => void;
  maxSelectable: number;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  phase,
  isCurrentTurn,
  selectedCards,
  onCardSelect,
  maxSelectable
}) => {
  const isCardSelected = useCallback((card: CardType) => {
    return selectedCards.some(
      selected => selected.id === card.id
    );
  }, [selectedCards]);

  const isCardSelectable = useCallback((card: CardType) => {
    if (!isCurrentTurn) return false;
    if (phase === 'WAITING' || phase === 'SCORING') return false;

    if (phase === 'BIDDING') {
      // Can't select Joker for bidding
      if (card.rank === 'Joker') return false;
      // Can't select more than maxSelectable cards
      if (selectedCards.length >= maxSelectable && !isCardSelected(card)) return false;
      return true;
    }

    if (phase === 'PLAYING') {
      // Can only select one card during play phase
      if (selectedCards.length >= 1 && !isCardSelected(card)) return false;
      return true;
    }

    return false;
  }, [isCurrentTurn, phase, selectedCards.length, maxSelectable, isCardSelected]);

  const handleCardClick = useCallback((card: CardType) => {
    if (isCardSelectable(card)) {
      onCardSelect(card);
    }
  }, [isCardSelectable, onCardSelect]);

  return (
    <div className="player-hand">
      {cards.map((card, index) => (
        <div key={card.id} className="card-wrapper">
          <Card
            card={card}
            onClick={() => handleCardClick(card)}
            selectable={isCardSelectable(card)}
            selected={isCardSelected(card)}
            disabled={!isCardSelectable(card)}
            index={index}
            style={{
              transform: `translateX(${index * 30}px)`,
              zIndex: cards.length - index
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default PlayerHand; 