'use client';

import React, { ReactNode, createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider } from 'next-themes';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';
import GameProvider from '../src/components/GameProvider';

// Game-specific context providers
interface GameContextType {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  currentPlayer: string;
  setCurrentPlayer: (player: string) => void;
}

const defaultGameContext: GameContextType = {
  isDragging: false,
  setIsDragging: () => {},
  currentPlayer: '',
  setCurrentPlayer: () => {},
};

export const GameContext = createContext<GameContextType>(defaultGameContext);

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
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
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
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
        <GameInteractionProvider>
          {children}
        </GameInteractionProvider>
      </ThemeProvider>
    </Provider>
  );
} 