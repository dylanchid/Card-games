'use client';

import React, { useState } from 'react';
import { CardGame } from '../types/game';
import './PreGameScreen.css';

interface PreGameScreenProps {
  game: CardGame;
  onStart: (options: GameOptions) => void;
  onBack: () => void;
}

export interface GameOptions {
  playerCount: number;
  maxRounds: number;
  cardsPerPlayer: number;
  allowTrump: boolean;
  timeLimit: number;
  playerNames: string[];
  gameMode: 'vs-computer' | 'local' | 'ranked';
}

const PreGameScreen: React.FC<PreGameScreenProps> = ({ game, onStart, onBack }) => {
  const [options, setOptions] = useState<GameOptions>({
    playerCount: 3,
    maxRounds: game.settings.maxRounds,
    cardsPerPlayer: game.settings.cardsPerPlayer,
    allowTrump: game.settings.specialRules?.trumps || false,
    timeLimit: game.settings.timeLimit || 30,
    playerNames: Array(5).fill('').map((_, i) => `Player ${i + 1}`),
    gameMode: 'local',
  });

  const handleOptionChange = (key: keyof GameOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));

    // If player count changes, ensure we have the right number of player names
    if (key === 'playerCount') {
      setOptions(prev => {
        const updatedNames = [...prev.playerNames];
        while (updatedNames.length < value) {
          updatedNames.push(`Player ${updatedNames.length + 1}`);
        }
        return {
          ...prev,
          playerNames: updatedNames
        };
      });
    }
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    setOptions(prev => {
      const updatedNames = [...prev.playerNames];
      updatedNames[index] = name;
      return {
        ...prev,
        playerNames: updatedNames
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(options);
  };

  return (
    <div className="pre-game-screen bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">{game.name}</h2>
        <button 
          onClick={onBack}
          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
        >
          Back to Games
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="game-info">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Game Information</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="mb-3 text-gray-600">{game.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Players:</span>
                <span>{game.minPlayers}-{game.maxPlayers}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Standard Rounds:</span>
                <span>{game.settings.maxRounds}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Cards per Player:</span>
                <span>{game.settings.cardsPerPlayer}</span>
              </div>
              {game.settings.specialRules && (
                <div className="mt-3">
                  <span className="font-medium block mb-1">Special Rules:</span>
                  <ul className="list-disc list-inside text-sm text-gray-600 pl-2">
                    {game.settings.specialRules.bidding && (
                      <li>Includes bidding phase</li>
                    )}
                    {game.settings.specialRules.trumps && (
                      <li>Uses trump cards</li>
                    )}
                    {game.settings.specialRules.partnerships && (
                      <li>Supports partnerships</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="game-options">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Game Options</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Game Mode</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={options.gameMode}
                onChange={(e) => handleOptionChange('gameMode', e.target.value)}
              >
                <option value="local">Local Multiplayer</option>
                <option value="vs-computer">vs Computer</option>
                <option value="ranked">Ranked Match</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Number of Players</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={options.playerCount}
                onChange={(e) => handleOptionChange('playerCount', parseInt(e.target.value))}
              >
                {Array.from({ length: game.maxPlayers - game.minPlayers + 1 }, (_, i) => i + game.minPlayers).map(num => (
                  <option key={num} value={num}>{num} Players</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Max Rounds</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={options.maxRounds}
                onChange={(e) => handleOptionChange('maxRounds', parseInt(e.target.value))}
              >
                {[3, 6, 9, 12].map(num => (
                  <option key={num} value={num}>{num} Rounds</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Time Limit per Turn</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={options.timeLimit}
                onChange={(e) => handleOptionChange('timeLimit', parseInt(e.target.value))}
              >
                <option value={0}>No Limit</option>
                <option value={15}>15 Seconds</option>
                <option value={30}>30 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={options.allowTrump}
                  onChange={(e) => handleOptionChange('allowTrump', e.target.checked)}
                  className="rounded"
                />
                <span>Allow Trump Cards</span>
              </label>
            </div>
          </form>
        </div>
      </div>
      
      <div className="player-names mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Player Names</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: options.playerCount }, (_, i) => (
            <div key={i} className="form-group">
              <label className="block text-sm font-medium mb-1">Player {i + 1}</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded-md"
                value={options.playerNames[i]}
                onChange={(e) => handlePlayerNameChange(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button 
          onClick={handleSubmit}
          className="start-button px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-lg transition-colors"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default PreGameScreen; 