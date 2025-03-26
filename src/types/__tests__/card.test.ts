import { 
  Suit, 
  Rank, 
  CardSchema, 
  StackSchema, 
  getCardValue, 
  isFaceCard, 
  getCardColor,
  validatePosition,
  validateCard,
  validateStack,
  isValidCardMove,
  compareCards,
  stringToCard,
  cardToString,
  createCardAnimation,
  updateCardAnimation,
  completeCardAnimation,
  createCardError,
  clearCardError,
  setCardLoading
} from '../card';

describe('Card Types and Utilities', () => {
  describe('Enums', () => {
    test('Suit enum contains all valid values', () => {
      expect(Object.values(Suit)).toHaveLength(4);
      expect(Suit.HEARTS).toBe('HEARTS');
      expect(Suit.DIAMONDS).toBe('DIAMONDS');
      expect(Suit.CLUBS).toBe('CLUBS');
      expect(Suit.SPADES).toBe('SPADES');
    });

    test('Rank enum contains all valid values', () => {
      expect(Object.values(Rank)).toHaveLength(13);
      expect(Rank.ACE).toBe('ACE');
      expect(Rank.KING).toBe('KING');
      expect(Rank.QUEEN).toBe('QUEEN');
      expect(Rank.JACK).toBe('JACK');
      expect(Rank.TEN).toBe('TEN');
      expect(Rank.NINE).toBe('NINE');
      expect(Rank.EIGHT).toBe('EIGHT');
      expect(Rank.SEVEN).toBe('SEVEN');
      expect(Rank.SIX).toBe('SIX');
      expect(Rank.FIVE).toBe('FIVE');
      expect(Rank.FOUR).toBe('FOUR');
      expect(Rank.THREE).toBe('THREE');
      expect(Rank.TWO).toBe('TWO');
    });
  });

  describe('Card Validation', () => {
    const validCard = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      suit: Suit.HEARTS,
      rank: Rank.ACE,
      isFaceUp: true,
      position: { x: 0, y: 0, zIndex: 0 }
    };

    test('CardSchema validates correct card', () => {
      const result = CardSchema.safeParse(validCard);
      expect(result.success).toBe(true);
    });

    test('CardSchema rejects invalid card', () => {
      const invalidCard = {
        ...validCard,
        suit: 'INVALID_SUIT'
      };
      const result = CardSchema.safeParse(invalidCard);
      expect(result.success).toBe(false);
    });

    test('validateCard function works correctly', () => {
      expect(validateCard(validCard)).toBe(true);
      expect(validateCard({ ...validCard, suit: 'INVALID_SUIT' as any })).toBe(false);
    });
  });

  describe('Stack Validation', () => {
    const validStack = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      cards: [],
      position: { x: 0, y: 0, zIndex: 0 },
      isFaceUp: true,
      type: 'deck' as const,
      cardCount: 0
    };

    test('StackSchema validates correct stack', () => {
      const result = StackSchema.safeParse(validStack);
      expect(result.success).toBe(true);
    });

    test('StackSchema rejects invalid stack', () => {
      const invalidStack = {
        ...validStack,
        type: 'INVALID_TYPE'
      };
      const result = StackSchema.safeParse(invalidStack);
      expect(result.success).toBe(false);
    });

    test('validateStack function works correctly', () => {
      expect(validateStack(validStack)).toBe(true);
      expect(validateStack({ ...validStack, type: 'INVALID_TYPE' as any })).toBe(false);
    });
  });

  describe('Card Utility Functions', () => {
    const testCard = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      suit: Suit.HEARTS,
      rank: Rank.ACE,
      isFaceUp: true,
      position: { x: 0, y: 0, zIndex: 0 }
    };

    test('getCardValue returns correct value', () => {
      expect(getCardValue(testCard)).toBe(1);
      expect(getCardValue({ ...testCard, rank: Rank.KING })).toBe(13);
    });

    test('isFaceCard identifies face cards', () => {
      expect(isFaceCard(testCard)).toBe(false);
      expect(isFaceCard({ ...testCard, rank: Rank.KING })).toBe(true);
      expect(isFaceCard({ ...testCard, rank: Rank.QUEEN })).toBe(true);
      expect(isFaceCard({ ...testCard, rank: Rank.JACK })).toBe(true);
    });

    test('getCardColor returns correct color', () => {
      expect(getCardColor(testCard)).toBe('red');
      expect(getCardColor({ ...testCard, suit: Suit.DIAMONDS })).toBe('red');
      expect(getCardColor({ ...testCard, suit: Suit.CLUBS })).toBe('black');
      expect(getCardColor({ ...testCard, suit: Suit.SPADES })).toBe('black');
    });

    test('validatePosition validates positions', () => {
      expect(validatePosition({ x: 0, y: 0, zIndex: 0 })).toBe(true);
      expect(validatePosition({ x: -1, y: 0, zIndex: 0 })).toBe(false);
      expect(validatePosition({ x: 0, y: -1, zIndex: 0 })).toBe(false);
      expect(validatePosition({ x: 0, y: 0, zIndex: -1 })).toBe(false);
    });

    test('cardToString and stringToCard work correctly', () => {
      const cardString = cardToString(testCard);
      expect(cardString).toBe('ACE of HEARTS');
      
      const convertedCard = stringToCard(cardString);
      expect(convertedCard.rank).toBe(testCard.rank);
      expect(convertedCard.suit).toBe(testCard.suit);
    });

    test('card animation utilities work correctly', () => {
      const animatedCard = createCardAnimation(testCard, 'flip');
      expect(animatedCard.isAnimating).toBe(true);
      expect(animatedCard.animationType).toBe('flip');
      expect(animatedCard.animationProgress).toBe(0);

      const updatedCard = updateCardAnimation(animatedCard, 0.5);
      expect(updatedCard.animationProgress).toBe(0.5);

      const completedCard = completeCardAnimation(updatedCard);
      expect(completedCard.isAnimating).toBe(false);
      expect(completedCard.animationType).toBeUndefined();
      expect(completedCard.animationProgress).toBeUndefined();
    });

    test('card error utilities work correctly', () => {
      const errorCard = createCardError(testCard, 'Test error');
      expect(errorCard.error).toBe('Test error');
      expect(errorCard.isLoading).toBe(false);
      expect(errorCard.isAnimating).toBe(false);

      const clearedCard = clearCardError(errorCard);
      expect(clearedCard.error).toBeUndefined();
    });

    test('card loading utilities work correctly', () => {
      const loadingCard = setCardLoading(testCard, true);
      expect(loadingCard.isLoading).toBe(true);
      expect(loadingCard.error).toBeUndefined();

      const notLoadingCard = setCardLoading(loadingCard, false);
      expect(notLoadingCard.isLoading).toBe(false);
    });

    test('compareCards sorts cards correctly', () => {
      const cards = [
        { ...testCard, rank: Rank.ACE },
        { ...testCard, rank: Rank.KING },
        { ...testCard, rank: Rank.QUEEN }
      ];
      
      const sortedCards = [...cards].sort(compareCards);
      expect(sortedCards[0].rank).toBe(Rank.KING);
      expect(sortedCards[1].rank).toBe(Rank.QUEEN);
      expect(sortedCards[2].rank).toBe(Rank.ACE);
    });
  });

  describe('Card Move Validation', () => {
    const sourceStack = {
      id: 'source',
      cards: [],
      position: { x: 0, y: 0, zIndex: 0 },
      isFaceUp: true,
      type: 'hand' as const,
      cardCount: 0
    };

    const targetStack = {
      id: 'target',
      cards: [],
      position: { x: 0, y: 0, zIndex: 0 },
      isFaceUp: true,
      type: 'table' as const,
      cardCount: 0
    };

    const testCard = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      suit: Suit.HEARTS,
      rank: Rank.ACE,
      isFaceUp: true,
      position: { x: 0, y: 0, zIndex: 0 }
    };

    test('isValidCardMove validates moves correctly', () => {
      expect(isValidCardMove(testCard, sourceStack, targetStack)).toBe(true);
      expect(isValidCardMove({ ...testCard, isFaceUp: false }, sourceStack, targetStack)).toBe(false);
    });
  });
}); 