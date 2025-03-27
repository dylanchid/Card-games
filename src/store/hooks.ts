/**
 * @fileoverview Custom hooks for Redux store interactions
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { CardType, StackType } from '@/types/card';
import { useCallback } from 'react';
import { 
  setDraggingCard, 
  moveCard, 
  selectStackById,
  selectDraggingCard,
  selectDragSource
} from './slices/cardSlice';
import { GamePhase } from './slices/gameSlice';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook for accessing game state
 */
export const useGameState = () => {
  return useAppSelector(state => state.game);
};

/**
 * Hook for checking if it's the current player's turn
 */
export const useIsPlayerTurn = (playerId: string) => {
  const { playerIds, currentPlayerIndex } = useAppSelector(state => state.game);
  return playerIds[currentPlayerIndex] === playerId;
};

/**
 * Hook for checking the current game phase
 */
export const useGamePhase = (): GamePhase => {
  return useAppSelector(state => state.game.gamePhase);
};

/**
 * Hook for accessing card state
 */
export const useCardState = () => {
  return useAppSelector(state => state.cards);
};

/**
 * Hook for working with a specific card stack
 */
export const useStack = (stackId: string) => {
  const stack = useAppSelector(state => selectStackById(state, stackId));
  const dispatch = useAppDispatch();

  const handleCardDragStart = useCallback((card: CardType, e: React.DragEvent) => {
    dispatch(setDraggingCard({ card, source: stackId }));
  }, [dispatch, stackId]);

  return {
    stack,
    handleCardDragStart,
  };
};

/**
 * Hook for handling card dragging and dropping
 */
export const useDragDrop = () => {
  const dispatch = useAppDispatch();
  const draggingCard = useAppSelector(selectDraggingCard);
  const dragSource = useAppSelector(selectDragSource);

  const handleDrop = useCallback((targetStackId: string, position: number = -1) => {
    if (draggingCard && dragSource) {
      dispatch(moveCard({
        cardId: draggingCard.id,
        fromStack: dragSource,
        toStack: targetStackId,
        position: position < 0 ? 0 : position,
      }));
      
      // Clear dragging state
      dispatch(setDraggingCard({ card: null, source: null }));
    }
  }, [dispatch, draggingCard, dragSource]);

  const isValidDrop = useCallback((targetStackId: string): boolean => {
    // Implement your validation logic here
    return true;
  }, []);

  return {
    draggingCard,
    dragSource,
    handleDrop,
    isValidDrop,
  };
};

/**
 * Hook for accessing UI state
 */
export const useUIState = () => {
  return useAppSelector(state => state.ui);
};

/**
 * Hook for managing notifications
 */
export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(state => state.ui.notifications);
  
  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error', duration = 5000) => {
    dispatch({
      type: 'ui/addNotification',
      payload: {
        message,
        type,
        duration,
        autoDismiss: true,
      },
    });
  }, [dispatch]);
  
  const removeNotification = useCallback((id: string) => {
    dispatch({
      type: 'ui/removeNotification',
      payload: id,
    });
  }, [dispatch]);
  
  return {
    notifications,
    addNotification,
    removeNotification,
  };
}; 