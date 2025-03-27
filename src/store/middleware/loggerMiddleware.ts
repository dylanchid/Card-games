/**
 * @fileoverview Middleware for logging actions and state changes
 */

import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

type LoggableAction = AnyAction & {
  type: string;
  payload?: any;
};

/**
 * Middleware that logs actions and state for debugging purposes
 * Only active in development mode
 */
export const loggerMiddleware: Middleware<{}, RootState> = store => next => (action: LoggableAction) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`Action: ${action.type}`);
    console.log('Payload:', action.payload);
    console.log('Previous State:', store.getState());
    const result = next(action);
    console.log('Next State:', store.getState());
    console.groupEnd();
    return result;
  }
  
  return next(action);
}; 