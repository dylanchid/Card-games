import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Player } from '@/store/slices/gameSlice';

interface DeclarationButtonProps {
  playerId: string;
  player: Player;
  onDeclare?: (playerId: string) => void;
}

/**
 * Component for making declarations in Ninety-Nine
 * A declaration is when a player announces they have a special hand
 * (such as all cards of one suit, or a sequence)
 */
export const DeclarationButton: React.FC<DeclarationButtonProps> = ({ 
  playerId, 
  player,
  onDeclare 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [declarationType, setDeclarationType] = useState<string>('');
  const dispatch = useDispatch();

  if (!player || player.hasDeclaration || player.bidCardIds.length === 0) {
    return null;
  }

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDeclarationType('');
  };

  const handleDeclare = () => {
    if (declarationType) {
      // Dispatch declaration action
      dispatch({
        type: 'game/declare',
        payload: { playerId, declarationType }
      });
      
      if (onDeclare) {
        onDeclare(playerId);
      }
      
      handleCloseModal();
    }
  };

  return (
    <>
      <button 
        className="declaration-button"
        onClick={handleOpenModal}
      >
        Make Declaration
      </button>
      
      {isModalOpen && (
        <div className="declaration-modal">
          <div className="declaration-content">
            <h3>Make a Declaration</h3>
            <p>Declare a special hand for bonus points.</p>
            
            <div className="declaration-options">
              <label>
                <input 
                  type="radio" 
                  name="declaration" 
                  value="flush" 
                  onChange={() => setDeclarationType('flush')}
                  checked={declarationType === 'flush'}
                />
                Flush (All same suit)
              </label>
              
              <label>
                <input 
                  type="radio" 
                  name="declaration" 
                  value="sequence" 
                  onChange={() => setDeclarationType('sequence')}
                  checked={declarationType === 'sequence'}
                />
                Sequence (Run of 3+ consecutive ranks)
              </label>
              
              <label>
                <input 
                  type="radio" 
                  name="declaration" 
                  value="marriage" 
                  onChange={() => setDeclarationType('marriage')}
                  checked={declarationType === 'marriage'}
                />
                Marriage (King and Queen of same suit)
              </label>
            </div>
            
            <div className="declaration-actions">
              <button onClick={handleDeclare} disabled={!declarationType}>
                Declare
              </button>
              <button onClick={handleCloseModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeclarationButton; 