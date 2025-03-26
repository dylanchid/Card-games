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
  onCardMove: (card: CardType, fromStackId: string, toStackId: string) => void;
  disabled?: boolean;
  isLoading: boolean;
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

  const handleCardClick = useCallback(() => {
    if (disabled) return;
  }, [disabled]);

  const handleDragStart = useCallback((card: CardType, stackId: string) => {
    console.log('[GameBoard] Drag started:', { card, stackId });
    setDragState({
      card,
      sourceStackId: stackId,
      targetStackId: null,
      isValidDrop: false
    });
  }, []);

  const handleDragOver = useCallback((stackId: string) => {
    if (!dragState.card || !dragState.sourceStackId) return;

    const sourceStack = stacks.find(s => s.id === dragState.sourceStackId);
    const targetStack = stacks.find(s => s.id === stackId);

    if (!sourceStack || !targetStack) return;

    // Find applicable move rule
    const moveRule = DEFAULT_CARD_MOVE_RULES.find(
      rule => rule.fromStack === sourceStack.type && rule.toStack === targetStack.type
    );

    const isValidMove = moveRule ? moveRule.isValid(dragState.card, sourceStack, targetStack) : false;

    console.log('[GameBoard] Drag over:', {
      card: dragState.card,
      sourceStack: sourceStack.type,
      targetStack: targetStack.type,
      isValidMove
    });

    setDragState(prev => ({
      ...prev,
      targetStackId: stackId,
      isValidDrop: isValidMove
    }));
  }, [dragState.card, dragState.sourceStackId, stacks]);

  const handleDragEnd = useCallback(() => {
    const { card, sourceStackId, targetStackId, isValidDrop } = dragState;

    console.log('[GameBoard] Drag ended:', {
      card,
      sourceStackId,
      targetStackId,
      isValidDrop
    });

    if (card && sourceStackId && targetStackId && isValidDrop) {
      onCardMove(card, sourceStackId, targetStackId);
    }

    setDragState({
      card: null,
      sourceStackId: null,
      targetStackId: null,
      isValidDrop: false
    });
  }, [dragState, onCardMove]);

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
            onCardClick={handleCardClick}
            onDragStart={handleDragStart}
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
