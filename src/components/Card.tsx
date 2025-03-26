import React, { useCallback, useEffect, useState, memo } from 'react';
import './Card.css';
import { CardType, getCardColor, isFaceCard, Suit, Rank } from '../types/card';
import { loadCardAsset, isValidCardAsset } from '../utils/assetLoader';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  disabled?: boolean;
  selected?: boolean;
  index?: number;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = memo(
  ({ card, onClick, onDragStart: propDragStart, onDragEnd: propDragEnd, disabled = false, selected = false, index = 0, style }) => {
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      console.log(`[Card] Mounting/Updating card:`, {
        rank: card.rank,
        suit: card.suit,
        isFaceUp: card.isFaceUp,
        position: card.position,
        index
      });

      let isMounted = true;

      const loadCard = async () => {
        try {
          setIsLoading(true);
          // Validate card data
          if (!isValidCardAsset(card.rank as Rank, card.suit as Suit)) {
            throw new Error('Invalid card data');
          }

          console.log(`[Card] Starting to load card asset for ${card.rank} of ${card.suit}`);
          const content = await loadCardAsset(card.rank as Rank, card.suit as Suit);
          console.log(`[Card] Successfully loaded SVG content for ${card.rank} of ${card.suit}`);
          if (isMounted) {
            setSvgContent(content);
            setError(null);
          }
        } catch (err) {
          console.error(`[Card] Failed to load card asset for ${card.rank} of ${card.suit}:`, err);
          if (isMounted) {
            setError(err instanceof Error ? err : new Error('Failed to load card'));
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      if (card.isFaceUp) {
        loadCard();
      }

      return () => {
        console.log(`[Card] Unmounting card: ${card.rank} of ${card.suit}`);
        isMounted = false;
      };
    }, [card.rank, card.suit, card.isFaceUp, card.position, index]);

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

    const getCardClasses = () => {
      const classes = [
        'playing-card',
        getCardColor(card),
        selected && 'selected',
        disabled && 'disabled',
        !card.isFaceUp && 'face-down',
        isFaceCard(card) && 'face-card',
        error && 'error'
      ].filter(Boolean).join(' ');
      
      console.log(`[Card] Generated classes for ${card.rank} of ${card.suit}:`, classes);
      return classes;
    };

    const cardStyle = {
      transform: [
        card.position.x ? `translateX(${card.position.x}px)` : '',
        card.position.y ? `translateY(${card.position.y}px)` : '',
        selected ? 'translateY(-10px)' : '',
        !card.position.x && !card.position.y && !selected ? 'scale(1)' : ''
      ].filter(Boolean).join(' '),
      zIndex: card.position.zIndex + index,
      ...style
    };

    if (!card.isFaceUp) {
      return (
        <div
          className={getCardClasses()}
          onClick={handleClick}
          draggable={!disabled}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={cardStyle}
          role="button"
          aria-label={`Face down card`}
          aria-disabled={disabled}
          aria-pressed={selected}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
        >
          <div className="card-inner">
            <div className="card-back" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div
          className={getCardClasses()}
          onClick={handleClick}
          draggable={!disabled}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={cardStyle}
          role="button"
          aria-label={`${card.rank.toLowerCase()} of ${card.suit.toLowerCase()} - Failed to load card`}
          aria-disabled={disabled}
          aria-pressed={selected}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
        >
          <div className="card-inner">
            <div className="card-error-message" role="alert">Failed to load card</div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={getCardClasses()}
        onClick={handleClick}
        draggable={!disabled}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={cardStyle}
        role="button"
        aria-label={`${card.rank.toLowerCase()} of ${card.suit.toLowerCase()}`}
        aria-disabled={disabled}
        aria-pressed={selected}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        <div className="card-inner">
          <div className="card-front">
            {isLoading ? (
              <div className="card-loading" data-testid="card-loading" />
            ) : (
              <div className="card-svg" data-testid="card-svg" dangerouslySetInnerHTML={{ __html: svgContent || '' }} />
            )}
          </div>
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';
