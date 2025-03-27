'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { CardGame } from '../types/game';
import { useAppDispatch } from '../store/store';
import { GameOptions } from './PreGameScreen';
import { initializeNinetyNineGame } from '../utils/ninetyNineHelpers';

// Game context interface
interface GameContextType {
  currentGame: CardGame | null;
  gameState: any;
  isLoading: boolean;
  error: string | null;
  selectGame: (game: CardGame) => void;
  performAction: (action: string, playerId: string, payload?: any) => void;
  getAvailableActions: (playerId: string) => string[];
  getRequiredActions: (playerId: string) => string[];
  isValidAction: (action: string, playerId: string, payload?: any) => boolean;
  getGameUI: () => any;
  initializeGameWithOptions: (game: CardGame, options: GameOptions) => void;
}

// Create the context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider props
interface GameProviderProps {
  children: ReactNode;
  initialGame?: CardGame;
  gameOptions?: GameOptions;
}

// Game provider component
export const GameProvider: React.FC<GameProviderProps> = ({ children, initialGame, gameOptions }) => {
  const [currentGame, setCurrentGame] = useState<CardGame | null>(initialGame || null);
  const [gameState, setGameState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  // Initialize game state with options
  const initializeGameWithOptions = useCallback((game: CardGame, options: GameOptions) => {
    setIsLoading(true);
    setError(null);
    
    try {
      setCurrentGame(game);
      
      // Create initial game state with options
      let initialState;
      
      if (game.id === 'ninety-nine') {
        // Use specialized initialization for Ninety-Nine
        initialState = initializeNinetyNineGame(options);
      } else {
        // Use generic initialization for other games
        initialState = game.setup.createInitialState(
          Array.from({ length: options.playerCount }).map((_, i) => {
            // For vs-computer mode, set all players except the first as AI
            if (options.gameMode === 'vs-computer' && i > 0) {
              return `ai-player-${i}`;
            }
            return options.playerNames[i] || `player${i + 1}`;
          }),
          {
            maxRounds: options.maxRounds,
            cardsPerPlayer: options.cardsPerPlayer,
            timeLimit: options.timeLimit,
            gameMode: options.gameMode,
            specialRules: {
              trumps: options.allowTrump
            }
          }
        );
      }
      
      // Add game mode to the state
      initialState = {
        ...initialState,
        gameMode: options.gameMode,
        isRanked: options.gameMode === 'ranked',
        hasAI: options.gameMode === 'vs-computer'
      };
      
      setGameState(initialState);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to initialize game: ' + (err instanceof Error ? err.message : String(err)));
      setIsLoading(false);
    }
  }, []);

  // Initialize game state when a game is selected
  const selectGame = useCallback((game: CardGame) => {
    setIsLoading(true);
    setError(null);
    
    try {
      setCurrentGame(game);
      
      // Create initial game state
      const initialState = game.setup.createInitialState(
        // This would typically come from a lobby or player selection
        ['player1', 'player2', 'player3'], 
        game.settings
      );
      
      setGameState(initialState);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to initialize game: ' + (err instanceof Error ? err.message : String(err)));
      setIsLoading(false);
    }
  }, []);

  // Apply game options on mount if provided
  React.useEffect(() => {
    if (initialGame && gameOptions) {
      initializeGameWithOptions(initialGame, gameOptions);
    } else if (initialGame) {
      selectGame(initialGame);
    }
  }, [initialGame, gameOptions, selectGame, initializeGameWithOptions]);

  // Perform a game action
  const performAction = useCallback((action: string, playerId: string, payload?: any) => {
    if (!currentGame || !gameState) {
      setError('No game is currently active');
      return;
    }
    
    try {
      // Validate the action
      if (!currentGame.rules.validateAction(gameState, action, playerId, payload)) {
        setError(`Invalid action: ${action}`);
        return;
      }
      
      // Perform the action
      const updatedState = currentGame.actions.performAction(gameState, action, playerId, payload);
      setGameState(updatedState);
      
      // Check if the game is over
      if (currentGame.rules.isGameOver(updatedState)) {
        // Handle game over
        const winnerId = currentGame.rules.determineWinner(updatedState);
        console.log(`Game over! Winner: ${winnerId}`);
      }
    } catch (err) {
      setError('Error performing action: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [currentGame, gameState]);

  // Handle AI player turns when in vs-computer mode
  React.useEffect(() => {
    // Only handle AI turns in vs-computer mode when game is loaded
    if (gameState && gameState.hasAI && gameState.gameMode === 'vs-computer') {
      const currentPlayerId = gameState.playerIds[gameState.currentPlayerIndex];
      const currentPlayer = gameState.entities.players[currentPlayerId];
      
      // Check if current player is AI
      if (currentPlayer && currentPlayer.isAI) {
        // Add a small delay to make the AI moves feel more natural
        const aiMoveTimeout = setTimeout(() => {
          // Get available actions for the AI player
          const availableActions = gameState.actions.availableActions(gameState, currentPlayerId);
          
          if (availableActions.length > 0) {
            // Choose an action based on game phase
            if (gameState.gamePhase === 'bidding') {
              // Select cards for bidding - AI chooses randomly 1-3 cards from hand
              const handIds = currentPlayer.handIds;
              const numBidCards = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
              const bidCardIds = [];
              
              // Randomly select cards for bid
              const availableCards = [...handIds];
              for (let i = 0; i < numBidCards && availableCards.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * availableCards.length);
                bidCardIds.push(availableCards[randomIndex]);
                availableCards.splice(randomIndex, 1);
              }
              
              // Place the bid
              performAction('PLACE_BID', currentPlayerId, { cardIds: bidCardIds, playerId: currentPlayerId });
            } 
            else if (gameState.gamePhase === 'playing') {
              // AI plays a card - in a real implementation this would use more sophisticated logic
              // For now, just play the first valid card
              const handIds = currentPlayer.handIds;
              let cardToPlay = null;
              
              // Try each card until a valid one is found
              for (const cardId of handIds) {
                if (gameState.rules.isValidPlay(gameState, cardId, currentPlayerId)) {
                  cardToPlay = cardId;
                  break;
                }
              }
              
              if (cardToPlay) {
                performAction('PLAY_CARD', currentPlayerId, { cardId: cardToPlay, playerId: currentPlayerId });
              }
            }
          }
        }, 1500); // 1.5 second delay for AI moves
        
        return () => clearTimeout(aiMoveTimeout);
      }
    }
  }, [gameState, performAction]);

  // Get available actions for a player
  const getAvailableActions = useCallback((playerId: string) => {
    if (!currentGame || !gameState) return [];
    return currentGame.actions.availableActions(gameState, playerId);
  }, [currentGame, gameState]);

  // Get required actions for a player
  const getRequiredActions = useCallback((playerId: string) => {
    if (!currentGame || !gameState) return [];
    return currentGame.actions.requiredActions(gameState, playerId);
  }, [currentGame, gameState]);

  // Check if an action is valid
  const isValidAction = useCallback((action: string, playerId: string, payload?: any) => {
    if (!currentGame || !gameState) return false;
    return currentGame.rules.validateAction(gameState, action, playerId, payload);
  }, [currentGame, gameState]);

  // Get the game UI configuration
  const getGameUI = useCallback(() => {
    if (!currentGame) return null;
    return currentGame.ui;
  }, [currentGame]);

  // Context value
  const value = useMemo(() => ({
    currentGame,
    gameState,
    isLoading,
    error,
    selectGame,
    performAction,
    getAvailableActions,
    getRequiredActions,
    isValidAction,
    getGameUI,
    initializeGameWithOptions,
  }), [
    currentGame, 
    gameState, 
    isLoading, 
    error, 
    selectGame, 
    performAction, 
    getAvailableActions, 
    getRequiredActions, 
    isValidAction, 
    getGameUI,
    initializeGameWithOptions
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default GameProvider; 