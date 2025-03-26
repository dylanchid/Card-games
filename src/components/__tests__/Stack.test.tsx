import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Stack } from '../Stack';
import { Suit, Rank, StackType } from '@/types/card';
import { waitForStateUpdate } from '../../setupTests';

// Mock the asset loader
jest.mock('@/utils/assetLoader', () => ({
  loadCardAsset: jest.fn().mockResolvedValue('<svg>Test SVG</svg>'),
  isValidCardAsset: jest.fn().mockReturnValue(true)
}));

const mockCards = [
  {
    id: 'test-card-1',
    suit: Suit.HEARTS,
    rank: Rank.ACE,
    isFaceUp: true,
    position: { x: 0, y: 0, zIndex: 0 },
  },
  {
    id: 'test-card-2',
    suit: Suit.CLUBS,
    rank: Rank.KING,
    isFaceUp: true,
    position: { x: 0, y: 0, zIndex: 1 },
  },
];

const mockStack: StackType = {
  id: 'test-stack',
  type: 'hand' as const,
  cards: mockCards,
  position: { x: 0, y: 0, zIndex: 0 },
  isFaceUp: true,
  cardCount: 2
};

// Add logging utility
const logGameEvent = (event: string, data: any) => {
  console.log(`[Game Event] ${event}:`, data);
};

describe('Stack Component - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders stack with cards and handles basic interactions', async () => {
    const handleDragStart = jest.fn();
    const handleDragEnd = jest.fn();
    const handleClick = jest.fn();

    render(
      <Stack
        stack={mockStack}
        onDragStart={handleDragStart}
        onDragOver={() => {}}
        onDragEnd={handleDragEnd}
        isDragTarget={false}
        isValidDrop={false}
        onCardClick={handleClick}
      />
    );
    await waitForStateUpdate();

    // Verify basic rendering
    const cards = screen.getAllByRole('button');
    expect(cards).toHaveLength(2);

    // Test drag and drop
    const firstCard = cards[0];
    fireEvent.dragStart(firstCard, { dataTransfer: { setData: jest.fn() } });
    expect(handleDragStart).toHaveBeenCalledWith(mockCards[0], mockStack.id);
    logGameEvent('Drag Start', { card: mockCards[0], stackId: mockStack.id });

    // Test click handling
    fireEvent.click(firstCard);
    expect(handleClick).toHaveBeenCalled();
    logGameEvent('Card Click', { card: mockCards[0] });

    // Test drop handling
    const stack = screen.getByTestId('card-stack');
    fireEvent.drop(stack);
    expect(handleDragEnd).toHaveBeenCalled();
    logGameEvent('Drop', { stackId: mockStack.id });
  });

  test('handles empty stack state', async () => {
    render(
      <Stack
        stack={{ ...mockStack, cards: [], cardCount: 0 }}
        onDragStart={() => {}}
        onDragOver={() => {}}
        onDragEnd={() => {}}
        isDragTarget={false}
        isValidDrop={false}
      />
    );
    await waitForStateUpdate();

    const stack = screen.getByTestId('card-stack');
    expect(stack).toBeInTheDocument();
    logGameEvent('Empty Stack', { stackId: mockStack.id });
  });
}); 