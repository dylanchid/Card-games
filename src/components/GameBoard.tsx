import React, { useCallback, useState, Suspense, useMemo } from 'react';
import { Stack } from './Stack';
import { StackType, CardType, validateStack, validateCardPosition, isValidCardMove } from '../types/card';
import { ErrorBoundary } from './ErrorBoundary';
import './GameBoard.css';

interface GameBoardProps {
  stacks: StackType[];
  onCardMove?: (card: CardType, fromStackId: string, toStackId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const GameBoardError: React.FC<{ error: Error }> = ({ error }) => (
  <div className="game-board-error">
    <h2>Something went wrong</h2>
    <p>{error.message}</p>
    <button onClick={() => window.location.reload()}>
      Reload Game
    </button>
  </div>
);

const GameBoardLoading: React.FC = () => (
  <div className="game-board-loading">
    <div className="loading-spinner" />
    <p>Loading game...</p>
  </div>
);

interface DragState {
  stackId: string | null;
  isValid: boolean;
  card: CardType | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  stacks,
  onCardMove,
  disabled = false,
  isLoading = false
}) => {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    stackId: null,
    isValid: false,
    card: null
  });

  // Memoize stack positions and validation rules
  const stackPositions = useMemo(() => {
    return stacks.reduce((acc, stack) => {
      acc[stack.id] = {
        x: stack.position.x,
        y: stack.position.y,
        width: 100,
        height: 150
      };
      return acc;
    }, {} as Record<string, { x: number; y: number; width: number; height: number }>);
  }, [stacks]);

  const handleCardClick = useCallback((card: CardType) => {
    if (disabled) return;
    setSelectedCard(card);
  }, [disabled]);

  const handleDragStart = useCallback((card: CardType) => {
    if (disabled) return;
    setDragState(prev => ({ ...prev, card }));
  }, [disabled]);

  const handleDragOver = useCallback((stackId: string) => {
    if (!dragState.card) return;

    const fromStack = stacks.find(stack => stack.id === dragState.card?.stackId);
    const toStack = stacks.find(stack => stack.id === stackId);

    if (!fromStack || !toStack) return;

    const isValid = isValidCardMove(dragState.card, fromStack, toStack);
    setDragState(prev => ({ ...prev, stackId, isValid }));
  }, [stacks, dragState.card]);

  const handleDragLeave = useCallback(() => {
    setDragState(prev => ({ ...prev, stackId: null, isValid: false }));
  }, []);

  const handleCardDrop = useCallback((card: CardType, toStackId: string) => {
    if (disabled || !onCardMove) return;
    
    try {
      const fromStack = stacks.find(stack => stack.id === card.stackId);
      if (!fromStack) {
        throw new Error('Source stack not found');
      }

      if (!validateStack(fromStack)) {
        throw new Error('Invalid source stack state');
      }

      const toStack = stacks.find(stack => stack.id === toStackId);
      if (!toStack) {
        throw new Error('Target stack not found');
      }

      if (!validateStack(toStack)) {
        throw new Error('Invalid target stack state');
      }

      if (!validateCardPosition(card, toStack)) {
        throw new Error('Invalid card position');
      }

      if (!isValidCardMove(card, fromStack, toStack)) {
        throw new Error('Invalid move according to game rules');
      }

      onCardMove(card, fromStack.id, toStackId);
      setSelectedCard(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to move card'));
    } finally {
      setDragState({ stackId: null, isValid: false, card: null });
    }
  }, [stacks, onCardMove, disabled]);

  if (isLoading) {
    return <GameBoardLoading />;
  }

  if (error) {
    return <GameBoardError error={error} />;
  }

  return (
    <ErrorBoundary FallbackComponent={GameBoardError}>
      <div className="game-board">
        <Suspense fallback={<GameBoardLoading />}>
          {stacks.map(stack => (
            <Stack
              key={stack.id}
              stack={stack}
              onCardClick={handleCardClick}
              onCardDrop={handleCardDrop}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              isDragOver={dragState.stackId === stack.id}
              isValidDrop={dragState.isValid}
              disabled={disabled}
            />
          ))}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}; 