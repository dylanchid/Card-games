import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from './store';
import { setLoading, setError } from './gameSlice';
import { createDeck, dealCards } from '@/utils/gameUtils';

export const initializeGame = createAsyncThunk(
  'game/initializeGame',
  async (numPlayers: number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      
      // Create players
      const players = Array(numPlayers).fill(null).map((_, index) => ({
        id: `player-${index + 1}`,
        name: `Player ${index + 1}`,
        handIds: [],
        bidCardIds: [],
        revealBid: false,
        tricksWon: 0,
        score: 0,
        isActive: true,
      }));

      // Create and shuffle deck
      const deck = createDeck();
      
      // Deal cards
      const { hands, remainingDeck, turnupCard } = dealCards(deck, numPlayers, 12);

      return {
        players,
        deck: remainingDeck,
        turnupCard,
        hands,
      };
    } catch (error) {
      return rejectWithValue({
        type: 'NETWORK',
        message: 'Failed to initialize game',
        details: error,
      });
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const saveGameState = createAsyncThunk(
  'game/saveGameState',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      // Here you would typically save to localStorage or a backend
      localStorage.setItem('gameState', JSON.stringify(state.game));
      return true;
    } catch (error) {
      return rejectWithValue({
        type: 'NETWORK',
        message: 'Failed to save game state',
        details: error,
      });
    }
  }
);

export const loadGameState = createAsyncThunk(
  'game/loadGameState',
  async (_, { rejectWithValue }) => {
    try {
      const savedState = localStorage.getItem('gameState');
      if (!savedState) {
        throw new Error('No saved game state found');
      }
      return JSON.parse(savedState);
    } catch (error) {
      return rejectWithValue({
        type: 'NETWORK',
        message: 'Failed to load game state',
        details: error,
      });
    }
  }
); 