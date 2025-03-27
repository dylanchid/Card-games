import React from 'react';
import { useSelector } from 'react-redux';
import { CardType, SUIT_SYMBOLS } from '@/types/card';
import { Player } from '@/store/slices/gameSlice';
import { calculateBidValue } from '@/utils/gameUtils';

interface GameInfoProps {
  trumpCard: CardType | null;
  players: Player[];
  currentPhase: string;
  roundNumber: number;
  tricksPlayed: number;
  className?: string;
}

/**
 * Component to display game information such as trump card, bids, and game phase
 */
export const GameInfo: React.FC<GameInfoProps> = ({
  trumpCard,
  players,
  currentPhase,
  roundNumber,
  tricksPlayed,
  className = ''
}) => {
  // Function to get card entities for a player's bid cards
  const getBidCards = (player: Player, allCards: Record<string, CardType>) => {
    return player.bidCardIds.map(id => allCards[id]);
  };

  // Get all card entities from store
  const allCards = useSelector((state: any) => state.game.entities.cards);

  return (
    <div className={`game-info ${className}`}>
      <div className="game-status">
        <h3>Round {roundNumber}</h3>
        <p>Tricks Played: {tricksPlayed}</p>
        <p>Phase: {currentPhase}</p>
      </div>

      {trumpCard && (
        <div className="trump-card">
          <h3>Trump</h3>
          <div className="trump-display">
            <div className={`card ${trumpCard.suit.toLowerCase()}`}>
              <span className="card-value">{trumpCard.rank}</span>
              <span className="card-suit">
                {SUIT_SYMBOLS[trumpCard.suit] || trumpCard.suit}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="player-bids">
        <h3>Bids</h3>
        <ul className="bid-list">
          {players.map(player => {
            const bidCards = getBidCards(player, allCards);
            const bidValue = calculateBidValue(bidCards);
            
            return (
              <li key={player.id} className="player-bid">
                <span className="player-name">{player.name}</span>
                <span className="bid-value">
                  {player.revealBid ? 
                    bidValue : 
                    player.bidCardIds.length > 0 ? '(Hidden)' : 'No bid'
                  }
                </span>
                {player.revealBid && bidCards.length > 0 && (
                  <div className="bid-cards">
                    {bidCards.map(card => (
                      <span key={card.id} className={`mini-card ${card.suit.toLowerCase()}`}>
                        {SUIT_SYMBOLS[card.suit] || card.suit}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="scores">
        <h3>Scores</h3>
        <ul className="score-list">
          {players.map(player => (
            <li key={player.id} className="player-score">
              <span className="player-name">{player.name}</span>
              <span className="score-value">{player.score}</span>
              <span className="tricks-won">Tricks: {player.tricksWon}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GameInfo; 