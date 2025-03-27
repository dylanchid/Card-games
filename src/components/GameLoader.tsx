'use client';

import React, { useState, useEffect } from 'react';
import { useGameRegistry } from '../store/gameRegistry';
import { CardGame } from '../types/game';
import { useAppDispatch } from '../store/store';
import { registerNinetyNineGame } from '../games/ninetyNine';
import { registerHeartsGame } from '../games/hearts';

interface GameLoaderProps {
  selectedGameId?: string;
  onGameSelected: (game: CardGame) => void;
  onGameLoaded: (gameId: string) => void;
  children?: React.ReactNode;
}

export const GameLoader: React.FC<GameLoaderProps> = ({
  selectedGameId,
  onGameSelected,
  onGameLoaded,
  children,
}) => {
  const [availableGames, setAvailableGames] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<CardGame | null>(null);
  const registry = useGameRegistry();
  const dispatch = useAppDispatch();

  // Register available games
  useEffect(() => {
    try {
      // Register the Ninety-Nine game
      registerNinetyNineGame(registry);
      
      // Register the Hearts game
      registerHeartsGame(registry);
      
      // Add more game registrations here as they are developed
      // registerPokerGame(registry);
      // registerBridgeGame(registry);
      // etc.
      
      // Get all available games
      const games = registry.getAvailableGames();
      setAvailableGames(games);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to register games: ' + (err instanceof Error ? err.message : String(err)));
      setIsLoading(false);
    }
  }, [registry]);

  // Load selected game
  useEffect(() => {
    if (selectedGameId && !selectedGame) {
      try {
        const game = registry.createGame(selectedGameId);
        setSelectedGame(game);
        onGameSelected(game);
      } catch (err) {
        setError('Failed to load game: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  }, [selectedGameId, registry, selectedGame, onGameSelected]);

  // Notify when game is fully loaded
  useEffect(() => {
    if (selectedGame) {
      onGameLoaded(selectedGame.id);
    }
  }, [selectedGame, onGameLoaded]);

  const handleSelectGame = (gameId: string) => {
    try {
      const game = registry.createGame(gameId);
      setSelectedGame(game);
      onGameSelected(game);
    } catch (err) {
      setError('Failed to select game: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (isLoading) {
    return <div className="loading">Loading games...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (selectedGame) {
    return <>{children}</>;
  }

  return (
    <div className="game-selector">
      <h2 className="text-2xl font-bold mb-4">Select a Game</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableGames.map(game => (
          <div
            key={game.id}
            className="game-card p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => handleSelectGame(game.id)}
          >
            <h3 className="text-lg font-medium">{game.name}</h3>
            <p className="text-sm text-gray-600 mt-2">{game.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameLoader; 