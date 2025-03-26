import React, { useCallback } from 'react';
import './Card.css';
import { CardType, Suit, Rank } from '../types/card';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, onClick, disabled = false, selected = false }) => {
  const getSuitSymbol = (suit: Suit): string => {
    switch (suit) {
      case Suit.DIAMONDS: return '♦';
      case Suit.HEARTS: return '♥';
      case Suit.SPADES: return '♠';
      case Suit.CLUBS: return '♣';
      default: return '';
    }
  };

  const getRankDisplay = (rank: Rank): string => {
    switch (rank) {
      case Rank.ACE: return 'A';
      case Rank.KING: return 'K';
      case Rank.QUEEN: return 'Q';
      case Rank.JACK: return 'J';
      case Rank.TEN: return '10';
      case Rank.NINE: return '9';
      case Rank.EIGHT: return '8';
      case Rank.SEVEN: return '7';
      case Rank.SIX: return '6';
      case Rank.FIVE: return '5';
      case Rank.FOUR: return '4';
      case Rank.THREE: return '3';
      case Rank.TWO: return '2';
      default: return '';
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.dataTransfer.setData('card', JSON.stringify(card));
    e.dataTransfer.effectAllowed = 'move';
  }, [card, disabled]);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const isRed = card.suit === Suit.DIAMONDS || card.suit === Suit.HEARTS;
  const suitSymbol = getSuitSymbol(card.suit);
  const displayRank = getRankDisplay(card.rank);
  const cardLabel = `${displayRank} of ${card.suit.toLowerCase()}`;

  return (
    <div
      className={`playing-card ${isRed ? 'red' : 'black'} ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${!card.isFaceUp ? 'face-down' : ''}`}
      onClick={handleClick}
      draggable={!disabled}
      onDragStart={handleDragStart}
      style={{
        left: `${card.position.x}px`,
        top: `${card.position.y}px`,
        zIndex: card.position.zIndex
      }}
      role="button"
      aria-label={cardLabel}
      aria-disabled={disabled}
      aria-pressed={selected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="card-inner">
        <div className="card-front">
          {/* Top left corner */}
          <div className="card-corner top-left">
            <div className="card-rank">{displayRank}</div>
            <div className="card-suit">{suitSymbol}</div>
          </div>

          {/* Center suit */}
          <div className="card-center">
            <div className="card-suit large">{suitSymbol}</div>
          </div>

          {/* Bottom right corner */}
          <div className="card-corner bottom-right">
            <div className="card-rank">{displayRank}</div>
            <div className="card-suit">{suitSymbol}</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 