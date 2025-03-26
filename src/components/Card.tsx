import React, { useCallback, useEffect, useState, memo } from 'react';
import './Card.css';
import { CardType, getCardColor, isFaceCard } from '../types/card';
import { loadCardAsset } from '../utils/assetLoader';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  index?: number;
}

export const Card: React.FC<CardProps> = memo(({ 
  card, 
  onClick, 
  disabled = false, 
  selected = false,
  index = 0 
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCard = async () => {
      try {
        setIsLoading(true);
        const content = await loadCardAsset(card.rank, card.suit);
        if (isMounted) {
          setSvgContent(content);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load card'));
          console.error('Failed to load card asset:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCard();

    return () => {
      isMounted = false;
    };
  }, [card.rank, card.suit]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.dataTransfer.setData('card', JSON.stringify(card));
    e.dataTransfer.effectAllowed = 'move';
  }, [card, disabled]);

  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  }, [disabled, handleClick]);

  const cardColor = getCardColor(card);
  const cardLabel = `${card.rank.toLowerCase()} of ${card.suit.toLowerCase()}`;
  const isFaceCardValue = isFaceCard(card);

  if (error) {
    return (
      <div 
        className={`playing-card error ${cardColor} ${disabled ? 'disabled' : ''}`}
        role="alert"
        aria-label={`Error loading ${cardLabel}`}
      >
        <div className="card-error-message">Failed to load card</div>
      </div>
    );
  }

  return (
    <div
      className={`playing-card ${cardColor} ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${!card.isFaceUp ? 'face-down' : ''} ${isFaceCardValue ? 'face-card' : ''}`}
      onClick={handleClick}
      draggable={!disabled}
      onDragStart={handleDragStart}
      style={{
        left: `${card.position.x}px`,
        top: `${card.position.y}px`,
        zIndex: card.position.zIndex + index,
        transform: `scale(2) ${selected ? 'translateY(-10px)' : ''}`
      }}
      role="button"
      aria-label={cardLabel}
      aria-disabled={disabled}
      aria-pressed={selected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      <div className="card-inner">
        <div className="card-front">
          {isLoading ? (
            <div className="card-loading" />
          ) : (
            <div 
              className="card-svg"
              dangerouslySetInnerHTML={{ __html: svgContent || '' }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

Card.displayName = 'Card'; 