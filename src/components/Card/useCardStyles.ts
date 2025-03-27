import { useMemo } from 'react';
import { CardType } from '../../types/card';
import styles from './Card.module.css';

// Add debugging flag
const debugCardStyles = process.env.NODE_ENV === 'development';

/**
 * Custom hook for consistent card styling
 * @param card - The card object to style
 * @param selected - Whether the card is currently selected
 * @param index - Index of the card in a stack or hand for z-index calculation
 * @param style - Additional custom styles to apply
 * @param disabled - Whether the card is disabled (non-interactive)
 * @returns Object containing class names and style object for the card
 */
export const useCardStyles = (
  card: CardType,
  selected: boolean = false,
  index: number = 0,
  style?: React.CSSProperties,
  disabled: boolean = false
) => {
  // Debug card styles processing
  if (debugCardStyles) {
    console.debug('[useCardStyles] Processing card styles:', { 
      cardId: card?.id, 
      selected, 
      index, 
      disabled,
      isFaceUp: card?.isFaceUp,
      hasError: !!card?.error
    });
  }

  // Safety check for card object
  if (!card) {
    console.error('[useCardStyles] Card object is undefined or null');
    return { 
      cardClasses: styles.playingCard + ' ' + styles.error,
      cardStyle: { ...style } 
    };
  }

  const cardClasses = useMemo(() => {
    const classes = [
      styles.playingCard,
    ];

    if (selected) classes.push(styles.selected);
    if (!card.isFaceUp) classes.push(styles.faceDown);
    if (card.error) classes.push(styles.error);
    if (disabled) classes.push(styles.disabled);

    // Directly join with spaces instead of filter(Boolean)
    return classes.join(' ');
  }, [card.isFaceUp, card.error, selected, disabled]);

  const cardStyle = useMemo(() => {
    try {
      const transforms = [];
      
      if (card.position?.x) transforms.push(`translateX(${card.position.x}px)`);
      if (card.position?.y) transforms.push(`translateY(${card.position.y}px)`);
      if (selected && !disabled) transforms.push('translateY(-10px)');
      
      return {
        transform: transforms.length > 0 ? transforms.join(' ') : undefined,
        zIndex: (card.position?.zIndex || 0) + (index || 0),
        ...style,
      };
    } catch (error) {
      console.error('[useCardStyles] Error creating card style:', error, { cardId: card.id });
      return { ...style };
    }
  }, [card.position, selected, index, style, disabled]);

  return { cardClasses, cardStyle };
}; 