import { CardGame } from '../../types/game';
import { createBaseCardGame } from '../../store/gameRegistry';
import { CardType, Suit, Rank } from '../../types/card';
import { createDeck } from '../../utils/gameUtils';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementation of the Hearts card game
 */
export const HeartsGame = (): CardGame => {
  return createBaseCardGame({
    id: 'hearts',
    name: 'Hearts',
    description: 'A classic trick-taking card game where the goal is to avoid taking hearts and the Queen of Spades.',
    minPlayers: 3,
    maxPlayers: 6,
    
    rules: {
      isValidPlay: (state, cardId, playerId) => {
        const card = state.entities.cards[cardId] as CardType;
        const player = state.entities.players[playerId];
        
        if (!card || !player) return false;
        if (state.currentPlayerIndex !== state.playerIds.indexOf(playerId)) return false;
        
        // First trick: must lead with 2 of Clubs
        if (state.tricksPlayed === 0 && state.currentTrickCardIds.every(id => id === null)) {
          const twoOfClubs = player.handIds.find(id => {
            const c = state.entities.cards[id];
            return c.suit === Suit.CLUBS && c.rank === Rank.TWO;
          });
          return cardId === twoOfClubs;
        }
        
        // Only check if card is in player's hand
        if (!player.handIds.includes(cardId)) return false;
        
        // If this is the first card in the trick
        if (state.currentTrickCardIds.every(id => id === null)) {
          // Hearts can't be led until they've been "broken"
          if (card.suit === Suit.HEARTS && !state.heartsPlayed) {
            // Unless player only has hearts
            return player.handIds.every(id => state.entities.cards[id].suit === Suit.HEARTS);
          }
          return true;
        }
        
        // Follow suit if possible
        const leadCardId = state.currentTrickCardIds[state.currentTrickLeader];
        if (!leadCardId) return false;
        
        const leadCard = state.entities.cards[leadCardId];
        const leadSuit = leadCard.suit;
        
        // Player must follow lead suit if they have it
        const hasSuit = player.handIds.some(id => state.entities.cards[id].suit === leadSuit);
        if (hasSuit) {
          return card.suit === leadSuit;
        }
        
        // Player doesn't have lead suit, can play anything
        return true;
      },
      
      isGameOver: (state) => {
        return state.playerIds.some(id => state.entities.players[id].score >= 100);
      },
      
      determineWinner: (state) => {
        // In Hearts, lowest score wins
        const playerScores = state.playerIds.map(id => ({
          id,
          score: state.entities.players[id].score
        }));
        
        playerScores.sort((a, b) => a.score - b.score);
        return playerScores[0].id;
      },
      
      getTrickWinner: (state, cards, leadSuit) => {
        // Find the highest card of the lead suit
        const suitCards = cards.filter(card => card && card.suit === leadSuit);
        if (suitCards.length === 0) return null;
        
        // Sort by rank (highest value wins)
        suitCards.sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
        return suitCards[0]?.id || null;
      },
      
      getNextPlayer: (state) => {
        const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.playerIds.length;
        return state.playerIds[nextPlayerIndex];
      },
      
      validateAction: (state, action, playerId, payload) => {
        switch (action) {
          case 'PLAY_CARD':
            return this.isValidPlay(state, payload.cardId, playerId);
          case 'PASS_CARDS':
            return state.gamePhase === 'passing';
          default:
            return true;
        }
      }
    },
    
    ui: {
      layout: 'circular',
      cardArrangement: 'fan',
      themes: {
        default: {
          tableColor: '#1e4d2b',
          cardBack: 'pattern-grid',
          textColor: '#ffffff',
          backgroundColor: '#173d23'
        },
        valentine: {
          tableColor: '#70163c',
          cardBack: 'pattern-diagonal',
          textColor: '#ffffff',
          backgroundColor: '#5c1133'
        }
      }
    },
    
    setup: {
      createInitialState: (playerIds, settings) => {
        // Create a new game state with the given players
        const initialState = {
          entities: {
            players: {},
            cards: {}
          },
          playerIds,
          deckIds: [],
          gamePhase: 'passing',
          currentPlayerIndex: 0,
          currentTrickCardIds: Array(playerIds.length).fill(null),
          currentTrickLeader: 0,
          currentTrickWinner: null,
          tricksPlayed: 0,
          heartsPlayed: false,
          isLoading: false,
          error: null,
          lastAction: null,
          gameStarted: false,
          roundNumber: 1,
          passDirection: 'left', // left, right, across, none
          roundPoints: {},
          lastTricks: [],
          gameSettings: {
            maxRounds: settings?.maxRounds || 0, // 0 means play until someone reaches 100
            cardsPerPlayer: 13,
            allowJokers: false,
            timeLimit: settings?.timeLimit || 30,
            autoPlay: settings?.autoPlay !== undefined ? settings.autoPlay : false,
            specialRules: {
              queenOfSpades: true,    // Queen of Spades worth 13 points
              shootTheMoon: true,     // All points to opponents if you take all hearts + QoS
              jackOfDiamonds: false,  // Jack of Diamonds removes 10 points
              passThreeCards: true    // Pass three cards each round
            }
          }
        };
        
        // Initialize players
        initialState.playerIds.forEach((id, index) => {
          initialState.entities.players[id] = {
            id,
            name: `Player ${index + 1}`,
            handIds: [],
            passIds: [],
            tricksWon: 0, 
            heartsWon: 0,
            hasQueenOfSpades: false,
            score: 0,
            roundScore: 0,
            isActive: index === 0
          };
        });
        
        // Initialize round points tracking
        initialState.playerIds.forEach(id => {
          initialState.roundPoints[id] = 0;
        });
        
        return initialState;
      },
      
      dealCards: (numPlayers) => {
        // Create and shuffle a standard deck without jokers
        const deck = createHeartsDeck();
        
        // Deal cards to players
        const hands: CardType[][] = [];
        const cardsPerPlayer = Math.floor(deck.length / numPlayers);
        
        for (let i = 0; i < numPlayers; i++) {
          hands[i] = [];
          for (let j = 0; j < cardsPerPlayer; j++) {
            hands[i].push(deck.pop()!);
          }
        }
        
        return { 
          hands, 
          remainingDeck: deck
        };
      },
      
      initialDeck: () => createHeartsDeck(),
      
      setupRound: (state, roundIndex) => {
        const updatedState = { ...state };
        
        // Reset trick-related state
        updatedState.currentTrickCardIds = Array(state.playerIds.length).fill(null);
        updatedState.heartsPlayed = false;
        updatedState.gamePhase = 'passing';
        
        // Determine pass direction for this round
        const passDirections = ['left', 'right', 'across', 'none'];
        updatedState.passDirection = passDirections[roundIndex % 4];
        
        // Deal new cards
        const { hands, remainingDeck } = state.setup.dealCards(state.playerIds.length);
        
        // Update the deck
        updatedState.deckIds = remainingDeck.map(card => card.id);
        
        // Add all cards to the state
        const allCards = [...remainingDeck];
        hands.forEach(hand => allCards.push(...hand));
        
        // Update card entities
        allCards.forEach(card => {
          updatedState.entities.cards[card.id] = card;
        });
        
        // Update players' hands
        state.playerIds.forEach((playerId, index) => {
          // Reset player state for the new round
          updatedState.entities.players[playerId].handIds = hands[index].map(card => card.id);
          updatedState.entities.players[playerId].passIds = [];
          updatedState.entities.players[playerId].tricksWon = 0;
          updatedState.entities.players[playerId].heartsWon = 0;
          updatedState.entities.players[playerId].hasQueenOfSpades = false;
          updatedState.entities.players[playerId].roundScore = 0;
          
          // Find player with 2 of clubs to lead first trick
          const twoOfClubsIndex = hands[index].findIndex(card => 
            card.suit === Suit.CLUBS && card.rank === Rank.TWO
          );
          
          if (twoOfClubsIndex !== -1) {
            updatedState.currentPlayerIndex = index;
            updatedState.currentTrickLeader = index;
          }
        });
        
        // Reset round points tracking
        updatedState.playerIds.forEach(id => {
          updatedState.roundPoints[id] = 0;
        });
        
        return updatedState;
      }
    },
    
    actions: {
      availableActions: (state, playerId) => {
        const availableActions = [];
        const isCurrentPlayer = state.playerIds[state.currentPlayerIndex] === playerId;
        
        switch (state.gamePhase) {
          case 'passing':
            if (state.passDirection !== 'none') {
              availableActions.push('PASS_CARDS');
            } else {
              if (isCurrentPlayer) {
                availableActions.push('PLAY_CARD');
              }
            }
            break;
          case 'playing':
            if (isCurrentPlayer) {
              availableActions.push('PLAY_CARD');
            }
            break;
          case 'scoring':
            availableActions.push('VIEW_SCORES');
            if (isCurrentPlayer) {
              availableActions.push('START_NEXT_ROUND');
            }
            break;
        }
        
        return availableActions;
      },
      
      requiredActions: (state, playerId) => {
        const requiredActions = [];
        const isCurrentPlayer = state.playerIds[state.currentPlayerIndex] === playerId;
        
        if (state.gamePhase === 'passing' && state.passDirection !== 'none') {
          requiredActions.push('PASS_CARDS');
        } else if (isCurrentPlayer && state.gamePhase === 'playing') {
          requiredActions.push('PLAY_CARD');
        }
        
        return requiredActions;
      },
      
      performAction: (state, action, playerId, payload) => {
        if (!state.rules.validateAction(state, action, playerId, payload)) {
          return state;
        }
        
        // Use the action reducers to update the state
        const actionReducer = state.actions.actionReducers[action];
        if (actionReducer) {
          return actionReducer(state, { ...payload, playerId });
        }
        
        return state;
      },
      
      actionReducers: {
        PLAY_CARD: (state, payload) => {
          const { cardId, playerId } = payload;
          const player = state.entities.players[playerId];
          const card = state.entities.cards[cardId];
          
          if (!player || !card) return state;
          
          // Update player's hand
          player.handIds = player.handIds.filter(id => id !== cardId);
          
          // Add card to current trick
          const playerIndex = state.playerIds.indexOf(playerId);
          state.currentTrickCardIds[playerIndex] = cardId;
          
          // Mark if hearts have been played
          if (card.suit === Suit.HEARTS) {
            state.heartsPlayed = true;
          }
          
          // Check if all players have played
          const allPlayed = state.currentTrickCardIds.every(id => id !== null);
          
          if (allPlayed) {
            // Get all cards in this trick
            const trickCards = state.currentTrickCardIds.map(id => state.entities.cards[id]);
            
            // Determine trick winner
            const leadCardId = state.currentTrickCardIds[state.currentTrickLeader];
            const leadCard = state.entities.cards[leadCardId];
            const leadSuit = leadCard.suit;
            
            // Find the highest card of the lead suit
            const suitCards = trickCards.filter(card => card.suit === leadSuit);
            suitCards.sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
            const winningCard = suitCards[0];
            
            const winningIndex = trickCards.findIndex(card => card.id === winningCard.id);
            const winningPlayerId = state.playerIds[winningIndex];
            
            // Update winner's state
            state.entities.players[winningPlayerId].tricksWon += 1;
            
            // Track hearts and queen of spades
            trickCards.forEach(card => {
              if (card.suit === Suit.HEARTS) {
                state.entities.players[winningPlayerId].heartsWon += 1;
                state.roundPoints[winningPlayerId] += 1;
              }
              
              if (card.suit === Suit.SPADES && card.rank === Rank.QUEEN) {
                state.entities.players[winningPlayerId].hasQueenOfSpades = true;
                state.roundPoints[winningPlayerId] += 13;
              }
            });
            
            // Save trick history
            state.lastTricks.push({
              id: uuidv4(),
              roundNumber: state.roundNumber,
              trickNumber: state.tricksPlayed + 1,
              cardIds: [...state.currentTrickCardIds],
              winnerId: winningPlayerId,
              leadSuit,
              timestamp: Date.now()
            });
            
            // Set next trick leader
            state.currentTrickLeader = winningIndex;
            state.currentPlayerIndex = winningIndex;
            
            // Reset trick
            state.currentTrickCardIds = Array(state.playerIds.length).fill(null);
            state.tricksPlayed += 1;
            
            // Check if round is over (all cards played)
            if (state.playerIds.some(id => state.entities.players[id].handIds.length === 0)) {
              // Process shooting the moon if enabled
              if (state.gameSettings.specialRules.shootTheMoon) {
                const shooterIndex = state.playerIds.findIndex(id => {
                  const p = state.entities.players[id];
                  return p.heartsWon === 13 && p.hasQueenOfSpades;
                });
                
                if (shooterIndex !== -1) {
                  // Shooter gets 0, everyone else gets 26
                  const shooterId = state.playerIds[shooterIndex];
                  state.playerIds.forEach(id => {
                    if (id === shooterId) {
                      state.roundPoints[id] = 0;
                    } else {
                      state.roundPoints[id] = 26;
                    }
                  });
                }
              }
              
              // Update scores
              state.playerIds.forEach(id => {
                state.entities.players[id].roundScore = state.roundPoints[id];
                state.entities.players[id].score += state.roundPoints[id];
              });
              
              state.gamePhase = 'scoring';
            }
          } else {
            // Move to next player
            state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerIds.length;
          }
          
          return state;
        },
        
        PASS_CARDS: (state, payload) => {
          const { cardIds, playerId } = payload;
          const player = state.entities.players[playerId];
          
          if (!player || !cardIds || cardIds.length !== 3) return state;
          
          // Record cards to pass
          player.passIds = cardIds;
          
          // Check if all players have selected cards to pass
          const allSelected = state.playerIds.every(id => 
            state.entities.players[id].passIds.length === 3
          );
          
          if (allSelected) {
            // Process the pass
            const passOffset = getPassOffset(state.passDirection, state.playerIds.length);
            
            state.playerIds.forEach((id, index) => {
              const player = state.entities.players[id];
              const targetIndex = (index + passOffset + state.playerIds.length) % state.playerIds.length;
              const targetId = state.playerIds[targetIndex];
              const targetPlayer = state.entities.players[targetId];
              
              // Remove passed cards from source player
              player.handIds = player.handIds.filter(id => !player.passIds.includes(id));
              
              // Add passed cards to target player
              targetPlayer.handIds.push(...player.passIds);
            });
            
            // Clear pass selections
            state.playerIds.forEach(id => {
              state.entities.players[id].passIds = [];
            });
            
            // Move to playing phase
            state.gamePhase = 'playing';
          }
          
          return state;
        },
        
        START_NEXT_ROUND: (state) => {
          // Check if game is over
          if (state.gameSettings.maxRounds > 0 && state.roundNumber >= state.gameSettings.maxRounds) {
            return state;
          }
          
          if (state.playerIds.some(id => state.entities.players[id].score >= 100)) {
            return state;
          }
          
          // Increment round number
          state.roundNumber += 1;
          
          // Setup next round
          return state.setup.setupRound(state, state.roundNumber - 1);
        }
      }
    },
    
    scoring: {
      calculateScore: (state, playerId) => {
        // Each heart is worth 1 point, Queen of Spades is worth 13
        const player = state.entities.players[playerId];
        let score = player.heartsWon;
        
        if (player.hasQueenOfSpades) {
          score += 13;
        }
        
        // Check for shooting the moon
        if (state.gameSettings.specialRules.shootTheMoon && 
            player.heartsWon === 13 && player.hasQueenOfSpades) {
          return 0; // Shooter gets 0
        }
        
        return score;
      },
      
      updateScores: (state) => {
        // Update scores based on cards won in the round
        state.playerIds.forEach(id => {
          const roundScore = state.scoring.calculateScore(state, id);
          state.entities.players[id].roundScore = roundScore;
          state.entities.players[id].score += roundScore;
        });
        
        return state;
      },
      
      winningCondition: 'lowest'
    },
    
    animations: {
      dealAnimation: (card, playerIndex) => {
        return {
          ...card,
          isAnimating: true,
          animationType: 'move',
          animationProgress: 0
        };
      },
      
      playCardAnimation: (card, fromPosition, toPosition) => {
        return {
          ...card,
          isAnimating: true,
          animationType: 'move',
          animationProgress: 0
        };
      },
      
      winTrickAnimation: (cards, winnerId) => {
        return cards.map(card => ({
          ...card,
          isAnimating: true,
          animationType: 'scale',
          animationProgress: 0
        }));
      }
    },
    
    settings: {
      maxRounds: 0, // Play until someone reaches 100 points
      cardsPerPlayer: 13,
      allowJokers: false,
      timeLimit: 30,
      autoPlay: false,
      specialRules: {
        queenOfSpades: true,    // Queen of Spades worth 13 points
        shootTheMoon: true,     // All points to opponents if you take all hearts + QoS
        jackOfDiamonds: false,  // Jack of Diamonds removes 10 points
        passThreeCards: true    // Pass three cards each round
      }
    }
  });
};

// Helper function to create a deck for Hearts
function createHeartsDeck(): CardType[] {
  const deck: CardType[] = [];
  
  // Create a standard 52-card deck without jokers
  Object.values(Suit).forEach(suit => {
    Object.values(Rank).forEach(rank => {
      deck.push({
        id: uuidv4(),
        suit,
        rank,
        isFaceUp: true,
        position: { x: 0, y: 0, zIndex: 0 }
      });
    });
  });
  
  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

// Helper function to get a rank's numeric value
function getRankValue(rank: Rank): number {
  const rankValues: Record<Rank, number> = {
    [Rank.TWO]: 2,
    [Rank.THREE]: 3,
    [Rank.FOUR]: 4,
    [Rank.FIVE]: 5,
    [Rank.SIX]: 6,
    [Rank.SEVEN]: 7,
    [Rank.EIGHT]: 8,
    [Rank.NINE]: 9,
    [Rank.TEN]: 10,
    [Rank.JACK]: 11,
    [Rank.QUEEN]: 12,
    [Rank.KING]: 13,
    [Rank.ACE]: 14
  };
  
  return rankValues[rank] || 0;
}

// Helper function to determine pass offset based on direction
function getPassOffset(direction: string, numPlayers: number): number {
  switch (direction) {
    case 'left': return 1;
    case 'right': return numPlayers - 1;
    case 'across': return Math.floor(numPlayers / 2);
    default: return 0;
  }
}

// Export the function to register this game
export function registerHeartsGame(registry: any) {
  registry.registerGame('hearts', HeartsGame);
} 