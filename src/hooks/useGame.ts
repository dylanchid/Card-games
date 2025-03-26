import { useDispatch, useSelector } from 'react-redux';
import { useMemo, useCallback } from 'react';
import type { RootState, AppDispatch } from '@/store/store';
import {
  setGamePhase,
  setDeck,
  setTurnupCard,
  setPlayers,
  updateCurrentTrick,
  setCurrentTrickLeader,
  setError,
  setLoading,
  dealCards,
  playCard,
  placeBid,
  revealBid,
  calculateScores,
  setLastAction,
  setGameStarted,
  setCurrentPlayerIndex,
  setRoundNumber,
  setGameMode,
  updateGameSettings,
  addTrickToHistory,
  clearTrickHistory,
  setCurrentTrickCardIds,
} from '@/store/gameSlice';
import type { GamePhase, Player, GameError, GameMode, GameSettings, TrickHistory } from '@/store/gameSlice';
import type { CardType } from '@/types/card';

// Memoized selectors
const selectGamePhase = (state: RootState) => state.game.gamePhase;
const selectDeck = (state: RootState) => state.game.deckIds.map(id => state.game.entities.cards[id]);
const selectTurnupCard = (state: RootState) => state.game.turnupCardId ? state.game.entities.cards[state.game.turnupCardId] : null;
const selectPlayers = (state: RootState) => state.game.playerIds.map(id => state.game.entities.players[id]);
const selectCurrentTrick = (state: RootState) => state.game.currentTrickCardIds.map(id => id ? state.game.entities.cards[id] : null);
const selectCurrentTrickLeader = (state: RootState) => state.game.currentTrickLeader;
const selectError = (state: RootState) => state.game.error;
const selectIsLoading = (state: RootState) => state.game.isLoading;
const selectLastAction = (state: RootState) => state.game.lastAction;
const selectGameStarted = (state: RootState) => state.game.gameStarted;
const selectCurrentPlayerIndex = (state: RootState) => state.game.currentPlayerIndex;
// New selectors
const selectRoundNumber = (state: RootState) => state.game.roundNumber;
const selectGameMode = (state: RootState) => state.game.gameMode;
const selectLastTricks = (state: RootState) => state.game.lastTricks;
const selectGameSettings = (state: RootState) => state.game.gameSettings;

export const useGame = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Selectors with memoization
  const gamePhase = useSelector(selectGamePhase);
  const deck = useSelector(selectDeck);
  const turnupCard = useSelector(selectTurnupCard);
  const players = useSelector(selectPlayers);
  const currentTrick = useSelector(selectCurrentTrick);
  const currentTrickLeader = useSelector(selectCurrentTrickLeader);
  const error = useSelector(selectError);
  const isLoading = useSelector(selectIsLoading);
  const lastAction = useSelector(selectLastAction);
  const gameStarted = useSelector(selectGameStarted);
  const currentPlayerIndex = useSelector(selectCurrentPlayerIndex);
  // New state
  const roundNumber = useSelector(selectRoundNumber);
  const gameMode = useSelector(selectGameMode);
  const lastTricks = useSelector(selectLastTricks);
  const gameSettings = useSelector(selectGameSettings);

  // Memoized actions
  const actions = useMemo(
    () => ({
      setGamePhase: (phase: GamePhase) => dispatch(setGamePhase(phase)),
      setDeck: (cards: CardType[]) => dispatch(setDeck(cards)),
      setTurnupCard: (card: CardType | null) => dispatch(setTurnupCard(card)),
      setPlayers: (players: Player[]) => dispatch(setPlayers(players)),
      updateCurrentTrick: (trick: (CardType | null)[]) => dispatch(updateCurrentTrick(trick)),
      setCurrentTrickLeader: (leader: number) => dispatch(setCurrentTrickLeader(leader)),
      setError: (error: GameError | null) => dispatch(setError(error)),
      setLoading: (loading: boolean) => dispatch(setLoading(loading)),
      setLastAction: (action: string | null) => dispatch(setLastAction(action)),
      setGameStarted: (started: boolean) => dispatch(setGameStarted(started)),
      setCurrentPlayerIndex: (index: number) => dispatch(setCurrentPlayerIndex(index)),
      dealCards: () => dispatch(dealCards()),
      playCard: (playerId: string, card: CardType) => dispatch(playCard({ playerId, card })),
      placeBid: (playerId: string, bidCards: CardType[]) => dispatch(placeBid({ playerId, bidCards })),
      revealBid: (playerId: string) => dispatch(revealBid({ playerId })),
      calculateScores: () => dispatch(calculateScores()),
      // New actions
      setRoundNumber: (round: number) => dispatch(setRoundNumber(round)),
      setGameMode: (mode: GameMode) => dispatch(setGameMode(mode)),
      updateGameSettings: (settings: Partial<GameSettings>) => dispatch(updateGameSettings(settings)),
      addTrickToHistory: (trick: Omit<TrickHistory, 'id' | 'timestamp'>) => dispatch(addTrickToHistory(trick)),
      clearTrickHistory: () => dispatch(clearTrickHistory()),
      setCurrentTrickCardIds: (cardIds: (string | null)[]) => dispatch(setCurrentTrickCardIds(cardIds)),
    }),
    [dispatch]
  );

  // Memoized derived state
  const currentPlayer = useMemo(
    () => players[currentPlayerIndex],
    [players, currentPlayerIndex]
  );

  const isCurrentPlayerActive = useMemo(
    () => currentPlayer?.isActive ?? false,
    [currentPlayer]
  );

  const canPlayCard = useMemo(
    () => gamePhase === 'playing' && isCurrentPlayerActive && !isLoading,
    [gamePhase, isCurrentPlayerActive, isLoading]
  );

  // New derived state
  const isRoundComplete = useMemo(
    () => gameSettings.maxTricks > 0 && lastTricks.length >= gameSettings.maxTricks,
    [gameSettings.maxTricks, lastTricks.length]
  );

  const isGameComplete = useMemo(
    () => gameSettings.maxRounds > 0 && roundNumber > gameSettings.maxRounds,
    [gameSettings.maxRounds, roundNumber]
  );

  // Memoized return value
  return useMemo(
    () => ({
      // State
      gamePhase,
      deck,
      turnupCard,
      players,
      currentTrick,
      currentTrickLeader,
      error,
      isLoading,
      lastAction,
      gameStarted,
      currentPlayerIndex,
      currentPlayer,
      isCurrentPlayerActive,
      canPlayCard,
      // New state
      roundNumber,
      gameMode,
      lastTricks,
      gameSettings,
      isRoundComplete,
      isGameComplete,
      // Actions
      ...actions,
    }),
    [
      gamePhase,
      deck,
      turnupCard,
      players,
      currentTrick,
      currentTrickLeader,
      error,
      isLoading,
      lastAction,
      gameStarted,
      currentPlayerIndex,
      currentPlayer,
      isCurrentPlayerActive,
      canPlayCard,
      roundNumber,
      gameMode,
      lastTricks,
      gameSettings,
      isRoundComplete,
      isGameComplete,
      actions,
    ]
  );
}; 