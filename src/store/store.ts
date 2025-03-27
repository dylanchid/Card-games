import { configureStore, Middleware } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import cardReducer from './slices/cardSlice';
import uiReducer from './slices/uiSlice';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { gameMiddleware } from './middleware/gameMiddleware';
import { loggerMiddleware } from './middleware/loggerMiddleware';

// Define the root state type first
export type RootState = {
  game: ReturnType<typeof gameReducer>;
  cards: ReturnType<typeof cardReducer>;
  ui: ReturnType<typeof uiReducer>;
};

// Create the store with multiple reducers and middleware
export const store = configureStore({
  reducer: {
    game: gameReducer,
    cards: cardReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
      },
    })
    .concat(gameMiddleware as Middleware<unknown, RootState>)
    .concat(loggerMiddleware as Middleware<unknown, RootState>),
  devTools: process.env.NODE_ENV !== 'production',
});

// Define AppDispatch using the actual store
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 