import React, { useCallback, useState, Suspense } from 'react';
import { Stack } from './Stack';
import { StackType, CardType, validateStack } from '../types/card';
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

export const GameBoard: React.FC<GameBoardProps> = ({
  stacks,
  onCardMove,
  disabled = false,
  isLoading = false
}) => {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleCardClick = useCallback((card: CardType) => {
    if (disabled) return;
    setSelectedCard(card);
  }, [disabled]);

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

      onCardMove(card, fromStack.id, toStackId);
      setSelectedCard(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to move card'));
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
              disabled={disabled}
            />
          ))}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}; 