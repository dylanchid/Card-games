import React, { CSSProperties } from 'react';
import { Card } from './Card/Card';
import { StackType, CardType } from '@/types/card';
import './Stack.css';

interface StackProps {
  stack: StackType;
  onDragStart: (card: CardType, stackId: string, e: React.DragEvent) => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  isDragTarget: boolean;
  isValidDrop: boolean;
  disabled?: boolean;
  onCardClick?: (card: CardType) => void;
  id?: string;
}

export function Stack({
  stack,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
  isValidDrop,
  disabled = false,
  onCardClick,
  id
}: StackProps) {
  const stackClasses = [
    'card-stack',
    stack.type,
    isDragTarget && (isValidDrop ? 'valid-drop' : 'invalid-drop'),
    disabled && 'disabled'
  ].filter(Boolean).join(' ');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual feedback class
    e.currentTarget.classList.remove('dragging-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual feedback class
    e.currentTarget.classList.remove('dragging-over');
    onDragEnd();
  };

  // Calculate card positioning based on stack type
  const getCardStyle = (index: number, totalCards: number): CSSProperties => {
    if (stack.type === 'deck') {
      // For deck, stack cards with a minimal offset and ensure proper layering
      return {
        position: 'absolute',
        top: index * 0.2,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'none',
        zIndex: totalCards - index,
      } as CSSProperties;
    } else if (stack.type === 'hand') {
      // For hand, spread cards horizontally
      return {
        position: 'relative',
        transform: `translateX(${index * 30}px)`,
        zIndex: totalCards - index
      } as CSSProperties;
    } else {
      // For other stacks (like table)
      return {
        position: 'absolute',
        transform: `translate(-50%, -50%) translateY(${index * 2}px)`,
        top: '50%',
        left: '50%',
        zIndex: totalCards - index
      } as CSSProperties;
    }
  };

  return (
    <div 
      className={stackClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="card-stack"
      data-stack-type={stack.type}
      id={id}
    >
      {stack.cards.map((card, index) => (
        <Card
          key={card.id}
          card={card}
          onDragStart={(e: React.DragEvent) => {
            if (!disabled) {
              onDragStart(card, stack.id, e);
              // Add dragging class to the card
              const cardElement = document.getElementById(card.id);
              if (cardElement) {
                cardElement.classList.add('dragging');
              }
            }
          }}
          onDragEnd={() => {
            onDragEnd();
            // Remove dragging class from the card
            const cardElement = document.getElementById(card.id);
            if (cardElement) {
              cardElement.classList.remove('dragging');
            }
          }}
          onClick={() => onCardClick?.(card)}
          style={getCardStyle(index, stack.cards.length)}
          disabled={disabled}
          id={card.id}
        />
      ))}
    </div>
  );
}
