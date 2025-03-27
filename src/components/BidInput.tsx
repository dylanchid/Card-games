import React, { useState, useEffect } from 'react';
import { CardType } from '../store/types/card';
import { useDispatch } from 'react-redux';
import { placeBid } from '@/store/slices/gameSlice';

interface BidInputProps {
  playerId: string;
  hand: CardType[];
  maxBidCards: number;
  onBidPlaced?: () => void;
}

/**
 * Component for selecting and submitting card bids in Ninety-Nine
 */
export const BidInput: React.FC<BidInputProps> = ({ 
  playerId, 
  hand, 
  maxBidCards = 3,
  onBidPlaced 
}) => {
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [bidValue, setBidValue] = useState<number>(0);
  const dispatch = useDispatch();

  // Calculate bid value whenever selected cards change
  useEffect(() => {
    // Clubs=3, Hearts=2, Spades=1, Diamonds=0
    const calculateBidValue = () => {
      const suitValues: Record<string, number> = {
        'CLUBS': 3,
        'HEARTS': 2,
        'SPADES': 1,
        'DIAMONDS': 0,
        'JOKER': 0
      };

      return selectedCards.reduce((total, card) => {
        return total + suitValues[card.suit];
      }, 0);
    };

    setBidValue(calculateBidValue());
  }, [selectedCards]);

  const handleCardSelect = (card: CardType) => {
    if (selectedCards.some(c => c.id === card.id)) {
      // If already selected, deselect it
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < maxBidCards) {
      // If not at max cards, select it
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleSubmitBid = () => {
    if (selectedCards.length > 0) {
      dispatch(placeBid({ 
        playerId, 
        bidCards: selectedCards 
      }));
      
      if (onBidPlaced) {
        onBidPlaced();
      }
    }
  };

  return (
    <div className="bid-input">
      <h3>Place Your Bid (Selected: {bidValue})</h3>
      <p className="bid-info">
        Clubs (♣) = 3, Hearts (♥) = 2, Spades (♠) = 1, Diamonds (♦) = 0
      </p>
      
      <div className="card-selection">
        {hand.map(card => (
          <div 
            key={card.id}
            className={`bid-card ${selectedCards.some(c => c.id === card.id) ? 'selected' : ''}`}
            onClick={() => handleCardSelect(card)}
          >
            <div className="card-inner">
              <div className="card-value">{card.rank}</div>
              <div className="card-suit">{card.suit}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bid-info">
        <p>You will try to win exactly {bidValue} tricks.</p>
      </div>
      
      <button 
        className="bid-button" 
        onClick={handleSubmitBid}
        disabled={selectedCards.length === 0}
      >
        Submit Bid
      </button>
    </div>
  );
};

export default BidInput; 