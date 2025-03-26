import React from 'react';
import { Card } from './Card';
import { StackType, CardType } from '@/types/card';
import './Stack.css';

interface StackProps {
  stack: StackType;
  onDragStart: (card: CardType, stackId: string) => void;
  onDragOver: () => void;
  onDragEnd: () => void;
  isDragTarget: boolean;
  isValidDrop: boolean;
  disabled?: boolean;
  onCardClick?: (card: CardType) => void;
}

export function Stack({
  stack,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
  isValidDrop,
  disabled = false,
  onCardClick
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
    
    // Add visual feedback class
    e.currentTarget.classList.add('dragging-over');
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

  return (
    <div 
      className={stackClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="card-stack"
      data-stack-type={stack.type}
    >
      {stack.cards.map((card, index) => (
        <Card
          key={card.id}
          card={card}
          onDragStart={() => {
            if (!disabled) {
              onDragStart(card, stack.id);
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
          style={{
            transform: stack.type === 'hand' 
              ? `translateX(${index * 30}px)` 
              : `translateY(${index * 2}px)`,
            zIndex: stack.cards.length - index
          }}
          disabled={disabled}
          id={card.id}
        />
      ))}
    </div>
  );
}
