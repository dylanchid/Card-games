import { configureStore } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { GameState, GameMode } from '../gameSlice';
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
      // Mock error by passing invalid number of players
      await store.dispatch(initializeGame(0) as any);

      const state = store.getState().game;
      expect(state.error).toBeTruthy();
      expect(state.error?.type).toBe('NETWORK');
    });
  });

  describe('dealCards', () => {
    it('should deal cards correctly', () => {
      // Set up initial state
      store.dispatch({ type: 'game/setGamePhase', payload: 'dealing' });
      store.dispatch({ 
        type: 'game/setPlayers', 
        payload: [
          { id: 'player-1', name: 'Player 1', handIds: [], bidCardIds: [], revealBid: false, tricksWon: 0, score: 0, isActive: true },
          { id: 'player-2', name: 'Player 2', handIds: [], bidCardIds: [], revealBid: false, tricksWon: 0, score: 0, isActive: true },
          { id: 'player-3', name: 'Player 3', handIds: [], bidCardIds: [], revealBid: false, tricksWon: 0, score: 0, isActive: true },
        ]
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
      // Set game phase to playing
      store.dispatch({ type: 'game/setGamePhase', payload: 'playing' });
      
      store.dispatch(dealCards());

      const state = store.getState().game;
      expect(state.error).toBeTruthy();
      expect(state.error?.type).toBe('GAME_STATE');
    });
  });

  describe('playCard', () => {
    it('should play card correctly', () => {
      // Set up initial state
      const playerId = 'player-1';
      const card: CardType = { 
        id: 'card-1', 
        suit: Suit.HEARTS, 
        rank: Rank.ACE,
        isFaceUp: true,
        position: { x: 0, y: 0, zIndex: 0 }
      };

      store.dispatch({ type: 'game/setGamePhase', payload: 'playing' });
      store.dispatch({ 
        type: 'game/setPlayers', 
        payload: [
          { id: playerId, name: 'Player 1', handIds: [card.id], bidCardIds: [], revealBid: false, tricksWon: 0, score: 0, isActive: true }
        ]
      });
      store.dispatch({ 
        type: 'game/batchUpdateCards', 
        payload: { 
          updates: { [card.id]: card }
        }
      });

      store.dispatch(playCard({ playerId, card }));

      const state = store.getState().game;
      expect(state.currentTrickCardIds[0]).toBe(card.id);
      expect(state.entities.players[playerId].handIds).not.toContain(card.id);
    });

    it('should not allow playing invalid card', () => {
      const playerId = 'player-1';
      const card: CardType = { 
        id: 'card-1', 
        suit: Suit.HEARTS, 
        rank: Rank.ACE,
        isFaceUp: true,
        position: { x: 0, y: 0, zIndex: 0 }
      };

      // Set up state to make card invalid
      store.dispatch({ type: 'game/setGamePhase', payload: 'playing' });
      store.dispatch({ type: 'game/setCurrentTrickCardIds', payload: [null, null, null] });
      store.dispatch({ type: 'game/setCurrentPlayerIndex', payload: 1 });

      store.dispatch(playCard({ playerId, card }));

      const state = store.getState().game;
      expect(state.error).toBeTruthy();
      expect(state.error?.type).toBe('VALIDATION');
    });

    it('should track trick history when trick is complete', () => {
      const playerId = 'player-1';
      const card: CardType = { 
        id: 'card-1', 
        suit: Suit.HEARTS, 
        rank: Rank.ACE,
        isFaceUp: true,
        position: { x: 0, y: 0, zIndex: 0 }
      };

      // Set up state for a complete trick
      store.dispatch({ type: 'game/setGamePhase', payload: 'playing' });
      store.dispatch({ 
        type: 'game/setPlayers', 
        payload: [
          { id: playerId, name: 'Player 1', handIds: [card.id], bidCardIds: [], revealBid: false, tricksWon: 0, score: 0, isActive: true }
        ]
      });
      store.dispatch({ 
        type: 'game/batchUpdateCards', 
        payload: { 
          updates: { [card.id]: card }
        }
      });
      store.dispatch({ type: 'game/setCurrentTrickCardIds', payload: [card.id, card.id, card.id] });

      store.dispatch(playCard({ playerId, card }));

      const state = store.getState().game;
      expect(state.lastTricks).toHaveLength(1);
      expect(state.lastTricks[0].roundNumber).toBe(1);
      expect(state.lastTricks[0].trickNumber).toBe(1);
    });
  });

  describe('placeBid', () => {
    it('should place bid correctly', () => {
      // Set up initial state
      const playerId = 'player-1';
      const bidCards: CardType[] = [
        { 
          id: 'card-1', 
          suit: Suit.HEARTS, 
          rank: Rank.ACE,
          isFaceUp: true,
          position: { x: 0, y: 0, zIndex: 0 }
        },
        { 
          id: 'card-2', 
          suit: Suit.SPADES, 
          rank: Rank.KING,
          isFaceUp: true,
          position: { x: 0, y: 0, zIndex: 0 }
        },
      ];

      store.dispatch({ type: 'game/setGamePhase', payload: 'bidding' });
      store.dispatch({ 
        type: 'game/setPlayers', 
        payload: [
          { id: playerId, name: 'Player 1', handIds: bidCards.map(c => c.id), bidCardIds: [], revealBid: false, tricksWon: 0, score: 0, isActive: true }
        ]
      });
      store.dispatch({ 
        type: 'game/batchUpdateCards', 
        payload: { 
          updates: bidCards.reduce((acc, card) => ({ ...acc, [card.id]: card }), {})
        }
      });

      store.dispatch(placeBid({ playerId, bidCards }));

      const state = store.getState().game;
      expect(state.entities.players[playerId].bidCardIds).toEqual(bidCards.map(c => c.id));
      expect(state.entities.players[playerId].handIds).not.toContain(bidCards[0].id);
    });

    it('should not allow placing bid in wrong phase', () => {
      // Set game phase to playing
      store.dispatch({ type: 'game/setGamePhase', payload: 'playing' });

      const playerId = 'player-1';
      const bidCards: CardType[] = [{ 
        id: 'card-1', 
        suit: Suit.HEARTS, 
        rank: Rank.ACE,
        isFaceUp: true,
        position: { x: 0, y: 0, zIndex: 0 }
      }];

      store.dispatch(placeBid({ playerId, bidCards }));

      const state = store.getState().game;
      expect(state.error).toBeTruthy();
      expect(state.error?.type).toBe('GAME_STATE');
    });
  });

  describe('revealBid', () => {
    it('should reveal bid correctly', () => {
      // Set up initial state
      const playerId = 'player-1';
      store.dispatch({ 
        type: 'game/setPlayers', 
        payload: [
          { id: playerId, name: 'Player 1', handIds: [], bidCardIds: [], revealBid: false, tricksWon: 0, score: 0, isActive: true }
        ]
      });

      store.dispatch(revealBid({ playerId }));

      const state = store.getState().game;
      expect(state.entities.players[playerId].revealBid).toBe(true);
    });
  });

  describe('calculateScores', () => {
    it('should calculate scores correctly', () => {
      // Set up test state
      const playerId = 'player-1';
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