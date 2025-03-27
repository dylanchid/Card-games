'use client';

import React, { useState, useEffect } from 'react';
import { useGame } from './GameProvider';
import { CardType, StackType } from '../types/card';
import { Card } from './Card/Card';
import './GameBoard.css';

interface GameBoardProps {
  className?: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({ className }) => {
  const { 
    currentGame, 
    gameState, 
    isLoading, 
    performAction,
    getAvailableActions
  } = useGame();
  
  const [stacks, setStacks] = useState<StackType[]>([]);
  const [dragCard, setDragCard] = useState<CardType | null>(null);
  const [dragOrigin, setDragOrigin] = useState<{ stackId: string; x: number; y: number } | null>(null);

  // Initialize stacks based on game state
  useEffect(() => {
    if (!gameState || !currentGame) return;

    // Convert game state to stacks
    const gameStacks: StackType[] = [];
    
    // Add deck stack if it exists in game state
    if (gameState.deckIds && gameState.deckIds.length > 0) {
      const deckCards = gameState.deckIds.map((id: string) => gameState.entities.cards[id]);
      
      gameStacks.push({
        id: 'deck',
        cards: deckCards,
        position: { x: 50, y: 50, zIndex: 1 },
        isFaceUp: false,
        type: 'deck',
        cardCount: deckCards.length
      });
    }
    
    // Add table stack
    gameStacks.push({
      id: 'table',
      cards: gameState.currentTrickCardIds 
        ? gameState.currentTrickCardIds
            .filter((id: string | null) => id !== null)
            .map((id: string) => gameState.entities.cards[id])
        : [],
      position: { x: 200, y: 200, zIndex: 1 },
      isFaceUp: true,
      type: 'table',
      cardCount: gameState.currentTrickCardIds?.filter((id: string | null) => id !== null).length || 0
    });
    
    // Add player hands
    if (gameState.entities.players) {
      gameState.playerIds.forEach((playerId: string, index: number) => {
        const player = gameState.entities.players[playerId];
        const handCards = player.handIds.map((id: string) => gameState.entities.cards[id]);
        
        // Position hands based on player index and game UI layout
        const position = getPlayerPosition(index, gameState.playerIds.length, currentGame.ui.layout);
        
        gameStacks.push({
          id: `player-${playerId}`,
          cards: handCards,
          position,
          isFaceUp: true,
          type: 'hand',
          cardCount: handCards.length,
          owner: playerId
        });
      });
    }
    
    setStacks(gameStacks);
  }, [gameState, currentGame]);

  // Function to get player position based on game layout
  const getPlayerPosition = (playerIndex: number, totalPlayers: number, layout: string) => {
    const baseX = 400;
    const baseY = 400;
    const radius = 300;
    
    // For circular layout, position players in a circle
    if (layout === 'circular') {
      const angle = (playerIndex * 2 * Math.PI / totalPlayers) - Math.PI/2;
      return {
        x: baseX + radius * Math.cos(angle),
        y: baseY + radius * Math.sin(angle),
        zIndex: 1
      };
    }
    
    // For rectangular layout, position players on the sides
    if (layout === 'rectangle') {
      const positions = [
        { x: baseX, y: baseY + radius }, // bottom
        { x: baseX - radius, y: baseY }, // left
        { x: baseX, y: baseY - radius }, // top
        { x: baseX + radius, y: baseY }, // right
      ];
      
      // If more than 4 players, adjust positions
      const posIndex = playerIndex % positions.length;
      return {
        ...positions[posIndex],
        zIndex: 1
      };
    }
    
    // Default stacked layout
    return {
      x: baseX,
      y: baseY + (playerIndex * 50),
      zIndex: 1
    };
  };

  // Handle starting card drag
  const handleCardDragStart = (card: CardType, stackId: string, clientX: number, clientY: number) => {
    const availableActions = getAvailableActions('player1'); // Replace with current player ID
    
    // Only allow dragging if PLAY_CARD is an available action
    if (availableActions.includes('PLAY_CARD')) {
      setDragCard(card);
      setDragOrigin({ stackId, x: clientX - card.position.x, y: clientY - card.position.y });
    }
  };

  // Handle card dragging from a React DragEvent
  const handleCardDragStartFromEvent = (e: React.DragEvent, card: CardType, stackId: string) => {
    handleCardDragStart(card, stackId, e.clientX, e.clientY);
  };

  // Handle card dragging
  const handleCardDrag = (clientX: number, clientY: number) => {
    if (!dragCard || !dragOrigin) return;
    
    setStacks(prevStacks => {
      return prevStacks.map(stack => {
        if (stack.id === dragOrigin.stackId) {
          // Update position of the dragged card
          return {
            ...stack,
            cards: stack.cards.map(c => 
              c.id === dragCard.id 
              ? { 
                  ...c, 
                  position: { 
                    ...c.position, 
                    x: clientX - dragOrigin.x, 
                    y: clientY - dragOrigin.y 
                  } 
                }
              : c
            )
          };
        }
        return stack;
      });
    });
  };

  // Handle card drop
  const handleCardDrop = (targetStackId: string) => {
    if (!dragCard || !dragOrigin) return;
    
    // Only process if dropping on a different stack
    if (dragOrigin.stackId !== targetStackId) {
      // Find the target stack
      const fromStack = stacks.find(s => s.id === dragOrigin.stackId);
      const toStack = stacks.find(s => s.id === targetStackId);
      
      if (fromStack && toStack) {
        // Check if this is a player hand to table move (playing a card)
        if (fromStack.type === 'hand' && toStack.type === 'table') {
          // Play card action
          performAction('PLAY_CARD', fromStack.owner || 'player1', { 
            cardId: dragCard.id, 
            playerId: fromStack.owner 
          });
        }
      }
    }
    
    // Reset drag state
    setDragCard(null);
    setDragOrigin(null);
  };

  // Handle card click
  const handleCardClick = (card: CardType, stackId: string) => {
    const fromStack = stacks.find(s => s.id === stackId);
    
    if (fromStack && fromStack.type === 'hand') {
      // Handle card play via click
      performAction('PLAY_CARD', fromStack.owner || 'player1', {
        cardId: card.id,
        playerId: fromStack.owner
      });
    }
  };

  // Render loading state
  if (isLoading) {
    return <div className="loading">Loading game board...</div>;
  }

  // Render game board based on current game UI preferences
  return (
    <div 
      className={`game-board ${className || ''}`}
      style={{
        background: currentGame?.ui.themes?.default.tableColor || '#076324',
        position: 'relative',
        width: '100%',
        height: '600px',
        borderRadius: '1rem',
        overflow: 'hidden'
      }}
      onMouseMove={e => dragCard && handleCardDrag(e.clientX, e.clientY)}
      onMouseUp={() => dragCard && handleCardDrop('table')}
    >
      {/* Render stacks */}
      {stacks.map(stack => (
        <div 
          key={stack.id}
          className={`card-stack ${stack.type}`}
          style={{
            position: 'absolute',
            left: stack.position.x,
            top: stack.position.y,
            zIndex: stack.position.zIndex
          }}
          onMouseUp={() => dragCard && handleCardDrop(stack.id)}
        >
          {/* Render cards in stack based on arrangement */}
          {stack.cards.map((card, index) => {
            const offset = currentGame?.ui.cardArrangement === 'fan' 
              ? index * 20 
              : currentGame?.ui.cardArrangement === 'stack' 
                ? index * 2 
                : index * 30;
                
            return (
              <Card
                key={card.id}
                card={card}
                style={{
                  position: 'absolute',
                  left: offset,
                  top: currentGame?.ui.cardArrangement === 'row' ? 0 : offset / 3,
                  zIndex: 100 + index
                }}
                onDragStart={(e) => handleCardDragStartFromEvent(e, card, stack.id)}
                onDragEnd={() => handleCardDrop(stack.id)}
                onClick={() => handleCardClick(card, stack.id)}
                disabled={!(stack.type === 'hand')}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Helper functions for card display
function getRankDisplay(rank: string): string {
  const display: Record<string, string> = {
    'ACE': 'A',
    'KING': 'K',
    'QUEEN': 'Q',
    'JACK': 'J',
    'TEN': '10',
    'NINE': '9',
    'EIGHT': '8',
    'SEVEN': '7',
    'SIX': '6',
    'FIVE': '5',
    'FOUR': '4',
    'THREE': '3',
    'TWO': '2',
  };
  return display[rank] || rank;
}

function getSuitSymbol(suit: string): string {
  const symbols: Record<string, string> = {
    'HEARTS': '♥',
    'DIAMONDS': '♦',
    'CLUBS': '♣',
    'SPADES': '♠',
  };
  return symbols[suit] || suit;
}

export default GameBoard;
