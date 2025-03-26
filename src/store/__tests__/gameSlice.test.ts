import { configureStore } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { GameState, GameMode, Player, GamePhase } from '../gameSlice';
import gameReducer, { 
  dealCards,
  playCard,
  placeBid,
  revealBid,
  calculateScores,
} from '../gameSlice';
import { initializeGame } from '../gameThunks';
import { createDeck } from '@/utils/gameUtils';
import type { CardType } from '@/types/card';
import { Suit, Rank } from '@/types/card';

// Test helper functions
const createTestPlayer = (id: string, handIds: string[] = []): Player => ({
  id,
  name: `Player ${id}`,
  handIds,
  bidCardIds: [],
  revealBid: false,
  tricksWon: 0,
  score: 0,
  isActive: true,
});

const createTestCard = (id: string, suit: Suit = Suit.HEARTS, rank: Rank = Rank.ACE): CardType => ({
  id,
  suit,
  rank,
  isFaceUp: true,
  position: { x: 0, y: 0, zIndex: 0 },
});

const setupTestState = (store: ReturnType<typeof configureStore<{ game: GameState }>>, {
  gamePhase = 'playing',
  players = [createTestPlayer('player-1')],
  cards = [createTestCard('card-1')],
  currentTrickCardIds = [null, null, null],
  currentPlayerIndex = 0,
}: {
  gamePhase?: GamePhase;
  players?: Player[];
  cards?: CardType[];
  currentTrickCardIds?: (string | null)[];
  currentPlayerIndex?: number;
} = {}) => {
  store.dispatch({ type: 'game/setGamePhase', payload: gamePhase });
  store.dispatch({ type: 'game/setPlayers', payload: players });
  store.dispatch({ 
    type: 'game/batchUpdateCards', 
    payload: { 
      updates: cards.reduce((acc, card) => ({ ...acc, [card.id]: card }), {})
    }
  });
  store.dispatch({ type: 'game/setCurrentTrickCardIds', payload: currentTrickCardIds });
  store.dispatch({ type: 'game/setCurrentPlayerIndex', payload: currentPlayerIndex });
};

describe('gameSlice', () => {
  let store: ReturnType<typeof configureStore<{ game: GameState }>>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        game: gameReducer,
      },
    });
  });

  describe('initializeGame', () => {
    it('should initialize game with correct number of players', async () => {
      const numPlayers = 3;
      await store.dispatch(initializeGame(numPlayers) as any);

      const state = store.getState().game;
      expect(state.playerIds).toHaveLength(numPlayers);
      expect(state.gamePhase).toBe('bidding');
      expect(state.gameMode).toBe('standard');
      expect(state.roundNumber).toBe(1);
      expect(state.lastTricks).toHaveLength(0);
    });

    it('should handle initialization error', async () => {
      await store.dispatch(initializeGame(0) as any);

      const state = store.getState().game;
      expect(state.error).toBeTruthy();
      expect(state.error?.type).toBe('NETWORK');
    });
  });

  describe('dealCards', () => {
    it('should deal cards correctly', () => {
      setupTestState(store, {
        gamePhase: 'dealing',
        players: [
          createTestPlayer('player-1'),
          createTestPlayer('player-2'),
          createTestPlayer('player-3'),
        ],
      });

      store.dispatch(dealCards());

      const state = store.getState().game;
      expect(state.deckIds).toHaveLength(16); // 52 - (12 * 3)
      expect(state.playerIds.every((id: string) => 
        state.entities.players[id].handIds.length === 12
      )).toBe(true);
      expect(state.gamePhase).toBe('bidding');
    });

    it('should not allow dealing in wrong phase', () => {
      setupTestState(store, { gamePhase: 'playing' });
      store.dispatch(dealCards());

      const state = store.getState().game;
      expect(state.error).toBeTruthy();
      expect(state.error?.type).toBe('GAME_STATE');
    });
  });

  describe('playCard', () => {
    it('should play card correctly', () => {
      const playerId = 'player-1';
      const card = createTestCard('card-1');
      
      setupTestState(store, {
        players: [createTestPlayer(playerId, [card.id])],
        cards: [card],
      });

      store.dispatch(playCard({ playerId, card }));

      const state = store.getState().game;
      expect(state.currentTrickCardIds[0]).toBe(card.id);
      expect(state.entities.players[playerId].handIds).not.toContain(card.id);
    });

    it('should not allow playing invalid card', () => {
      const playerId = 'player-1';
      const card = createTestCard('card-1');

      setupTestState(store, {
        players: [createTestPlayer(playerId)],
        cards: [card],
        currentPlayerIndex: 1,
      });

      store.dispatch(playCard({ playerId, card }));

      const state = store.getState().game;
      expect(state.error).toBeTruthy();
      expect(state.error?.type).toBe('VALIDATION');
    });

    it('should track trick history when trick is complete', () => {
      const playerId = 'player-1';
      const card = createTestCard('card-1');

      setupTestState(store, {
        players: [createTestPlayer(playerId, [card.id])],
        cards: [card],
        currentTrickCardIds: [card.id, card.id, card.id],
      });

      store.dispatch(playCard({ playerId, card }));

      const state = store.getState().game;
      expect(state.lastTricks).toHaveLength(1);
      expect(state.lastTricks[0].roundNumber).toBe(1);
      expect(state.lastTricks[0].trickNumber).toBe(1);
    });
  });

  describe('placeBid', () => {
    it('should place bid correctly', () => {
      const playerId = 'player-1';
      const bidCards = [
        createTestCard('card-1'),
        createTestCard('card-2', Suit.SPADES, Rank.KING),
      ];

      setupTestState(store, {
        gamePhase: 'bidding',
        players: [createTestPlayer(playerId, bidCards.map(c => c.id))],
        cards: bidCards,
      });

      store.dispatch(placeBid({ playerId, bidCards }));

      const state = store.getState().game;
      expect(state.entities.players[playerId].bidCardIds).toEqual(bidCards.map(c => c.id));
      expect(state.entities.players[playerId].handIds).not.toContain(bidCards[0].id);
    });

    it('should not allow placing bid in wrong phase', () => {
      const playerId = 'player-1';
      const bidCards = [createTestCard('card-1')];

      setupTestState(store, {
        gamePhase: 'playing',
        players: [createTestPlayer(playerId)],
        cards: bidCards,
      });

      store.dispatch(placeBid({ playerId, bidCards }));

      const state = store.getState().game;
      expect(state.error).toBeTruthy();
      expect(state.error?.type).toBe('GAME_STATE');
    });
  });

  describe('revealBid', () => {
    it('should reveal bid correctly', () => {
      const playerId = 'player-1';
      setupTestState(store, {
        players: [createTestPlayer(playerId)],
      });

      store.dispatch(revealBid({ playerId }));

      const state = store.getState().game;
      expect(state.entities.players[playerId].revealBid).toBe(true);
    });
  });

  describe('calculateScores', () => {
    it('should calculate scores correctly', () => {
      const playerId = 'player-1';
      setupTestState(store, {
        players: [createTestPlayer(playerId)],
      });

      store.dispatch({ 
        type: 'game/batchUpdatePlayers', 
        payload: { 
          updates: { 
            [playerId]: { 
              tricksWon: 3,
              bidCardIds: ['card-1', 'card-2'],
            } 
          } 
        } 
      });

      store.dispatch(calculateScores());

      const state = store.getState().game;
      expect(state.entities.players[playerId].score).toBeDefined();
    });
  });

  describe('game settings and mode', () => {
    it('should update game settings correctly', () => {
      store.dispatch({
        type: 'game/updateGameSettings',
        payload: {
          maxRounds: 5,
          maxTricks: 10,
        }
      });

      const state = store.getState().game;
      expect(state.gameSettings.maxRounds).toBe(5);
      expect(state.gameSettings.maxTricks).toBe(10);
    });

    it('should update game mode correctly', () => {
      store.dispatch({
        type: 'game/setGameMode',
        payload: 'trump'
      });

      const state = store.getState().game;
      expect(state.gameMode).toBe('trump');
    });
  });
}); 