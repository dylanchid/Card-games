import { CardType, Suit, Rank } from '@/types/card';
import { Player } from '@/store/slices/gameSlice';
import { v4 as uuidv4 } from 'uuid';

export function createDeck(gameType: string = 'standard'): CardType[] {
  if (gameType === 'ninety-nine') {
    return createNinetyNineDeck();
  }
  
  // Standard 52-card deck for other games
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

/**
 * Creates a specialized deck for Ninety-Nine: 37 cards (6 through Ace in each suit + 1 joker)
 */
export function createNinetyNineDeck(): CardType[] {
  const cards: CardType[] = [];
  const ninetyNineRanks = [
    Rank.SIX, Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN, 
    Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
  ];
  
  // Add 6 through Ace for each suit
  Object.values(Suit).forEach((suit, suitIndex) => {
    ninetyNineRanks.forEach((rank, rankIndex) => {
      cards.push({
        id: uuidv4(),
        suit,
        rank,
        isFaceUp: false,
        position: {
          x: 0,
          y: 0,
          zIndex: suitIndex * ninetyNineRanks.length + rankIndex
        },
      });
    });
  });
  
  // Add the joker
  cards.push({
    id: uuidv4(),
    suit: Suit.JOKER,
    rank: Rank.JOKER,
    isFaceUp: false,
    position: {
      x: 0,
      y: 0,
      zIndex: 100
    },
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

  // Set aside turnup card for trump
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
  if (!trick || trick.length === 0) return 0;
  
  let winningCard = trick[0];
  let winnerIndex = 0;

  for (let i = 1; i < trick.length; i++) {
    const currentCard = trick[i];
    if (!currentCard) continue;

    if (currentCard.suit === trumpSuit && winningCard.suit !== trumpSuit) {
      // Trump card beats non-trump
      winningCard = currentCard;
      winnerIndex = i;
    } else if (currentCard.suit === trumpSuit && winningCard.suit === trumpSuit) {
      // Compare two trump cards
      if (getCardValue(currentCard) > getCardValue(winningCard)) {
        winningCard = currentCard;
        winnerIndex = i;
      }
    } else if (currentCard.suit === leadSuit && winningCard.suit !== trumpSuit) {
      // Lead suit beats other non-trump suits
      if (winningCard.suit !== leadSuit || getCardValue(currentCard) > getCardValue(winningCard)) {
        winningCard = currentCard;
        winnerIndex = i;
      }
    } else if (currentCard.suit === winningCard.suit && currentCard.suit !== trumpSuit) {
      // Same suit (not trump or lead), higher value wins
      if (getCardValue(currentCard) > getCardValue(winningCard)) {
        winningCard = currentCard;
        winnerIndex = i;
      }
    }
  }

  return winnerIndex;
}

export function getCardValue(card: CardType): number {
  if (card.rank === Rank.JOKER) return 15; // Joker is highest
  
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
    [Rank.JOKER]: 15, // Add JOKER to the values record
  };
  return values[card.rank] || 0;
}

/**
 * Calculates the bid value based on the bid cards (using suits as numbers)
 * ♣=3, ♥=2, ♠=1, ♦=0
 */
export function calculateBidValue(bidCards: CardType[]): number {
  if (!bidCards || bidCards.length === 0) return 0;
  
  const suitValues: Record<Suit, number> = {
    [Suit.CLUBS]: 3,
    [Suit.HEARTS]: 2,
    [Suit.SPADES]: 1,
    [Suit.DIAMONDS]: 0,
    [Suit.JOKER]: 0 // Add JOKER to the suitValues record
  };
  
  return bidCards.reduce((total, card) => {
    return total + suitValues[card.suit];
  }, 0);
}

/**
 * Calculate player score for Ninety-Nine
 * Accounts for contract fulfillment and declarations
 */
export function calculatePlayerScore(
  player: Player,
  tricksWon: number,
  bidCards: CardType[]
): number {
  // Calculate bid value
  const bidValue = calculateBidValue(bidCards);
  
  // Base score depends on contract fulfillment (winning exactly the number of tricks bid)
  let score = 0;
  
  if (tricksWon === bidValue) {
    // Contract fulfilled - base score of 10 points per trick won
    score = tricksWon * 10;
    
    // Additional bonus for making a contract
    score += 30;
  } else {
    // Failed contract - penalty of 10 points per trick over/under the bid
    const difference = Math.abs(tricksWon - bidValue);
    score = -10 * difference;
  }
  
  // Premium for declarations
  const hasDeclaration = player.hasDeclaration || false;
  if (hasDeclaration) {
    score += 20; // Additional points for successful declaration
  }
  
  return score;
}

export function isGameOver(players: Player[]): boolean {
  // Game ends when a player reaches 100 points
  return players.some(player => player.score >= 100);
}

/**
 * Determines trump suit for the game based on the turnup card
 */
export function determineTrumpSuit(turnupCard: CardType | null): Suit | null {
  if (!turnupCard) return null;
  return turnupCard.suit;
} 