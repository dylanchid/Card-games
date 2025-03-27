/**
 * @fileoverview Redux slice for managing the UI state of the application
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  autoDismiss: boolean;
  timestamp: number;
}

export interface Theme {
  name: string;
  tableColor: string;
  cardBackColor: string;
  cardFrontColor: string;
  textColor: string;
  accentColor: string;
}

export interface UIState {
  isDarkMode: boolean;
  isSoundEnabled: boolean;
  isAnimationEnabled: boolean;
  cardScale: number;
  cardArrangement: 'fan' | 'stack' | 'row';
  currentView: 'game' | 'settings' | 'statistics' | 'help';
  isFullscreen: boolean;
  selectedTheme: string;
  themes: {
    [key: string]: Theme;
  };
  loadingState: {
    isLoading: boolean;
    message: string;
  };
  errorState: {
    hasError: boolean;
    message: string;
  };
  notifications: Notification[];
}

const defaultTheme: Theme = {
  name: 'Default',
  tableColor: '#076324',
  cardBackColor: '#1c3981',
  cardFrontColor: '#ffffff',
  textColor: '#000000',
  accentColor: '#f0c808',
};

const darkTheme: Theme = {
  name: 'Dark',
  tableColor: '#1e2021',
  cardBackColor: '#121212',
  cardFrontColor: '#2c2c2c',
  textColor: '#e0e0e0',
  accentColor: '#bb86fc',
};

const initialState: UIState = {
  isDarkMode: false,
  isSoundEnabled: true,
  isAnimationEnabled: true,
  cardScale: 1,
  cardArrangement: 'fan',
  currentView: 'game',
  isFullscreen: false,
  selectedTheme: 'default',
  themes: {
    default: defaultTheme,
    dark: darkTheme,
  },
  loadingState: {
    isLoading: false,
    message: '',
  },
  errorState: {
    hasError: false,
    message: '',
  },
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.isSoundEnabled = action.payload;
    },
    setAnimationEnabled: (state, action: PayloadAction<boolean>) => {
      state.isAnimationEnabled = action.payload;
    },
    setCardScale: (state, action: PayloadAction<number>) => {
      state.cardScale = action.payload;
    },
    setCardArrangement: (state, action: PayloadAction<'fan' | 'stack' | 'row'>) => {
      state.cardArrangement = action.payload;
    },
    setCurrentView: (state, action: PayloadAction<'game' | 'settings' | 'statistics' | 'help'>) => {
      state.currentView = action.payload;
    },
    setFullscreen: (state, action: PayloadAction<boolean>) => {
      state.isFullscreen = action.payload;
    },
    setSelectedTheme: (state, action: PayloadAction<string>) => {
      state.selectedTheme = action.payload;
    },
    setLoading: (state, action: PayloadAction<{ isLoading: boolean, message: string }>) => {
      state.loadingState = action.payload;
    },
    setError: (state, action: PayloadAction<{ hasError: boolean, message: string }>) => {
      state.errorState = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      state.notifications.push({
        ...action.payload,
        id: uuidv4(),
        timestamp: Date.now()
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setDarkMode,
  setSoundEnabled,
  setAnimationEnabled,
  setCardScale,
  setCardArrangement,
  setCurrentView,
  setFullscreen,
  setSelectedTheme,
  setLoading,
  setError,
  addNotification,
  removeNotification,
  clearAllNotifications,
} = uiSlice.actions;

export default uiSlice.reducer; 