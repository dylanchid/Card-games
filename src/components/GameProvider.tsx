'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { CardGame, NinetyNineGameState } from '../types/game';
import { CardType } from '../types/card';
import { useAppDispatch } from '../store/store';
import { GameOptions } from './PreGameScreen';
import { initializeNinetyNineGame } from '../utils/ninetyNineHelpers';

// Game context interface
interface GameContextType {
  currentGame: CardGame | null;
  gameState: NinetyNineGameState | null;
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
  const [gameState, setGameState] = useState<NinetyNineGameState | null>(null);
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
          // Get AI strategy based on difficulty level
          const aiLevel = currentPlayer.aiLevel || 'medium';
          const aiStrategy = getAIStrategy(aiLevel);
          
          // Let the AI strategy determine and execute the next move
          aiStrategy.makeMove(currentGame, gameState, currentPlayerId, performAction);
        }, 1500); // 1.5 second delay for AI moves
        
        return () => clearTimeout(aiMoveTimeout);
      }
    }
  }, [gameState, performAction, currentGame]);

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

// Export GameProvider as default
export default GameProvider;

// AI Strategy pattern implementation
interface AIStrategy {
  makeMove: (game: CardGame | null, state: NinetyNineGameState, playerId: string, performAction: (action: string, playerId: string, payload?: any) => void) => void;
}

// Easy AI Strategy - Makes random valid moves
const easyAIStrategy: AIStrategy = {
  makeMove: (game, state, playerId, performAction) => {
    if (!game || !state) return;
    
    // Get available actions for the AI player
    const availableActions = game.actions.availableActions(state, playerId);
    
    if (availableActions.length > 0) {
      // Choose an action based on game phase
      if (state.gamePhase === 'bidding') {
        // Select cards for bidding - AI chooses randomly 1-3 cards from hand
        const handIds = state.entities.players[playerId].handIds;
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
        performAction('PLACE_BID', playerId, { cardIds: bidCardIds, playerId });
      } 
      else if (state.gamePhase === 'playing') {
        // Play the first valid card found
        const handIds = state.entities.players[playerId].handIds;
        let cardToPlay = null;
        
        // Try each card until a valid one is found
        for (const cardId of handIds) {
          if (game.rules.isValidPlay(state, cardId, playerId)) {
            cardToPlay = cardId;
            break;
          }
        }
        
        if (cardToPlay) {
          performAction('PLAY_CARD', playerId, { cardId: cardToPlay, playerId });
        }
      }
    }
  }
};

// Medium AI Strategy - Makes more intelligent choices based on game state
const mediumAIStrategy: AIStrategy = {
  makeMove: (game, state, playerId, performAction) => {
    if (!game || !state) return;
    
    const availableActions = game.actions.availableActions(state, playerId);
    
    if (availableActions.length > 0) {
      if (state.gamePhase === 'bidding') {
        // Select cards that might form special combinations
        const player = state.entities.players[playerId];
        const handIds = player.handIds;
        const hand = handIds.map(id => state.entities.cards[id]);
        
        // Try to find a marriage (King + Queen of same suit)
        const marriages = findMarriages(hand);
        if (marriages.length > 0) {
          const marriageCards = marriages[0];
          performAction('PLACE_BID', playerId, { cardIds: marriageCards.map(card => card.id), playerId });
          return;
        }
        
        // Or pick 1-3 reasonable cards
        const bidCards = selectReasonableBidCards(hand, 2);
        performAction('PLACE_BID', playerId, { cardIds: bidCards.map(card => card.id), playerId });
      } 
      else if (state.gamePhase === 'playing') {
        // Play strategically based on current trick and game state
        const player = state.entities.players[playerId];
        const handIds = player.handIds;
        const hand = handIds.map(id => state.entities.cards[id]);
        
        // Determine the best card to play
        const bestCardId = findBestCardToPlay(game, state, hand, playerId);
        
        if (bestCardId) {
          performAction('PLAY_CARD', playerId, { cardId: bestCardId, playerId });
        } else {
          // Fallback to playing any valid card
          for (const cardId of handIds) {
            if (game.rules.isValidPlay(state, cardId, playerId)) {
              performAction('PLAY_CARD', playerId, { cardId, playerId });
              break;
            }
          }
        }
      }
    }
  }
};

// Hard AI Strategy - Makes sophisticated moves analyzing all available information
const hardAIStrategy: AIStrategy = {
  makeMove: (game, state, playerId, performAction) => {
    if (!game || !state) return;
    
    const availableActions = game.actions.availableActions(state, playerId);
    
    if (availableActions.length > 0) {
      if (state.gamePhase === 'bidding') {
        // Analyze hand and determine optimal bidding strategy
        const player = state.entities.players[playerId];
        const handIds = player.handIds;
        const hand = handIds.map(id => state.entities.cards[id]);
        
        const optimalBid = determineOptimalBid(hand, state);
        performAction('PLACE_BID', playerId, { cardIds: optimalBid, playerId });
      } 
      else if (state.gamePhase === 'playing') {
        // Use advanced logic to determine the best card to play
        const player = state.entities.players[playerId];
        const handIds = player.handIds;
        const hand = handIds.map(id => state.entities.cards[id]);
        
        // Advanced card selection algorithm
        const bestCardId = calculateOptimalPlay(game, state, hand, playerId);
        
        if (bestCardId) {
          performAction('PLAY_CARD', playerId, { cardId: bestCardId, playerId });
        }
      }
    }
  }
};

// Helper functions for AI strategies
function getAIStrategy(level: string): AIStrategy {
  switch (level) {
    case 'easy':
      return easyAIStrategy;
    case 'hard':
      return hardAIStrategy;
    case 'medium':
    default:
      return mediumAIStrategy;
  }
}

// Find King+Queen pairs of the same suit
function findMarriages(hand: CardType[]): CardType[][] {
  const marriages: CardType[][] = [];
  
  // Group cards by suit
  const suits: {[key: string]: CardType[]} = {};
  hand.forEach(card => {
    if (!suits[card.suit]) suits[card.suit] = [];
    suits[card.suit].push(card);
  });
  
  // Check each suit for King and Queen
  Object.values(suits).forEach(suitCards => {
    const king = suitCards.find(card => card.rank === 'KING');
    const queen = suitCards.find(card => card.rank === 'QUEEN');
    
    if (king && queen) {
      marriages.push([king, queen]);
    }
  });
  
  return marriages;
}

// Select reasonable bid cards based on card values
function selectReasonableBidCards(hand: CardType[], count: number): CardType[] {
  // Sort cards by their value (face cards are more valuable)
  const sortedHand = [...hand].sort((a, b) => {
    const valueMap: {[key: string]: number} = {
      'ACE': 14, 'KING': 13, 'QUEEN': 12, 'JACK': 11,
      'TEN': 10, 'NINE': 9, 'EIGHT': 8, 'SEVEN': 7,
      'SIX': 6, 'FIVE': 5, 'FOUR': 4, 'THREE': 3, 'TWO': 2
    };
    return (valueMap[b.rank] || 0) - (valueMap[a.rank] || 0);
  });
  
  // Take the top N cards
  return sortedHand.slice(0, Math.min(count, sortedHand.length));
}

// Find the best card to play based on current game state
function findBestCardToPlay(game: CardGame | null, state: NinetyNineGameState, hand: CardType[], playerId: string): string | null {
  if (!game) return null;
  
  const validCards = hand.filter(card => 
    game.rules.isValidPlay(state, card.id, playerId)
  );
  
  if (validCards.length === 0) return null;
  
  // If leading, play highest card
  if (state.currentTrickLeader === state.playerIds.indexOf(playerId)) {
    // Sort by rank (highest first)
    const sortedCards = [...validCards].sort((a, b) => {
      const valueMap: {[key: string]: number} = {
        'ACE': 14, 'KING': 13, 'QUEEN': 12, 'JACK': 11,
        'TEN': 10, 'NINE': 9, 'EIGHT': 8, 'SEVEN': 7, 
        'SIX': 6, 'FIVE': 5, 'FOUR': 4, 'THREE': 3, 'TWO': 2
      };
      return (valueMap[b.rank] || 0) - (valueMap[a.rank] || 0);
    });
    
    return sortedCards[0].id;
  } 
  
  // If not leading, play lowest card that follows suit
  const leadSuit = state.currentTrickSuit;
  const followingSuitCards = validCards.filter(card => card.suit === leadSuit);
  
  if (followingSuitCards.length > 0) {
    // Sort by rank (lowest first)
    const sortedCards = [...followingSuitCards].sort((a, b) => {
      const valueMap: {[key: string]: number} = {
        'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5, 'SIX': 6,
        'SEVEN': 7, 'EIGHT': 8, 'NINE': 9, 'TEN': 10,
        'JACK': 11, 'QUEEN': 12, 'KING': 13, 'ACE': 14
      };
      return (valueMap[a.rank] || 0) - (valueMap[b.rank] || 0);
    });
    
    return sortedCards[0].id;
  }
  
  // If can't follow suit, play lowest card
  const sortedCards = [...validCards].sort((a, b) => {
    const valueMap: {[key: string]: number} = {
      'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5, 'SIX': 6,
      'SEVEN': 7, 'EIGHT': 8, 'NINE': 9, 'TEN': 10,
      'JACK': 11, 'QUEEN': 12, 'KING': 13, 'ACE': 14
    };
    return (valueMap[a.rank] || 0) - (valueMap[b.rank] || 0);
  });
  
  return sortedCards[0].id;
}

// Placeholder for advanced bidding strategy
function determineOptimalBid(hand: CardType[], state: NinetyNineGameState): string[] {
  // This would be a complex algorithm analyzing the entire hand
  // For now, we'll use a simplified approach
  const marriages = findMarriages(hand);
  if (marriages.length > 0) {
    return marriages[0].map(card => card.id);
  }
  
  // Look for three of a kind
  const rankGroups: {[key: string]: CardType[]} = {};
  hand.forEach(card => {
    if (!rankGroups[card.rank]) rankGroups[card.rank] = [];
    rankGroups[card.rank].push(card);
  });
  
  for (const rankCards of Object.values(rankGroups)) {
    if (rankCards.length >= 3) {
      return rankCards.slice(0, 3).map(card => card.id);
    }
  }
  
  // Default to 2 highest value cards
  return selectReasonableBidCards(hand, 2).map(card => card.id);
}

// Placeholder for advanced card play strategy
function calculateOptimalPlay(game: CardGame | null, state: NinetyNineGameState, hand: CardType[], playerId: string): string | null {
  // This would be a complex algorithm analyzing the entire game state
  // For now, we'll use the simpler strategy
  return findBestCardToPlay(game, state, hand, playerId);
} 