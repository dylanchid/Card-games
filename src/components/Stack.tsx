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
  onCardClick?: () => void;
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
    onDragOver();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragEnd();
  };

  return (
    <div 
      className={stackClasses}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-testid="card-stack"
    >
      {stack.cards.map((card, index) => (
        <Card
          key={card.id}
          card={card}
          onDragStart={() => onDragStart(card, stack.id)}
          onDragEnd={onDragEnd}
          onClick={onCardClick}
          style={{
            transform: stack.type === 'hand' 
              ? `translateX(${index * 30}px)` 
              : `translateY(${index * 2}px)`,
            zIndex: stack.cards.length - index
          }}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
