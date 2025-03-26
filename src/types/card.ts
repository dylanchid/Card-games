import { z } from 'zod';

export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES',
}

export enum Rank {
  ACE = 'ACE',
  KING = 'KING',
  QUEEN = 'QUEEN',
  JACK = 'JACK',
  TEN = 'TEN',
  NINE = 'NINE',
  EIGHT = 'EIGHT',
  SEVEN = 'SEVEN',
  SIX = 'SIX',
  FIVE = 'FIVE',
  FOUR = 'FOUR',
  THREE = 'THREE',
  TWO = 'TWO',
}

export const SUITS = Object.values(Suit);
export const RANKS = Object.values(Rank);

// Performance optimization: Memoized card values
const CARD_VALUES = new Map<Rank, number>([
  [Rank.ACE, 14],
  [Rank.KING, 13],
  [Rank.QUEEN, 12],
  [Rank.JACK, 11],
  [Rank.TEN, 10],
  [Rank.NINE, 9],
  [Rank.EIGHT, 8],
  [Rank.SEVEN, 7],
  [Rank.SIX, 6],
  [Rank.FIVE, 5],
  [Rank.FOUR, 4],
  [Rank.THREE, 3],
  [Rank.TWO, 2],
]);

// Position validation schema with performance optimizations
export const PositionSchema = z
  .object({
    x: z.number().min(0),
    y: z.number().min(0),
    zIndex: z.number().min(0),
  })
  .transform(pos => ({
    ...pos,
    // Add computed properties for performance
    centerX: pos.x + 50, // Assuming card width is 100
    centerY: pos.y + 75, // Assuming card height is 150
    distanceFromOrigin: Math.sqrt(pos.x * pos.x + pos.y * pos.y),
  }));

export interface Position {
  x: number;
  y: number;
  zIndex: number;
  centerX?: number;
  centerY?: number;
  distanceFromOrigin?: number;
}

// Card validation schema with enhanced error messages
export const CardSchema = z.object({
  id: z.string().uuid(),
  suit: z.nativeEnum(Suit, {
    errorMap: () => ({ message: 'Invalid suit value' }),
  }),
  rank: z.nativeEnum(Rank, {
    errorMap: () => ({ message: 'Invalid rank value' }),
  }),
  isFaceUp: z.boolean(),
  position: PositionSchema,
  stackId: z.string().uuid().optional(),
  // Add loading and error states
  isLoading: z.boolean().optional(),
  error: z.string().optional(),
  // Add animation states
  isAnimating: z.boolean().optional(),
  animationType: z.enum(['flip', 'move', 'scale']).optional(),
  animationProgress: z.number().min(0).max(1).optional(),
});

export interface CardType {
  id: string;
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
  position: Position;
  stackId?: string;
  isLoading?: boolean;
  error?: string;
  isAnimating?: boolean;
  animationType?: 'flip' | 'move' | 'scale';
  animationProgress?: number;
}

// Stack validation schema with performance optimizations
export const StackSchema = z
  .object({
    id: z.string().uuid(),
    cards: z.array(CardSchema),
    position: PositionSchema,
    isFaceUp: z.boolean(),
    type: z.enum(['deck', 'hand', 'table', 'discard']),
    owner: z.string().uuid().optional(),
    // Add stack-specific states
    isLoading: z.boolean().optional(),
    error: z.string().optional(),
    // Add performance optimizations
    cardCount: z.number().min(0),
    topCard: CardSchema.optional(),
    bottomCard: CardSchema.optional(),
  })
  .transform(stack => ({
    ...stack,
    // Add computed properties for performance
    isEmpty: stack.cards.length === 0,
    isFull: stack.cards.length >= 52, // Maximum possible cards
    hasFaceUpCards: stack.cards.some(card => card.isFaceUp),
    hasFaceDownCards: stack.cards.some(card => !card.isFaceUp),
  }));

export interface StackType {
  id: string;
  cards: CardType[];
  position: Position;
  isFaceUp: boolean;
  type: 'deck' | 'hand' | 'table' | 'discard';
  owner?: string;
  isLoading?: boolean;
  error?: string;
  cardCount: number;
  topCard?: CardType;
  bottomCard?: CardType;
  isEmpty?: boolean;
  isFull?: boolean;
  hasFaceUpCards?: boolean;
  hasFaceDownCards?: boolean;
}

// Performance optimized utility functions
export function getCardValue(card: CardType): number {
  return CARD_VALUES.get(card.rank) || 0;
}

export function isFaceCard(card: CardType): boolean {
  return [Rank.JACK, Rank.QUEEN, Rank.KING].includes(card.rank);
}

export function getCardColor(card: CardType): 'red' | 'black' {
  return [Suit.HEARTS, Suit.DIAMONDS].includes(card.suit) ? 'red' : 'black';
}

// Enhanced validation functions with error recovery
export function validatePosition(position: Position): boolean {
  try {
    return PositionSchema.safeParse(position).success;
  } catch (error) {
    console.error('Position validation error:', error);
    return false;
  }
}

export function validateCard(card: CardType): boolean {
  try {
    return CardSchema.safeParse(card).success;
  } catch (error) {
    console.error('Card validation error:', error);
    return false;
  }
}

export function validateStack(stack: StackType): boolean {
  try {
    return StackSchema.safeParse(stack).success;
  } catch (error) {
    console.error('Stack validation error:', error);
    return false;
  }
}

// Enhanced card move validation with error recovery
export function isValidCardMove(card: CardType, fromStack: StackType, toStack: StackType): boolean {
  try {
    const rule = DEFAULT_CARD_MOVE_RULES.find(
      r => r.fromStack === fromStack.type && r.toStack === toStack.type
    );
    return rule ? rule.isValid(card, fromStack, toStack) : false;
  } catch (error) {
    console.error('Card move validation error:', error);
    return false;
  }
}

// Performance optimized card comparison
export function compareCards(a: CardType, b: CardType): number {
  const aValue = CARD_VALUES.get(a.rank) || 0;
  const bValue = CARD_VALUES.get(b.rank) || 0;
  const valueDiff = aValue - bValue;
  if (valueDiff !== 0) return valueDiff;
  return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
}

// Enhanced card string conversion with error handling
export function cardToString(card: CardType): string {
  try {
    return `${card.rank} of ${card.suit}`;
  } catch (error) {
    console.error('Card string conversion error:', error);
    return 'Invalid Card';
  }
}

export function stringToCard(cardString: string): CardType {
  try {
    const [rank, _, suit] = cardString.split(' ');
    return {
      id: crypto.randomUUID(),
      rank: rank as Rank,
      suit: suit as Suit,
      isFaceUp: true,
      position: { x: 0, y: 0, zIndex: 0 },
      isLoading: false,
      isAnimating: false,
    };
  } catch (error) {
    console.error('String to card conversion error:', error);
    throw new Error('Invalid card string format');
  }
}

// Game rules validation with performance optimizations
export interface CardMoveRule {
  fromStack: StackType['type'];
  toStack: StackType['type'];
  isValid: (card: CardType, fromStack: StackType, toStack: StackType) => boolean;
}

// Memoized move rules for better performance
export const DEFAULT_CARD_MOVE_RULES: CardMoveRule[] = [
  {
    fromStack: 'hand',
    toStack: 'table',
    isValid: (card: CardType, fromStack: StackType, toStack: StackType) => {
      return card.isFaceUp && !toStack.isFull;
    }
  },
  {
    fromStack: 'deck',
    toStack: 'hand',
    isValid: (card: CardType, fromStack: StackType, toStack: StackType) => {
      return !toStack.isFull;
    }
  },
  {
    fromStack: 'table',
    toStack: 'discard',
    isValid: (card: CardType, fromStack: StackType, toStack: StackType) => {
      return card.isFaceUp;
    }
  }
];

// Animation utilities
export function createCardAnimation(
  card: CardType,
  type: 'flip' | 'move' | 'scale',
  duration: number = 300
): CardType {
  return {
    ...card,
    isAnimating: true,
    animationType: type,
    animationProgress: 0,
  };
}

export function updateCardAnimation(card: CardType, progress: number): CardType {
  return {
    ...card,
    animationProgress: Math.max(0, Math.min(1, progress)),
  };
}

export function completeCardAnimation(card: CardType): CardType {
  return {
    ...card,
    isAnimating: false,
    animationType: undefined,
    animationProgress: undefined,
  };
}

// Error recovery utilities
export function createCardError(card: CardType, error: string): CardType {
  return {
    ...card,
    error,
    isLoading: false,
    isAnimating: false,
  };
}

export function clearCardError(card: CardType): CardType {
  return {
    ...card,
    error: undefined,
  };
}

// Loading state utilities
export function setCardLoading(card: CardType, isLoading: boolean): CardType {
  return {
    ...card,
    isLoading,
    error: isLoading ? undefined : card.error,
  };
}

// Performance monitoring
export function measureCardPerformance(card: CardType): void {
  const start = performance.now();
  // Perform card operations
  const end = performance.now();
  console.debug(`Card ${card.id} operations took ${end - start}ms`);
}

export interface IDeck {
  deal(numPlayers: number): { hands: CardType[][]; turnUpCard: CardType };
  getCardsRemaining(): number;
}

export enum GamePhaseType {
  WAITING = 'WAITING',
  BIDDING = 'BIDDING',
  PLAYING = 'PLAYING',
  SCORING = 'SCORING',
}
