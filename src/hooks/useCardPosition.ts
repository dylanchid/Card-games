import { useMemo } from 'react';
import { StackType } from '@/types/card';

export function useCardPosition(stack: StackType, index: number) {
  return useMemo(() => {
    if (stack.type === 'deck') {
      return {
        position: 'absolute' as const,
        top: `${index * 0.2}px`,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'none',
        zIndex: stack.cards.length - index,
      };
    } else if (stack.type === 'hand') {
      return {
        position: 'relative' as const,
        transform: `translateX(${index * 30}px)`,
        zIndex: stack.cards.length - index
      };
    } else {
      return {
        position: 'absolute' as const,
        transform: `translate(-50%, -50%) translateY(${index * 2}px)`,
        top: '50%',
        left: '50%',
        zIndex: stack.cards.length - index
      };
    }
  }, [stack.type, index, stack.cards.length]);
}