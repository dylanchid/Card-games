import React, { useCallback, useState, Suspense } from 'react';
import { Stack } from './Stack';
import {
  StackType,
  CardType,
  validateStack,
  validatePosition,
  isValidCardMove,
  DEFAULT_CARD_MOVE_RULES
} from '../types/card';
import { ErrorBoundary } from './ErrorBoundary';
import './GameBoard.css';

interface GameBoardProps {
  stacks: StackType[];
  onCardMove: (card: CardType, sourceStackId: string, targetStackId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const GameBoardError: React.FC<{ error: Error }> = ({ error }) => (
  <div className="game-board-error">
    <h2>Something went wrong</h2>
    <p>{error.message}</p>
    <button onClick={() => window.location.reload()}>Reload Game</button>
  </div>
);

const GameBoardLoading: React.FC = () => (
  <div className="game-board-loading">
    <div className="loading-spinner" />
    <p>Loading game...</p>
  </div>
);

interface DragState {
  card: CardType | null;
  sourceStackId: string | null;
  targetStackId: string | null;
  isValidDrop: boolean;
}

export function GameBoard({ stacks, onCardMove, disabled = false, isLoading }: GameBoardProps) {
  const [error, setError] = useState<Error | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    card: null,
    sourceStackId: null,
    targetStackId: null,
    isValidDrop: false
  });

  const handleCardClick = useCallback((card: CardType, stackId: string) => {
    // Handle card click based on game state
    console.log('[GameBoard] Card clicked:', { card, stackId });
  }, []);

  const handleDragStart = useCallback((card: CardType, stackId: string) => {
    setDragState({
      card,
      sourceStackId: stackId,
      targetStackId: null,
      isValidDrop: false
    });
  }, []);

  const handleDragOver = useCallback((stackId: string) => {
    if (!dragState.card || dragState.sourceStackId === stackId) return;

    const sourceStack = stacks.find(s => s.id === dragState.sourceStackId);
    const targetStack = stacks.find(s => s.id === stackId);

    if (!sourceStack || !targetStack) return;

    // Validate if the move is allowed based on game rules
    const isValidMove = validateCardMove(dragState.card, sourceStack, targetStack);

    setDragState(prev => ({
      ...prev,
      targetStackId: stackId,
      isValidDrop: isValidMove
    }));
  }, [dragState, stacks]);

  const handleDragEnd = useCallback(() => {
    const { card, sourceStackId, targetStackId, isValidDrop } = dragState;

    if (card && sourceStackId && targetStackId && isValidDrop) {
      try {
        onCardMove(card, sourceStackId, targetStackId);
      } catch (error) {
        console.error('[GameBoard] Error during card move:', error);
      }
    }

    setDragState({
      card: null,
      sourceStackId: null,
      targetStackId: null,
      isValidDrop: false
    });
  }, [dragState, onCardMove]);

  const validateCardMove = (card: CardType, sourceStack: StackType, targetStack: StackType): boolean => {
    // Implement game-specific validation rules here
    // For example:
    // - Can't move cards from the deck
    // - Can only play cards of the same suit as the lead card
    // - Can only play face-up cards
    // - Can't move cards to the discard pile during certain game phases
    return true;
  };

  if (isLoading) {
    return <GameBoardLoading />;
  }

  if (error) {
    return <GameBoardError error={error} />;
  }

  return (
    <ErrorBoundary FallbackComponent={GameBoardError}>
      <div className="game-board w-full h-full">
        {stacks.map((stack) => (
          <Stack
            key={stack.id}
            stack={stack}
            onCardClick={(card: CardType) => handleCardClick(card, stack.id)}
            onDragStart={(card: CardType) => handleDragStart(card, stack.id)}
            onDragOver={() => handleDragOver(stack.id)}
            onDragEnd={handleDragEnd}
            isDragTarget={stack.id === dragState.targetStackId}
            isValidDrop={dragState.isValidDrop}
            disabled={disabled}
          />
        ))}
      </div>
    </ErrorBoundary>
  );
}
