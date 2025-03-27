import { renderHook } from '@testing-library/react-hooks';
import { useCardStyles } from './useCardStyles';
import { CardType, Rank, Suit, Position } from '../../types/card';

// Mock the CSS module
jest.mock('./Card.module.css', () => ({
  playingCard: 'playingCard',
  selected: 'selected',
  faceDown: 'faceDown',
  error: 'error',
  disabled: 'disabled'
}));

describe('useCardStyles', () => {
  const mockCard: CardType = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    suit: Suit.HEARTS,
    rank: Rank.ACE,
    isFaceUp: true,
    position: { x: 10, y: 20, zIndex: 1 },
  };

  test('should return correct classes for default card', () => {
    const { result } = renderHook(() => useCardStyles(mockCard));
    
    expect(result.current.cardClasses).toContain('playingCard');
    expect(result.current.cardClasses).not.toContain('selected');
    expect(result.current.cardClasses).not.toContain('faceDown');
    expect(result.current.cardClasses).not.toContain('error');
    expect(result.current.cardClasses).not.toContain('disabled');
  });

  test('should return correct classes for selected card', () => {
    const { result } = renderHook(() => useCardStyles(mockCard, true));
    
    expect(result.current.cardClasses).toContain('playingCard');
    expect(result.current.cardClasses).toContain('selected');
  });

  test('should return correct classes for face down card', () => {
    const faceDownCard = { ...mockCard, isFaceUp: false };
    const { result } = renderHook(() => useCardStyles(faceDownCard));
    
    expect(result.current.cardClasses).toContain('playingCard');
    expect(result.current.cardClasses).toContain('faceDown');
  });

  test('should return correct classes for card with error', () => {
    const errorCard = { ...mockCard, error: 'Some error' };
    const { result } = renderHook(() => useCardStyles(errorCard));
    
    expect(result.current.cardClasses).toContain('playingCard');
    expect(result.current.cardClasses).toContain('error');
  });

  test('should return correct classes for disabled card', () => {
    const { result } = renderHook(() => useCardStyles(mockCard, false, 0, {}, true));
    
    expect(result.current.cardClasses).toContain('playingCard');
    expect(result.current.cardClasses).toContain('disabled');
  });

  test('should handle null card gracefully', () => {
    // @ts-ignore - testing with null
    const { result } = renderHook(() => useCardStyles(null));
    
    expect(result.current.cardClasses).toContain('playingCard');
    expect(result.current.cardClasses).toContain('error');
  });

  test('should apply position transforms to style', () => {
    const { result } = renderHook(() => useCardStyles(mockCard));
    
    expect(result.current.cardStyle.transform).toContain('translateX(10px)');
    expect(result.current.cardStyle.transform).toContain('translateY(20px)');
    expect(result.current.cardStyle.zIndex).toBe(1);
  });

  test('should apply selected transform if selected and not disabled', () => {
    const { result } = renderHook(() => useCardStyles(mockCard, true));
    
    expect(result.current.cardStyle.transform).toContain('translateY(-10px)');
  });

  test('should not apply selected transform if disabled', () => {
    const { result } = renderHook(() => useCardStyles(mockCard, true, 0, {}, true));
    
    expect(result.current.cardStyle.transform).not.toContain('translateY(-10px)');
  });

  test('should merge custom styles', () => {
    const customStyle = { color: 'red', backgroundColor: 'blue' };
    const { result } = renderHook(() => useCardStyles(mockCard, false, 0, customStyle));
    
    expect(result.current.cardStyle.color).toBe('red');
    expect(result.current.cardStyle.backgroundColor).toBe('blue');
  });

  test('should handle cards without position gracefully', () => {
    // Create a card without position that satisfies the type requirements
    const cardWithoutPosition = {
      ...mockCard,
      // Create an empty position object that satisfies the Position type
      position: undefined as unknown as Position
    };
    
    // Use @ts-ignore to bypass the type check for this test
    // @ts-ignore - Testing edge case where position is undefined
    const { result } = renderHook(() => useCardStyles(cardWithoutPosition));
    
    expect(result.current.cardStyle.transform).toBe(undefined);
    expect(result.current.cardStyle.zIndex).toBe(0);
  });
}); 