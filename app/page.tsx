'use client';

import React, { useState } from 'react';
import GameLoader from '../src/components/GameLoader';
import GameProvider from '../src/components/GameProvider';
import GameBoard from '../src/components/GameBoard';
import PreGameScreen, { GameOptions } from '../src/components/PreGameScreen';
import { CardGame } from '../src/types/game';

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<CardGame | null>(null);
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [showPreGameScreen, setShowPreGameScreen] = useState(false);
  const [gameOptions, setGameOptions] = useState<GameOptions | null>(null);

  const handleGameSelected = (game: CardGame) => {
    setSelectedGame(game);
    setShowPreGameScreen(true);
  };

  const handleGameLoaded = (gameId: string) => {
    setIsGameLoaded(true);
    console.log(`Game ${gameId} loaded successfully`);
  };

  const handleGameStart = (options: GameOptions) => {
    setGameOptions(options);
    setShowPreGameScreen(false);
  };

  const handleBackToGameSelection = () => {
    setSelectedGame(null);
    setShowPreGameScreen(false);
    setGameOptions(null);
    setIsGameLoaded(false);
  };

  // Helper function to format game mode for display
  const getGameModeDisplay = (mode: string): string => {
    switch (mode) {
      case 'vs-computer': return 'Against Computer';
      case 'local': return 'Local Multiplayer';
      case 'ranked': return 'Ranked Match';
      default: return mode;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-8">Card Game Platform</h1>
      
      <GameLoader
        onGameSelected={handleGameSelected}
        onGameLoaded={handleGameLoaded}
      >
        {selectedGame && showPreGameScreen && (
          <PreGameScreen 
            game={selectedGame}
            onStart={handleGameStart}
            onBack={handleBackToGameSelection}
          />
        )}
        
        {selectedGame && !showPreGameScreen && gameOptions && (
          <GameProvider 
            initialGame={selectedGame} 
            gameOptions={gameOptions}
          >
            <div className="game-container w-full max-w-6xl">
              <div className="game-info mb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold">{selectedGame.name}</h2>
                  <p className="text-gray-600">{selectedGame.description}</p>
                </div>
                <button
                  onClick={handleBackToGameSelection}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Back to Games
                </button>
              </div>
              
              {isGameLoaded ? (
                <GameBoard className="shadow-lg" />
              ) : (
                <div className="game-board bg-green-800 rounded-xl p-8 shadow-lg min-h-[600px] flex flex-col items-center justify-center">
                  <p className="text-white">Loading game components...</p>
                </div>
              )}
              
              <div className="game-info mt-4">
                <div className="bg-white p-4 rounded shadow-md">
                  <h3 className="font-medium mb-2">Game Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold">Rules</h4>
                      <ul className="list-disc list-inside text-sm">
                        <li>Game Mode: {getGameModeDisplay(gameOptions.gameMode)}</li>
                        <li>Players: {gameOptions.playerCount}</li>
                        <li>Cards per player: {gameOptions.cardsPerPlayer}</li>
                        <li>Rounds: {gameOptions.maxRounds}</li>
                        {selectedGame.settings.specialRules?.bidding && <li>Includes bidding phase</li>}
                        {gameOptions.allowTrump && <li>Uses trump cards</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Players</h4>
                      <ul className="list-disc list-inside text-sm">
                        {gameOptions.playerNames.slice(0, gameOptions.playerCount).map((name, index) => (
                          <li key={index}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GameProvider>
        )}
      </GameLoader>
    </main>
  );
}
