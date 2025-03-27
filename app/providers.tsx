'use client';

import React, { ReactNode, createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider } from 'next-themes';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';
import { GameProvider } from '../src/components/GameProvider';

// Game interaction context for drag and drop operations
interface GameInteractionContextType {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  currentPlayer: string;
  setCurrentPlayer: (player: string) => void;
}

const defaultGameInteractionContext: GameInteractionContextType = {
  isDragging: false,
  setIsDragging: () => {},
  currentPlayer: '',
  setCurrentPlayer: () => {},
};

export const GameInteractionContext = createContext<GameInteractionContextType>(defaultGameInteractionContext);

export function useGameInteractionContext() {
  const context = useContext(GameInteractionContext);
  if (!context) {
    throw new Error('useGameInteractionContext must be used within a GameInteractionProvider');
  }
  return context;
}

export function GameInteractionProvider({ children }: { children: ReactNode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState('');

  const value = useMemo(
    () => ({
      isDragging,
      setIsDragging,
      currentPlayer,
      setCurrentPlayer,
    }),
    [isDragging, currentPlayer]
  );

  return (
    <GameInteractionContext.Provider value={value}>
      {children}
    </GameInteractionContext.Provider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <GameProvider>
          <GameInteractionProvider>
            {children}
          </GameInteractionProvider>
        </GameProvider>
      </ThemeProvider>
    </Provider>
  );
} 