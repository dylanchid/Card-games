/**
 * @fileoverview Redux slice for managing card state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CardType, StackType } from '../types/card';
import { v4 as uuidv4 } from 'uuid';

export interface CardStackState {
  entities: {
    cards: { [key: string]: CardType };
    stacks: { [key: string]: StackType };
  };
  stackIds: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CardStackState = {
  entities: {
    cards: {},
    stacks: {},
  },
  stackIds: [],
  isLoading: false,
  error: null,
};

const cardSlice = createSlice({
  name: 'card',
  initialState,
  reducers: {
    addCard: (state, action: PayloadAction<CardType>) => {
      state.entities.cards[action.payload.id] = action.payload;
    },
    updateCard: (state, action: PayloadAction<Partial<CardType> & { id: string }>) => {
      const { id, ...changes } = action.payload;
      if (state.entities.cards[id]) {
        state.entities.cards[id] = {
          ...state.entities.cards[id],
          ...changes,
        };
      }
    },
    removeCard: (state, action: PayloadAction<string>) => {
      delete state.entities.cards[action.payload];
    },
    addStack: (state, action: PayloadAction<StackType>) => {
      state.entities.stacks[action.payload.id] = action.payload;
      if (!state.stackIds.includes(action.payload.id)) {
        state.stackIds.push(action.payload.id);
      }
    },
    updateStack: (state, action: PayloadAction<Partial<StackType> & { id: string }>) => {
      const { id, ...changes } = action.payload;
      if (state.entities.stacks[id]) {
        state.entities.stacks[id] = {
          ...state.entities.stacks[id],
          ...changes,
        };
      }
    },
    removeStack: (state, action: PayloadAction<string>) => {
      delete state.entities.stacks[action.payload];
      state.stackIds = state.stackIds.filter(id => id !== action.payload);
    },
    moveCard: (state, action: PayloadAction<{ cardId: string; fromStackId: string; toStackId: string }>) => {
      const { cardId, fromStackId, toStackId } = action.payload;
      const fromStack = state.entities.stacks[fromStackId];
      const toStack = state.entities.stacks[toStackId];
      
      if (fromStack && toStack && fromStack.cards.find(card => card.id === cardId)) {
        // Remove card from fromStack
        fromStack.cards = fromStack.cards.filter(card => card.id !== cardId);
        fromStack.cardCount = fromStack.cards.length;
        
        // Get the card
        const card = state.entities.cards[cardId];
        if (card) {
          // Update card's stackId
          card.stackId = toStackId;
          
          // Add card to toStack
          toStack.cards.push(card);
          toStack.cardCount = toStack.cards.length;
        }
      }
    },
    flipCard: (state, action: PayloadAction<string>) => {
      const card = state.entities.cards[action.payload];
      if (card) {
        card.isFaceUp = !card.isFaceUp;
      }
    },
    setCardLoading: (state, action: PayloadAction<{ id: string; isLoading: boolean }>) => {
      const card = state.entities.cards[action.payload.id];
      if (card) {
        card.isLoading = action.payload.isLoading;
      }
    },
    setCardError: (state, action: PayloadAction<{ id: string; error: string | undefined }>) => {
      const card = state.entities.cards[action.payload.id];
      if (card) {
        card.error = action.payload.error;
      }
    },
    setStackLoading: (state, action: PayloadAction<{ id: string; isLoading: boolean }>) => {
      const stack = state.entities.stacks[action.payload.id];
      if (stack) {
        stack.isLoading = action.payload.isLoading;
      }
    },
    setStackError: (state, action: PayloadAction<{ id: string; error: string | undefined }>) => {
      const stack = state.entities.stacks[action.payload.id];
      if (stack) {
        stack.error = action.payload.error;
      }
    },
    clearErrors: (state) => {
      state.error = null;
      Object.values(state.entities.cards).forEach(card => {
        card.error = undefined;
      });
      Object.values(state.entities.stacks).forEach(stack => {
        stack.error = undefined;
      });
    },
    reset: () => initialState,
  },
});

export const {
  addCard,
  updateCard,
  removeCard,
  addStack,
  updateStack,
  removeStack,
  moveCard,
  flipCard,
  setCardLoading,
  setCardError,
  setStackLoading,
  setStackError,
  clearErrors,
  reset,
} = cardSlice.actions;

export default cardSlice.reducer; 