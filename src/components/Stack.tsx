import React, { useCallback, useState } from 'react';
import { Card } from './Card';
import { StackType, CardType, isValidCardMove, validateStack } from '../types/card';
import './Stack.css';

interface StackProps {
  stack: StackType;
  onCardClick?: (card: CardType) => void;
  onCardDrop?: (card: CardType, stackId: string) => void;
  disabled?: boolean;
}

export const Stack: React.FC<StackProps> = ({
  stack,
  onCardClick,
  onCardDrop,
  disabled = false
}) => {
  const [isValidDropTarget, setIsValidDropTarget] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    const cardData = e.dataTransfer.getData('card');
    if (!cardData) return;
    
    try {
      const card = JSON.parse(cardData) as CardType;
      const isValid = isValidCardMove(card, { id: '', cards: [], position: { x: 0, y: 0, zIndex: 0 }, isFaceUp: true, type: 'hand' }, stack);
      setIsValidDropTarget(isValid);
      setDropError(isValid ? null : 'Invalid move');
    } catch (error) {
      setIsValidDropTarget(false);
      setDropError('Invalid card data');
    }
  }, [stack, disabled]);

  const handleDragLeave = useCallback(() => {
    setIsValidDropTarget(false);
    setDropError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !onCardDrop) return;
    
    const cardData = e.dataTransfer.getData('card');
    if (!cardData) return;
    
    try {
      const card = JSON.parse(cardData) as CardType;
      if (!validateStack(stack)) {
        throw new Error('Invalid stack state');
      }
      onCardDrop(card, stack.id);
      setIsValidDropTarget(false);
      setDropError(null);
    } catch (error) {
      console.error('Error handling card drop:', error);
      setDropError(error instanceof Error ? error.message : 'Invalid drop');
    }
  }, [stack.id, onCardDrop, disabled]);

  return (
    <div
      className={`card-stack ${stack.type} ${isValidDropTarget ? 'valid-drop' : ''} ${dropError ? 'invalid-drop' : ''}`}
      style={{
        left: `${stack.position.x}px`,
        top: `${stack.position.y}px`,
        zIndex: stack.position.zIndex
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {stack.cards.map((card, index) => (
        <div
          key={card.id}
          className="card-wrapper"
          style={{
            position: 'absolute',
            left: `${index * 5}px`,
            top: `${index * 5}px`,
            zIndex: index,
            transition: 'transform 0.3s ease'
          }}
        >
          <Card
            card={card}
            onClick={() => onCardClick?.(card)}
            disabled={disabled}
          />
        </div>
      ))}
      {dropError && (
        <div className="drop-error">
          {dropError}
        </div>
      )}
    </div>
  );
}; 