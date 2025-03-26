'use client';

import { GameBoard } from '@/components/GameBoard';
import { StackType, CardType, Suit, Rank } from '@/types/card';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

function createDeck(): CardType[] {
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
  return cards;
}

export default function Home() {
  const [stacks, setStacks] = useState<StackType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeGame = () => {
      const deckStack: StackType = {
        id: 'deck',
        cards: createDeck(),
        position: { x: 0, y: 0, zIndex: 1 },
        isFaceUp: false,
        type: 'deck',
        cardCount: 52,
      };

      const testStack: StackType = {
        id: 'test',
        cards: [],
        position: { x: 0, y: 0, zIndex: 1 },
        isFaceUp: true,
        type: 'table',
        cardCount: 0,
      };

      setStacks([deckStack, testStack]);
      setIsLoading(false);
    };

    initializeGame();
  }, []);

  const handleCardMove = (card: CardType, fromStackId: string, toStackId: string) => {
    setStacks(prevStacks => {
      const fromStack = prevStacks.find(s => s.id === fromStackId);
      const toStack = prevStacks.find(s => s.id === toStackId);
      
      if (!fromStack || !toStack) return prevStacks;

      const cardIndex = fromStack.cards.findIndex(c => c.id === card.id);
      if (cardIndex === -1) return prevStacks;

      const updatedCard = {
        ...card,
        isFaceUp: toStack.isFaceUp,
        position: {
          x: 0,
          y: 0,
          zIndex: toStack.cards.length + 1
        }
      };

      return prevStacks.map(stack => {
        if (stack.id === fromStackId) {
          return {
            ...stack,
            cards: stack.cards.filter(c => c.id !== card.id),
            cardCount: stack.cardCount - 1
          };
        }
        if (stack.id === toStackId) {
          return {
            ...stack,
            cards: [...stack.cards, updatedCard],
            cardCount: stack.cardCount + 1
          };
        }
        return stack;
      });
    });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-green-800 overflow-hidden">
      <div className="w-full h-full relative">
        <GameBoard 
          stacks={stacks} 
          onCardMove={handleCardMove} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
