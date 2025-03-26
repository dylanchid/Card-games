/**
 * @fileoverview Redux slice for managing the Ninety-Nine card game state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CardType } from '@/types/card';
import { Suit } from '@/types/card';
import { v4 as uuidv4 } from 'uuid';
import { createDeck, dealCards as dealCardsUtil, isValidPlay, determineTrickWinner, isGameOver, calculatePlayerScore } from '@/utils/gameUtils';
import { initializeGame } from './gameThunks';

/**
 * Represents the different phases of the game
 */
export type GamePhase = 'dealing' | 'bidding' | 'playing' | 'scoring';

/**
 * Represents the different game modes/variants
 */
export type GameMode = 'standard' | 'trump' | 'no-trump' | 'partnership';

/**
 * Represents a player in the game
 */
export interface Player {
  id: string;
  name: string;
  handIds: string[];
  bidCardIds: string[];
  revealBid: boolean;
  tricksWon: number;
  score: number;
  isActive: boolean;
}

/**
 * Represents a completed trick
 */
export interface TrickHistory {
  id: string;
  roundNumber: number;
  trickNumber: number;
  cardIds: string[];
  winnerId: string;
  leadSuit: Suit;
  timestamp: number;
}

/**
 * Represents game settings and configuration
 */
export interface GameSettings {
  maxRounds: number;
  maxTricks: number;
  cardsPerPlayer: number;
  allowTrump: boolean;
  allowNoTrump: boolean;
  allowPartnership: boolean;
  scoringSystem: 'standard' | 'advanced';
  timeLimit?: number; // in seconds
  autoPlay?: boolean;
}

/**
 * Represents a game error
 */
export interface GameError {
  type: 'VALIDATION' | 'GAME_STATE' | 'NETWORK' | 'UNKNOWN';
  message: string;
  details?: unknown;
}

/**
 * Represents the complete game state
 */
export interface GameState {
  entities: {
    players: { [key: string]: Player };
    cards: { [key: string]: CardType };
  };
  playerIds: string[];
  deckIds: string[];
  turnupCardId: string | null;
  gamePhase: GamePhase;
  currentPlayerIndex: number;
  currentTrickCardIds: (string | null)[];
  currentTrickSuit: Suit | null;
  currentTrickWinner: string | null;
  currentTrickLeader: number;
  tricksPlayed: number;
  isLoading: boolean;
  error: GameError | null;
  lastAction: string | null;
  gameStarted: boolean;
  // New properties
  roundNumber: number;
  gameMode: GameMode;
  lastTricks: TrickHistory[];
  gameSettings: GameSettings;
}

/**
 * Initial state for the game
 */
const initialState: GameState = {
  entities: {
    players: {},
    cards: {},
  },
  playerIds: [],
  deckIds: [],
  turnupCardId: null,
  gamePhase: 'dealing',
  currentPlayerIndex: 0,
  currentTrickCardIds: [null, null, null],
  currentTrickSuit: null,
  currentTrickWinner: null,
  currentTrickLeader: 0,
  tricksPlayed: 0,
  error: null,
  isLoading: false,
  lastAction: null,
  gameStarted: false,
  // New initial values
  roundNumber: 1,
  gameMode: 'standard',
  lastTricks: [],
  gameSettings: {
    maxRounds: 3,
    maxTricks: 9,
    cardsPerPlayer: 12,
    allowTrump: true,
    allowNoTrump: true,
    allowPartnership: false,
    scoringSystem: 'standard',
    timeLimit: 30,
    autoPlay: false,
  },
};

/**
 * Selector to get a player by ID
 */
const selectPlayerById = (state: GameState, playerId: string) => state.entities.players[playerId];

/**
 * Selector to get a card by ID
 */
const selectCardById = (state: GameState, cardId: string) => state.entities.cards[cardId];

/**
 * Selector to get a player's hand
 */
const selectPlayerHand = (state: GameState, playerId: string) => 
  state.entities.players[playerId]?.handIds.map(id => state.entities.cards[id]) || [];

/**
 * Selector to get current trick cards
 */
const selectCurrentTrickCards = (state: GameState) => 
  state.currentTrickCardIds.map(id => id ? state.entities.cards[id] : null);

interface DealCardsResult {
  hands: CardType[][];
  remainingDeck: CardType[];
  turnupCard: CardType | null;
}

interface InitializeGamePayload {
  players: Player[];
  deck: CardType[];
  turnupCard: CardType | null;
  hands: CardType[][];
}

/**
 * Redux slice for the game state
 */
const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    /**
     * Sets the current game phase
     */
    setGamePhase: (state, action: PayloadAction<GamePhase>) => {
      state.gamePhase = action.payload;
      state.lastAction = 'setGamePhase';
    },
    setDeck: (state, action: PayloadAction<CardType[]>) => {
      state.deckIds = action.payload.map(card => card.id);
      state.entities.cards = action.payload.reduce((acc, card) => ({
        ...acc,
        [card.id]: card,
      }), {});
    },
    setTurnupCard: (state, action: PayloadAction<CardType | null>) => {
      state.turnupCardId = action.payload?.id || null;
    },
    setPlayers: (state, action: PayloadAction<Player[]>) => {
      state.playerIds = action.payload.map(player => player.id);
      state.entities.players = action.payload.reduce((acc, player) => ({
        ...acc,
        [player.id]: player,
      }), {});
    },
    updateCurrentTrick: (state, action: PayloadAction<(CardType | null)[]>) => {
      state.currentTrickCardIds = action.payload.map(card => card?.id || null);
    },
    setCurrentTrickLeader: (state, action: PayloadAction<number>) => {
      state.currentTrickLeader = action.payload;
    },
    setError: (state, action: PayloadAction<GameError | null>) => {
      state.error = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLastAction: (state, action: PayloadAction<string | null>) => {
      state.lastAction = action.payload;
    },
    setGameStarted: (state, action: PayloadAction<boolean>) => {
      state.gameStarted = action.payload;
    },
    setCurrentPlayerIndex: (state, action: PayloadAction<number>) => {
      state.currentPlayerIndex = action.payload;
    },
    dealCards: (state) => {
      if (state.gamePhase !== 'dealing') {
        state.error = {
          type: 'GAME_STATE',
          message: 'Cannot deal cards in current game phase',
        };
        return;
      }

      // Create and shuffle deck
      const deck = createDeck();
      const numPlayers = state.playerIds.length;
      const cardsPerPlayer = 12;
      const result = dealCardsUtil(deck, numPlayers, cardsPerPlayer);

      // Update player hands
      state.playerIds.forEach((playerId, index) => {
        const player = state.entities.players[playerId];
        if (player) {
          player.handIds = result.hands[index].map(card => card.id);
        }
      });

      // Update deck and turnup card
      state.deckIds = result.remainingDeck.map(card => card.id);
      state.turnupCardId = result.turnupCard?.id || null;

      // Move to bidding phase
      state.gamePhase = 'bidding';
      state.lastAction = 'dealCards';
    },
    playCard: (state, action: PayloadAction<{ playerId: string; card: CardType }>) => {
      const { playerId, card } = action.payload;
      const player = state.entities.players[playerId];
      
      if (!player) {
        state.error = {
          type: 'VALIDATION',
          message: 'Invalid player ID',
        };
        return;
      }

      if (!player.handIds.includes(card.id)) {
        state.error = {
          type: 'VALIDATION',
          message: 'Card not in player hand',
        };
        return;
      }

      if (state.gamePhase !== 'playing') {
        state.error = {
          type: 'GAME_STATE',
          message: 'Cannot play cards in current game phase',
        };
        return;
      }

      // Get lead suit from first card in trick
      const leadSuit = state.currentTrickCardIds[0] 
        ? state.entities.cards[state.currentTrickCardIds[0]]?.suit 
        : null;

      // Validate play
      if (!isValidPlay(card, state.currentTrickCardIds.map(id => id ? state.entities.cards[id] : null), 
        player.handIds.map(id => state.entities.cards[id]), leadSuit)) {
        state.error = {
          type: 'VALIDATION',
          message: 'Invalid card play',
        };
        return;
      }

      // Update current trick
      const currentPlayerIndex = state.playerIds.indexOf(playerId);
      state.currentTrickCardIds[currentPlayerIndex] = card.id;

      // Remove card from player's hand
      player.handIds = player.handIds.filter(id => id !== card.id);

      // Check if trick is complete
      if (state.currentTrickCardIds.every(id => id !== null)) {
        // Determine trick winner
        const trickCards = state.currentTrickCardIds.map(id => state.entities.cards[id]);
        const winnerIndex = determineTrickWinner(
          trickCards,
          leadSuit!,
          state.turnupCardId ? state.entities.cards[state.turnupCardId].suit : null
        );

        // Update trick winner's score
        const winnerId = state.playerIds[winnerIndex];
        const winner = state.entities.players[winnerId];
        if (winner) {
          winner.tricksWon += 1;
        }

        // Add trick to history
        state.lastTricks.push({
          id: uuidv4(),
          roundNumber: state.roundNumber,
          trickNumber: state.tricksPlayed + 1,
          cardIds: state.currentTrickCardIds as string[],
          winnerId,
          leadSuit: leadSuit!,
          timestamp: Date.now(),
        });

        // Update game state
        state.tricksPlayed += 1;
        state.currentTrickCardIds = [null, null, null];
        state.currentTrickLeader = winnerIndex;
        state.currentPlayerIndex = winnerIndex;

        // Check if round is over
        if (state.tricksPlayed >= state.gameSettings.maxTricks) {
          // Check if game is over (all rounds completed)
          if (state.roundNumber >= state.gameSettings.maxRounds) {
            state.gamePhase = 'scoring';
          } else {
            // Start new round
            state.roundNumber += 1;
            state.tricksPlayed = 0;
            state.lastTricks = [];
            state.gamePhase = 'dealing';
            state.currentTrickCardIds = [null, null, null];
            state.currentTrickSuit = null;
            state.currentTrickWinner = null;
            state.currentTrickLeader = 0;
            state.currentPlayerIndex = 0;
            state.error = null;
            state.lastAction = 'startNewRound';

            // Reset player hands and scores for new round
            state.playerIds.forEach(id => {
              const player = state.entities.players[id];
              if (player) {
                player.handIds = [];
                player.bidCardIds = [];
                player.revealBid = false;
                player.tricksWon = 0;
                player.score = 0;
              }
            });
          }
        }
      } else {
        // Move to next player
        state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerIds.length;
      }

      state.lastAction = 'playCard';
    },
    placeBid: (state, action: PayloadAction<{ playerId: string; bidCards: CardType[] }>) => {
      const { playerId, bidCards } = action.payload;
      const player = state.entities.players[playerId];

      if (!player) {
        state.error = {
          type: 'VALIDATION',
          message: 'Invalid player ID',
        };
        return;
      }

      if (state.gamePhase !== 'bidding') {
        state.error = {
          type: 'GAME_STATE',
          message: 'Cannot place bid in current game phase',
        };
        return;
      }

      // Validate bid cards are in player's hand
      const validBidCards = bidCards.every(card => 
        player.handIds.includes(card.id)
      );

      if (!validBidCards) {
        state.error = {
          type: 'VALIDATION',
          message: 'Invalid bid cards',
        };
        return;
      }

      // Update player's bid cards and hand
      player.bidCardIds = bidCards.map(card => card.id);
      player.handIds = player.handIds.filter(id => 
        !bidCards.some(card => card.id === id)
      );

      // Check if all players have bid
      const allPlayersBid = state.playerIds.every(id => 
        state.entities.players[id].bidCardIds.length > 0
      );

      if (allPlayersBid) {
        state.gamePhase = 'playing';
      }

      state.lastAction = 'placeBid';
    },
    revealBid: (state, action: PayloadAction<{ playerId: string }>) => {
      const { playerId } = action.payload;
      const player = state.entities.players[playerId];

      if (!player) {
        state.error = {
          type: 'VALIDATION',
          message: 'Invalid player ID',
        };
        return;
      }

      player.revealBid = true;
      state.lastAction = 'revealBid';
    },
    calculateScores: (state) => {
      state.playerIds.forEach(playerId => {
        const player = state.entities.players[playerId];
        if (player) {
          player.score = calculatePlayerScore(
            player,
            player.tricksWon,
            player.bidCardIds.map(id => state.entities.cards[id])
          );
        }
      });
      state.gamePhase = 'playing';
      state.currentPlayerIndex = 0;
      state.currentTrickCardIds = [null, null, null];
      state.currentTrickSuit = null;
      state.currentTrickWinner = null;
      state.currentTrickLeader = 0;
      state.tricksPlayed = 0;
      state.error = null;
      state.lastAction = 'calculateScores';
    },
    batchUpdatePlayers: (state, action: PayloadAction<{ updates: { [key: string]: Partial<Player> } }>) => {
      const { updates } = action.payload;
      Object.entries(updates).forEach(([playerId, update]) => {
        const player = state.entities.players[playerId];
        if (player) {
          Object.assign(player, update);
        }
      });
      state.lastAction = 'batchUpdatePlayers';
    },
    batchUpdateCards: (state, action: PayloadAction<{ updates: { [key: string]: Partial<CardType> } }>) => {
      const { updates } = action.payload;
      Object.entries(updates).forEach(([cardId, update]) => {
        const card = state.entities.cards[cardId];
        if (card) {
          Object.assign(card, update);
        }
      });
      state.lastAction = 'batchUpdateCards';
    },
    /**
     * Sets the current round number
     */
    setRoundNumber: (state, action: PayloadAction<number>) => {
      state.roundNumber = action.payload;
      state.lastAction = 'setRoundNumber';
    },
    /**
     * Sets the game mode
     */
    setGameMode: (state, action: PayloadAction<GameMode>) => {
      state.gameMode = action.payload;
      state.lastAction = 'setGameMode';
    },
    /**
     * Updates game settings
     */
    updateGameSettings: (state, action: PayloadAction<Partial<GameSettings>>) => {
      state.gameSettings = {
        ...state.gameSettings,
        ...action.payload,
      };
      state.lastAction = 'updateGameSettings';
    },
    /**
     * Adds a completed trick to history
     */
    addTrickToHistory: (state, action: PayloadAction<Omit<TrickHistory, 'id' | 'timestamp'>>) => {
      const newTrick: TrickHistory = {
        ...action.payload,
        id: uuidv4(),
        timestamp: Date.now(),
      };
      state.lastTricks.push(newTrick);
      state.lastAction = 'addTrickToHistory';
    },
    /**
     * Clears trick history
     */
    clearTrickHistory: (state) => {
      state.lastTricks = [];
      state.lastAction = 'clearTrickHistory';
    },
    /**
     * Sets the current trick card IDs
     */
    setCurrentTrickCardIds: (state, action: PayloadAction<(string | null)[]>) => {
      state.currentTrickCardIds = action.payload;
      state.lastAction = 'setCurrentTrickCardIds';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeGame.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeGame.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.gameStarted = true;
        state.gamePhase = 'bidding';
        state.currentPlayerIndex = 0;
        state.currentTrickCardIds = [null, null, null];
        state.currentTrickLeader = 0;
        state.roundNumber = 1;
        state.tricksPlayed = 0;
        state.lastTricks = [];
        state.lastAction = 'initializeGame';

        // Batch update players
        const playerUpdates = action.payload.players.reduce((acc: { [key: string]: Player }, player: Player) => {
          acc[player.id] = player;
          return acc;
        }, {});

        // Batch update cards
        const cardUpdates = action.payload.deck.reduce((acc: { [key: string]: CardType }, card: CardType) => {
          acc[card.id] = card;
          return acc;
        }, {});

        // Update entities
        state.entities.players = playerUpdates;
        state.entities.cards = cardUpdates;

        // Update IDs
        state.playerIds = action.payload.players.map(p => p.id);
        state.deckIds = action.payload.deck.map(c => c.id);
        state.turnupCardId = action.payload.turnupCard?.id || null;

        // Update player hands
        action.payload.players.forEach((player: Player, index: number) => {
          player.handIds = action.payload.hands[index].map((card: CardType) => card.id);
        });
      })
      .addCase(initializeGame.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error as GameError;
      })
      .addCase(calculateScores, (state) => {
        state.playerIds.forEach(playerId => {
          const player = state.entities.players[playerId];
          if (player) {
            player.score = calculatePlayerScore(
              player,
              player.tricksWon,
              player.bidCardIds.map(id => state.entities.cards[id])
            );
          }
        });
        state.gamePhase = 'playing';
        state.currentPlayerIndex = 0;
        state.currentTrickCardIds = [null, null, null];
        state.currentTrickSuit = null;
        state.currentTrickWinner = null;
        state.currentTrickLeader = 0;
        state.tricksPlayed = 0;
        state.error = null;
        state.lastAction = 'calculateScores';
      });
  },
});

export const {
  setGamePhase,
  setDeck,
  setTurnupCard,
  setPlayers,
  updateCurrentTrick,
  setCurrentTrickLeader,
  setError,
  setLoading,
  setLastAction,
  setGameStarted,
  setCurrentPlayerIndex,
  dealCards,
  playCard,
  placeBid,
  revealBid,
  calculateScores,
  batchUpdatePlayers,
  batchUpdateCards,
  setRoundNumber,
  setGameMode,
  updateGameSettings,
  addTrickToHistory,
  clearTrickHistory,
  setCurrentTrickCardIds,
} = gameSlice.actions;

export default gameSlice.reducer; 