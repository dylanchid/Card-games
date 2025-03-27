import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { CardType, Suit, Rank } from '../../types/card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

const sampleCard: CardType = {
  id: '1',
  suit: Suit.HEARTS,
  rank: Rank.ACE,
  isFaceUp: true,
  position: { x: 0, y: 0, zIndex: 0 },
  isLoading: false,
  error: undefined,
};

export const FaceUpCard: Story = {
  args: {
    card: sampleCard,
    selected: false,
    disabled: false,
    index: 0,
  },
};

export const FaceDownCard: Story = {
  args: {
    card: {
      ...sampleCard,
      isFaceUp: false,
    },
    selected: false,
    disabled: false,
    index: 0,
  },
};

export const SelectedCard: Story = {
  args: {
    card: sampleCard,
    selected: true,
    disabled: false,
    index: 0,
  },
};

export const DisabledCard: Story = {
  args: {
    card: sampleCard,
    selected: false,
    disabled: true,
    index: 0,
  },
}; 