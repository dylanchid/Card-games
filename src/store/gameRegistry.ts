import { CardGame, GameFactory } from '../types/game';
import { createDeck } from '../utils/gameUtils';

/**
 * Registry of all available card games
 */
class GameRegistry implements GameFactory {
  private games: Map<string, () => CardGame>;
  
  constructor() {
    this.games = new Map();
  }
  
  /**
   * Register a new game type
   */
  registerGame(gameId: string, gameFactory: () => CardGame): void {
    if (this.games.has(gameId)) {
      console.warn(`Game with ID ${gameId} is already registered. It will be overwritten.`);
    }
    this.games.set(gameId, gameFactory);
  }
  
  /**
   * Create a new game instance
   */
  createGame(gameType: string, options?: any): CardGame {
    const gameFactory = this.games.get(gameType);
    
    if (!gameFactory) {
      throw new Error(`Game type "${gameType}" is not registered.`);
    }
    
    const game = gameFactory();
    
    // Apply any options/customizations
    if (options) {
      return {
        ...game,
        settings: {
          ...game.settings,
          ...options.settings,
        },
        ui: {
          ...game.ui,
          ...options.ui,
        },
      };
    }
    
    return game;
  }
  
  /**
   * Get all available games
   */
  getAvailableGames(): { id: string; name: string; description: string }[] {
    return Array.from(this.games.entries()).map(([id, factory]) => {
      const { name, description } = factory();
      return { id, name, description };
    });
  }
  
  /**
   * Check if a game exists
   */
  hasGame(gameId: string): boolean {
    return this.games.has(gameId);
  }
  
  /**
   * Remove a game from the registry
   */
  unregisterGame(gameId: string): boolean {
    return this.games.delete(gameId);
  }
}

// Create a singleton instance of the registry
export const gameRegistry = new GameRegistry();

// Export a hook to use the game registry
export function useGameRegistry() {
  return gameRegistry;
}

// Helper for adding default implementations
export function createBaseCardGame(partial: Partial<CardGame>): CardGame {
  return {
    id: 'base-game',
    name: 'Base Card Game',
    description: 'Generic card game framework',
    minPlayers: 2,
    maxPlayers: 4,
    rules: {
      isValidPlay: () => true,
      isGameOver: () => false,
      determineWinner: () => null,
      getNextPlayer: (state) => '',
      validateAction: () => true,
    },
    ui: {
      layout: 'circular',
      cardArrangement: 'fan',
    },
    setup: {
      createInitialState: (playerIds) => ({ playerIds }),
      dealCards: (numPlayers) => ({
        hands: [],
        remainingDeck: createDeck(),
      }),
      initialDeck: createDeck,
      setupRound: (state) => state,
    },
    actions: {
      availableActions: () => [],
      requiredActions: () => [],
      performAction: (state) => state,
      actionReducers: {},
    },
    scoring: {
      calculateScore: () => 0,
      updateScores: (state) => state,
      winningCondition: 'highest',
    },
    animations: {},
    settings: {
      maxRounds: 1,
      cardsPerPlayer: 7,
    },
    ...partial,
  };
} 