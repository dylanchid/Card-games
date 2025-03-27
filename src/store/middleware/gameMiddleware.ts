/**
 * @fileoverview Middleware for handling game-related side effects
 */

import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { setError, addNotification } from '../slices/uiSlice';

// The middleware is properly typed now with the correct return type
export const gameMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Type-safe check for action types
  if (
    typeof action === 'object' && 
    action !== null && 
    'type' in action && 
    typeof action.type === 'string' && 
    action.type.startsWith('game/')
  ) {
    const gameAction = action as { type: string; payload?: any };
    
    // Check for specific game actions
    if (
      gameAction.type === 'game/playCard' || 
      gameAction.type === 'game/completeTrick' ||
      gameAction.type === 'game/completeRound'
    ) {
      const state = store.getState() as RootState;
      
      // Check if game is over based on game state
      if (state.game.gamePhase === 'scoring') {
        // Game has ended - set UI state to show game over
        store.dispatch({
          type: 'ui/setCurrentView',
          payload: 'statistics'
        });
        
        // Show game over notification
        store.dispatch(addNotification({
          message: 'Game over! Check the scores to see the winner.',
          type: 'info',
          duration: 5000,
          autoDismiss: true
        }));
      }
    }
  }

  return result;
}; 