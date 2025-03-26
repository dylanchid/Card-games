import { z } from 'zod';

export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES'
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
  TWO = 'TWO'
}

export const SUITS = Object.values(Suit);
export const RANKS = Object.values(Rank);

// Position validation schema
export const PositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  zIndex: z.number().min(0)
});

export interface Position {
  x: number;
  y: number;
  zIndex: number;
}

// Card validation schema
export const CardSchema = z.object({
  id: z.string(),
  suit: z.nativeEnum(Suit),
  rank: z.nativeEnum(Rank),
  isFaceUp: z.boolean(),
  position: PositionSchema,
  stackId: z.string().optional()
});

export interface CardType {
  id: string;
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
  position: Position;
  stackId?: string;
}

// Stack validation schema
export const StackSchema = z.object({
  id: z.string(),
  cards: z.array(CardSchema),
  position: PositionSchema,
  isFaceUp: z.boolean(),
  type: z.enum(['deck', 'hand', 'table', 'discard']),
  owner: z.string().optional()
});

export interface StackType {
  id: string;
  cards: CardType[];
  position: Position;
  isFaceUp: boolean;
  type: 'deck' | 'hand' | 'table' | 'discard';
  owner?: string; // player ID if it's a hand
}

export interface IDeck {
  deal(numPlayers: number): { hands: CardType[][], turnUpCard: CardType };
  getCardsRemaining(): number;
}

export enum GamePhaseType {
  WAITING = 'WAITING',
  BIDDING = 'BIDDING',
  PLAYING = 'PLAYING',
  SCORING = 'SCORING'
}

// Game rules validation
export interface CardMoveRule {
  fromStack: StackType['type'];
  toStack: StackType['type'];
  isValid: (card: CardType, fromStack: StackType, toStack: StackType) => boolean;
}

export const DEFAULT_CARD_MOVE_RULES: CardMoveRule[] = [
  {
    fromStack: 'hand',
    toStack: 'table',
    isValid: (card, fromStack, toStack) => {
      // Only allow face-up cards to be played
      if (!card.isFaceUp) return false;
      
      // Table must be empty or match suit/rank rules
      if (toStack.cards.length === 0) return true;
      const topCard = toStack.cards[toStack.cards.length - 1];
      return card.suit === topCard.suit || card.rank === topCard.rank;
    }
  },
  {
    fromStack: 'deck',
    toStack: 'hand',
    isValid: (card, fromStack, toStack) => {
      // Only allow drawing from deck to hand
      return fromStack.type === 'deck' && toStack.type === 'hand';
    }
  }
];

// Utility functions
export function compareCards(a: CardType, b: CardType): number {
  const rankOrder = Object.values(Rank).reverse();
  const rankDiff = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
  if (rankDiff !== 0) return rankDiff;
  return SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
}

export function cardToString(card: CardType): string {
  return `${card.rank} of ${card.suit}`;
}

export function stringToCard(cardString: string): CardType {
  const [rank, _, suit] = cardString.split(' ');
  return {
    id: Math.random().toString(36).substr(2, 9),
    rank: rank as Rank,
    suit: suit as Suit,
    isFaceUp: true,
    position: { x: 0, y: 0, zIndex: 0 }
  };
}

// Validation functions
export function validatePosition(position: Position): boolean {
  return PositionSchema.safeParse(position).success;
}

export function validateCard(card: CardType): boolean {
  return CardSchema.safeParse(card).success;
}

export function validateStack(stack: StackType): boolean {
  return StackSchema.safeParse(stack).success;
}

export function isValidCardMove(card: CardType, fromStack: StackType, toStack: StackType): boolean {
  const rule = DEFAULT_CARD_MOVE_RULES.find(
    r => r.fromStack === fromStack.type && r.toStack === toStack.type
  );
  return rule ? rule.isValid(card, fromStack, toStack) : false;
} 