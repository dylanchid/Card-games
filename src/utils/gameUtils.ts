import { CardType, Suit, Rank } from '@/types/card';
import { Player } from '@/store/gameSlice';
import { v4 as uuidv4 } from 'uuid';

export function createDeck(): CardType[] {
  const cards: CardType[] = [];
  Object.values(Suit).forEach((suit, suitIndex) => {
    Object.values(Rank).forEach((rank, rankIndex) => {
      cards.push({
        id: uuidv4(),
        suit,
        rank,
        isFaceUp: false,
        position: {
          x: 0,
          y: 0,
          zIndex: suitIndex * Object.values(Rank).length + rankIndex
        },
      });
    });
  });
  return shuffleDeck(cards);
}

export function shuffleDeck(deck: CardType[]): CardType[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: CardType[], numPlayers: number, cardsPerPlayer: number): {
  hands: CardType[][];
  remainingDeck: CardType[];
  turnupCard: CardType | null;
} {
  const hands: CardType[][] = Array(numPlayers).fill(null).map(() => []);
  
  // Deal cards to each player
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let j = 0; j < numPlayers; j++) {
      const card = deck.pop();
      if (card) {
        hands[j].push({ ...card, isFaceUp: true });
      }
    }
  }

  // Set aside turnup card
  const turnupCard = deck.pop() || null;
  if (turnupCard) {
    turnupCard.isFaceUp = true;
  }

  return {
    hands,
    remainingDeck: deck,
    turnupCard,
  };
}

export function isValidPlay(
  card: CardType,
  currentTrick: (CardType | null)[],
  playerHand: CardType[],
  leadSuit: Suit | null
): boolean {
  // If leading the trick, any card is valid
  if (!leadSuit) return true;

  // If player has a card of the lead suit, they must play it
  const hasLeadSuit = playerHand.some(c => c.suit === leadSuit);
  if (hasLeadSuit && card.suit !== leadSuit) {
    return false;
  }

  return true;
}

export function determineTrickWinner(
  trick: CardType[],
  leadSuit: Suit,
  trumpSuit: Suit | null
): number {
  let winningCard = trick[0];
  let winnerIndex = 0;

  for (let i = 1; i < trick.length; i++) {
    const currentCard = trick[i];
    if (!currentCard) continue;

    if (currentCard.suit === trumpSuit && winningCard.suit !== trumpSuit) {
      winningCard = currentCard;
      winnerIndex = i;
    } else if (currentCard.suit === winningCard.suit) {
      if (getCardValue(currentCard) > getCardValue(winningCard)) {
        winningCard = currentCard;
        winnerIndex = i;
      }
    }
  }

  return winnerIndex;
}

export function getCardValue(card: CardType): number {
  const values: Record<Rank, number> = {
    [Rank.ACE]: 14,
    [Rank.KING]: 13,
    [Rank.QUEEN]: 12,
    [Rank.JACK]: 11,
    [Rank.TEN]: 10,
    [Rank.NINE]: 9,
    [Rank.EIGHT]: 8,
    [Rank.SEVEN]: 7,
    [Rank.SIX]: 6,
    [Rank.FIVE]: 5,
    [Rank.FOUR]: 4,
    [Rank.THREE]: 3,
    [Rank.TWO]: 2,
  };
  return values[card.rank];
}

export function calculatePlayerScore(
  player: Player,
  tricksWon: number,
  bidCards: CardType[]
): number {
  // Basic scoring: 10 points per trick
  const baseScore = tricksWon * 10;

  // Bonus points for successful bid
  const bidBonus = bidCards.length > 0 ? 20 : 0;

  return baseScore + bidBonus;
}

export function isGameOver(players: Player[]): boolean {
  // Game ends when all tricks are played (9 tricks in a standard game)
  const maxTricks = 9;
  const totalTricksWon = players.reduce((sum, player) => sum + player.tricksWon, 0);
  return totalTricksWon >= maxTricks;
} 