import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from '../Card';
import { Suit, Rank } from '@/types/card';
import { waitForStateUpdate } from '../../setupTests';

// Mock the asset loader
jest.mock('@/utils/assetLoader', () => ({
  loadCardAsset: jest.fn().mockImplementation((rank, suit) => {
    return Promise.resolve(`<svg>Test SVG for ${rank} of ${suit}</svg>`);
  }),
  getAssetState: jest.fn().mockReturnValue({
    isLoading: false,
    error: null,
    loadedAssets: new Set(),
    totalAssets: 52,
    loadedCount: 0
  }),
  clearAssetCache: jest.fn(),
  isValidCardAsset: jest.fn().mockReturnValue(true),
  getAssetKey: jest.fn().mockImplementation((rank, suit) => `${rank.toLowerCase()}_${suit.toLowerCase()}`),
  getAssetPath: jest.fn().mockImplementation((card) => `/assets/cards/face-cards/${card.rank.toLowerCase()}_of_${card.suit.toLowerCase()}.svg`),
  preloadAllAssets: jest.fn().mockResolvedValue(undefined),
  getCacheSize: jest.fn().mockReturnValue(0),
  getCacheKeys: jest.fn().mockReturnValue([]),
  getCacheStats: jest.fn().mockReturnValue({
    size: 0,
    oldestAsset: null,
    newestAsset: null
  })
}));

const mockCard = {
  id: 'test-card',
  suit: Suit.HEARTS,
  rank: Rank.ACE,
  isFaceUp: true,
  position: { x: 0, y: 0, zIndex: 0 },
  index: 0,
};

describe('Card Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders face up card correctly', async () => {
      render(<Card card={mockCard} />);
      
      // Wait for initial render
      await waitForStateUpdate();
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('playing-card', 'red');
      expect(card).toHaveAttribute('aria-label', 'ace of hearts');

      // Wait for SVG content to load
      await waitFor(() => {
        const svgElement = screen.getByTestId('card-svg');
        expect(svgElement).toBeInTheDocument();
        expect(svgElement.innerHTML).toContain('Test SVG for ACE of HEARTS');
      });
    });

    test('renders face down card correctly', async () => {
      render(<Card card={{ ...mockCard, isFaceUp: false }} />);
      await waitForStateUpdate();
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('playing-card', 'face-down');
      expect(screen.queryByTestId('card-svg')).not.toBeInTheDocument();
    });

    test('renders loading state correctly', async () => {
      const mockLoadCardAsset = require('@/utils/assetLoader').loadCardAsset;
      mockLoadCardAsset.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<Card card={mockCard} />);
      await waitForStateUpdate();

      expect(screen.getByTestId('card-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('card-svg')).not.toBeInTheDocument();
    });

    test('renders error state correctly', async () => {
      const mockLoadCardAsset = require('@/utils/assetLoader').loadCardAsset;
      mockLoadCardAsset.mockRejectedValueOnce(new Error('Failed to load'));

      render(<Card card={mockCard} />);
      await waitForStateUpdate();

      await waitFor(() => {
        const card = screen.getByRole('button');
        expect(card).toHaveClass('playing-card', 'error');
        const errorElement = screen.getByText('Failed to load card');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');
        expect(screen.queryByTestId('card-svg')).not.toBeInTheDocument();
      });
    });

    test('renders selected state correctly', async () => {
      render(<Card card={mockCard} selected={true} />);
      await waitForStateUpdate();
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('selected');
    });

    test('renders disabled state correctly', async () => {
      render(<Card card={mockCard} disabled={true} />);
      await waitForStateUpdate();
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('disabled');
      expect(card).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Interactions', () => {
    test('handles drag and drop events correctly', async () => {
      const handleDragStart = jest.fn();
      const handleDragEnd = jest.fn();

      render(
        <Card
          card={mockCard}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      );
      await waitForStateUpdate();

      const card = screen.getByRole('button');

      // Mock dataTransfer
      const dataTransfer = {
        setData: jest.fn(),
        effectAllowed: '',
      };

      // Test drag start
      fireEvent.dragStart(card, { dataTransfer });
      expect(handleDragStart).toHaveBeenCalledTimes(1);
      expect(dataTransfer.setData).toHaveBeenCalledWith(
        'card',
        JSON.stringify(mockCard)
      );

      // Test drag end
      fireEvent.dragEnd(card);
      expect(handleDragEnd).toHaveBeenCalledTimes(1);
    });

    test('handles click events correctly', async () => {
      const handleClick = jest.fn();

      render(<Card card={mockCard} onClick={handleClick} />);
      await waitForStateUpdate();

      const card = screen.getByRole('button');
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('handles disabled state correctly', async () => {
      const handleClick = jest.fn();

      render(<Card card={mockCard} onClick={handleClick} disabled />);
      await waitForStateUpdate();

      const card = screen.getByRole('button');
      expect(card).toHaveClass('disabled');
      expect(card).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(card);
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('handles keyboard navigation correctly', async () => {
      const handleClick = jest.fn();
      render(<Card card={mockCard} onClick={handleClick} />);
      await waitForStateUpdate();
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      fireEvent.keyDown(card, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA attributes', async () => {
      render(<Card card={mockCard} />);
      await waitForStateUpdate();
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'ace of hearts');
      expect(card).toHaveAttribute('aria-disabled', 'false');
      expect(card).toHaveAttribute('aria-pressed', 'false');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    test('updates ARIA attributes when disabled', async () => {
      render(<Card card={mockCard} disabled={true} />);
      await waitForStateUpdate();
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-disabled', 'true');
      expect(card).toHaveAttribute('tabIndex', '-1');
    });

    test('updates ARIA attributes when selected', async () => {
      render(<Card card={mockCard} selected={true} />);
      await waitForStateUpdate();
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Styling', () => {
    test('applies correct CSS classes', async () => {
      render(<Card card={mockCard} selected />);
      await waitForStateUpdate();

      const card = screen.getByRole('button');
      expect(card).toHaveClass('playing-card', 'red', 'selected');
    });

    test('applies correct position and transform', async () => {
      const position = { x: 100, y: -10, zIndex: 5 };

      render(<Card card={{ ...mockCard, position }} />);
      await waitForStateUpdate();

      const card = screen.getByRole('button');
      expect(card).toHaveStyle({
        transform: 'translateX(100px) translateY(-10px)',
        zIndex: '5',
      });
    });

    test('applies correct z-index', async () => {
      render(<Card card={mockCard} index={5} />);
      await waitForStateUpdate();
      
      const card = screen.getByRole('button');
      expect(card).toHaveStyle({
        zIndex: '5'
      });
    });
  });

  describe('Error Handling', () => {
    test('handles asset loading errors gracefully', async () => {
      const mockLoadCardAsset = require('@/utils/assetLoader').loadCardAsset;
      mockLoadCardAsset.mockRejectedValueOnce(new Error('Failed to load'));
      
      render(<Card card={mockCard} />);
      await waitForStateUpdate();
      
      await waitFor(() => {
        const card = screen.getByRole('button');
        expect(card).toHaveClass('playing-card', 'error');
        const errorElement = screen.getByText('Failed to load card');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');
        expect(screen.queryByTestId('card-svg')).not.toBeInTheDocument();
      });
    });

    test('handles network errors gracefully', async () => {
      const mockLoadCardAsset = require('@/utils/assetLoader').loadCardAsset;
      mockLoadCardAsset.mockRejectedValueOnce(new Error('Network error'));
      
      render(<Card card={mockCard} />);
      await waitForStateUpdate();
      
      await waitFor(() => {
        const errorElement = screen.getByText('Failed to load card');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.closest('.playing-card')).toHaveClass('error');
        expect(screen.queryByTestId('card-svg')).not.toBeInTheDocument();
      });
    });

    test('handles invalid card data gracefully', async () => {
      const invalidCard = {
        ...mockCard,
        rank: 'INVALID' as any,
        suit: 'INVALID' as any,
      };

      const mockIsValidCardAsset = require('@/utils/assetLoader').isValidCardAsset;
      mockIsValidCardAsset.mockReturnValueOnce(false);
      
      render(<Card card={invalidCard} />);
      await waitForStateUpdate();
      
      await waitFor(() => {
        const errorElement = screen.getByText('Failed to load card');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.closest('.playing-card')).toHaveClass('error');
        expect(screen.queryByTestId('card-svg')).not.toBeInTheDocument();
      });
    });
  });
}); 