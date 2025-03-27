import { CardType, Rank, Suit } from '../types/card';
import { GameOptions } from '../components/PreGameScreen';
import { v4 as uuidv4 } from 'uuid';
import { createNinetyNineDeck, dealCards } from './gameUtils';

interface NinetyNinePlayer {
  id: string;
  name: string;
  handIds: string[];
  bidCardIds: string[];
  revealBid: boolean;
  tricksWon: number;
  score: number;
  isActive: boolean;
  hasDeclaration: boolean;
  isAI?: boolean;
  rating?: number;
  aiLevel?: string;
}

/**
 * Initializes a new Ninety-Nine game with the given options
 */
export function initializeNinetyNineGame(options: GameOptions) {
  // Create player objects based on player count and names
  const players: NinetyNinePlayer[] = Array.from({ length: options.playerCount }).map((_, i) => {
    // For vs-computer mode, mark all players except the first as AI
    const isAI = options.gameMode === 'vs-computer' && i > 0;
    
    return {
      id: uuidv4(),
      name: options.playerNames[i] || `Player ${i + 1}`,
      handIds: [],
      bidCardIds: [],
      revealBid: false,
      tricksWon: 0,
      score: 0,
      isActive: i === 0,
      hasDeclaration: false,
      isAI: isAI,
      rating: options.gameMode === 'ranked' ? 1000 : undefined, // Initial rating for ranked mode
      aiLevel: isAI ? 'medium' : undefined, // AI difficulty level
    };
  });

  const playerIds = players.map(player => player.id);

  // Create and shuffle a deck specifically for Ninety-Nine
  const deck = createNinetyNineDeck();
  
  // Deal cards to players
  const { hands, remainingDeck, turnupCard } = dealCards(deck, options.playerCount, options.cardsPerPlayer);
  
  // Create cards entity map and update player hands
  const cardsEntity: Record<string, CardType> = {};
  
  // Process all cards (hands, turnup, and remaining deck)
  hands.forEach((hand, playerIndex) => {
    // Add each card to the entities
    hand.forEach(card => {
      cardsEntity[card.id] = card;
      // Add card ID to the player's hand
      players[playerIndex].handIds.push(card.id);
    });
  });
  
  // Add remaining deck cards to entities
  remainingDeck.forEach(card => {
    cardsEntity[card.id] = card;
  });
  
  // Add turnup card if present
  let turnupCardId = null;
  if (turnupCard) {
    cardsEntity[turnupCard.id] = turnupCard;
    turnupCardId = turnupCard.id;
  }
  
  // Create initial game state
  return {
    entities: {
      players: players.reduce((acc, player) => ({
        ...acc,
        [player.id]: player
      }), {}),
      cards: cardsEntity
    },
    playerIds,
    deckIds: remainingDeck.map(card => card.id),
    turnupCardId: turnupCardId,
    gamePhase: 'bidding', // Start with bidding phase
    currentPlayerIndex: 0,
    currentTrickCardIds: Array(players.length).fill(null),
    currentTrickSuit: null,
    currentTrickWinner: null,
    currentTrickLeader: 0,
    tricksPlayed: 0,
    isLoading: false,
    error: null,
    lastAction: null,
    gameStarted: true,
    roundNumber: 1,
    gameMode: options.gameMode,
    isRanked: options.gameMode === 'ranked',
    hasAI: options.gameMode === 'vs-computer',
    lastTricks: [],
    trumpSuit: turnupCard ? turnupCard.suit : null,
    gameSettings: {
      maxRounds: options.maxRounds,
      maxTricks: 12,
      cardsPerPlayer: options.cardsPerPlayer,
      allowTrump: options.allowTrump,
      allowNoTrump: true,
      allowPartnership: false,
      scoringSystem: 'standard',
      timeLimit: options.timeLimit,
      autoPlay: options.gameMode === 'vs-computer', // Auto-play for AI players
    }
  };
}

/**
 * Calculates the bid value in the Ninety-Nine game
 */
export function calculateBidValue(bidCards: CardType[]): number {
  if (!bidCards || bidCards.length === 0) {
    return 0;
  }

  // Calculate base points for bid cards
  return bidCards.reduce((total, card) => {
    switch (card.rank) {
      case Rank.ACE:
        return total + 1;
      case Rank.KING:
        return total + 2;
      case Rank.QUEEN:
        return total + 3;
      case Rank.JACK:
        return total + 4;
      case Rank.TEN:
        return total + 5;
      case Rank.NINE:
        return total + 6;
      default:
        return total;
    }
  }, 0);
}

/**
 * Checks for special combinations in Ninety-Nine bids
 */
export function checkSpecialBid(bidCards: CardType[]): string | null {
  if (bidCards.length < 2) {
    return null;
  }

  // Check for marriage (King and Queen of the same suit)
  const hasMarriage = Object.values(Suit).some(suit => {
    const suitCards = bidCards.filter(card => card.suit === suit);
    return suitCards.some(card => card.rank === Rank.KING) && 
           suitCards.some(card => card.rank === Rank.QUEEN);
  });

  if (hasMarriage) {
    return 'MARRIAGE';
  }

  // Check for run (three consecutive cards of the same suit)
  const suits = Object.values(Suit);
  for (const suit of suits) {
    const suitCards = bidCards.filter(card => card.suit === suit);
    if (suitCards.length >= 3) {
      const ranks = suitCards.map(card => getRankValue(card.rank)).sort((a, b) => a - b);
      
      // Check for consecutive ranks
      for (let i = 0; i < ranks.length - 2; i++) {
        if (ranks[i + 1] === ranks[i] + 1 && ranks[i + 2] === ranks[i] + 2) {
          return 'RUN';
        }
      }
    }
  }

  // Check for three of a kind (three cards of the same rank)
  const rankCounts: Record<string, number> = {};
  bidCards.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });

  if (Object.values(rankCounts).some(count => count >= 3)) {
    return 'THREE_OF_A_KIND';
  }

  return null;
}

/**
 * Gets the numerical value of a rank for comparison
 */
export function getRankValue(rank: Rank): number {
  const rankValues: Record<Rank, number> = {
    [Rank.TWO]: 2,
    [Rank.THREE]: 3,
    [Rank.FOUR]: 4,
    [Rank.FIVE]: 5,
    [Rank.SIX]: 6,
    [Rank.SEVEN]: 7,
    [Rank.EIGHT]: 8,
    [Rank.NINE]: 9,
    [Rank.TEN]: 10,
    [Rank.JACK]: 11,
    [Rank.QUEEN]: 12,
    [Rank.KING]: 13,
    [Rank.ACE]: 14
  };

  return rankValues[rank] || 0;
}

/**
 * Calculates player score based on tricks won and bid
 */
export function calculateNinetyNineScore(tricksWon: number, bidValue: number, specialBid: string | null): number {
  let score = tricksWon * 10; // Each trick is worth 10 points
  
  // Add bonus for matching bid exactly
  if (tricksWon === Math.floor(bidValue / 10)) {
    score += 10;
  }
  
  // Add bonus for special bids
  if (specialBid) {
    switch (specialBid) {
      case 'MARRIAGE':
        score += 20;
        break;
      case 'RUN':
        score += 30;
        break;
      case 'THREE_OF_A_KIND':
        score += 40;
        break;
    }
  }
  
  return score;
}

/**
 * Formats the time remaining for display
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) {
    return '0:00';
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Checks if a player has a valid declaration (special bid)
 */
export function hasValidDeclaration(bidCards: CardType[]): boolean {
  return checkSpecialBid(bidCards) !== null;
} 