import { CardType, Suit } from './card';

/**
 * Base interface for all card games
 */
export interface CardGame {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  rules: GameRules;
  ui: GameUI;
  setup: GameSetup;
  actions: GameActions;
  scoring: GameScoring;
  animations: GameAnimations;
  settings: GameSettings;
}

/**
 * Game rules interface
 */
export interface GameRules {
  isValidPlay: (state: any, cardId: string, playerId: string) => boolean;
  isGameOver: (state: any) => boolean;
  determineWinner: (state: any) => string | null;
  getRoundWinner?: (state: any, roundIndex: number) => string | null;
  getTrickWinner?: (state: any, cards: CardType[], leadSuit: Suit) => string | null;
  getNextPlayer: (state: any) => string;
  validateAction: (state: any, action: string, playerId: string, payload?: any) => boolean;
}

/**
 * Game UI customization
 */
export interface GameUI {
  layout: 'circular' | 'rectangle' | 'stacked' | 'custom';
  cardArrangement: 'fan' | 'stack' | 'grid' | 'row' | 'custom';
  playerPositions?: { [playerId: string]: { x: number; y: number } };
  tablePosition?: { x: number; y: number };
  customComponents?: {
    PlayerHand?: React.ComponentType<any>;
    Table?: React.ComponentType<any>;
    Card?: React.ComponentType<any>;
    ScoreBoard?: React.ComponentType<any>;
    GameControls?: React.ComponentType<any>;
  };
  themes?: {
    [themeName: string]: {
      tableColor: string;
      cardBack: string;
      textColor: string;
      backgroundColor: string;
    }
  };
}

/**
 * Game setup configuration
 */
export interface GameSetup {
  createInitialState: (playerIds: string[], settings?: any) => any;
  dealCards: (numPlayers: number) => { hands: CardType[][]; remainingDeck: CardType[]; turnUpCard?: CardType };
  initialDeck: () => CardType[];
  setupRound: (state: any, roundIndex: number) => any;
}

/**
 * Game actions
 */
export interface GameActions {
  availableActions: (state: any, playerId: string) => string[];
  requiredActions: (state: any, playerId: string) => string[];
  performAction: (state: any, action: string, playerId: string, payload?: any) => any;
  actionReducers: {
    [actionType: string]: (state: any, payload: any) => any;
  };
}

/**
 * Game scoring methods
 */
export interface GameScoring {
  calculateScore: (state: any, playerId: string) => number;
  updateScores: (state: any) => any;
  winningCondition: 'highest' | 'lowest' | 'threshold' | 'custom';
  thresholdValue?: number;
  customWinCheck?: (state: any) => { isWinner: boolean; winnerId: string | null };
}

/**
 * Game animations
 */
export interface GameAnimations {
  dealAnimation?: (card: CardType, playerIndex: number) => any;
  playCardAnimation?: (card: CardType, fromPosition: any, toPosition: any) => any;
  winTrickAnimation?: (cards: CardType[], winnerId: string) => any;
  shuffleAnimation?: () => any;
  customAnimations?: {
    [animationName: string]: (params: any) => any;
  };
}

/**
 * Game settings
 */
export interface GameSettings {
  maxRounds: number;
  cardsPerPlayer: number;
  allowJokers?: boolean;
  customDeckSize?: number;
  timeLimit?: number; // in seconds
  autoPlay?: boolean;
  gameMode?: 'vs-computer' | 'local' | 'ranked'; // Type of game being played
  specialRules?: {
    [ruleName: string]: boolean;
  };
}

/**
 * Game factory to create game instances
 */
export interface GameFactory {
  createGame: (gameType: string, options?: any) => CardGame;
  getAvailableGames: () => { id: string; name: string; description: string }[];
} 