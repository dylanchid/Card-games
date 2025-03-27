import { useMemo } from 'react';
import { CardType } from '../../types/card';
import styles from './Card.module.css';

export const useCardStyles = (
  card: CardType,
  selected: boolean = false,
  index: number = 0,
  style?: React.CSSProperties,
  disabled: boolean = false
) => {
  const cardClasses = useMemo(() => {
    const classes = [
      styles.playingCard,
    ];

    if (selected) classes.push(styles.selected);
    if (!card.isFaceUp) classes.push(styles.faceDown);
    if (card.error) classes.push(styles.error);
    if (disabled) classes.push(styles.disabled);

    return classes.filter(Boolean).join(' ');
  }, [card, selected, disabled]);

  const cardStyle = useMemo(() => {
    const transforms = [];
    
    if (card.position.x) transforms.push(`translateX(${card.position.x}px)`);
    if (card.position.y) transforms.push(`translateY(${card.position.y}px)`);
    if (selected && !disabled) transforms.push('translateY(-10px)');
    
    return {
      transform: transforms.length > 0 ? transforms.join(' ') : undefined,
      zIndex: card.position.zIndex + (index || 0),
      ...style,
    };
  }, [card.position, selected, index, style, disabled]);

  return { cardClasses, cardStyle };
}; 