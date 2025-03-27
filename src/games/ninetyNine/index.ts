import { CardGame } from '../../types/game';
import { createBaseCardGame } from '../../store/gameRegistry';
import { CardType, Suit } from '../../types/card';
import { 
  createNinetyNineDeck, 
  dealCards, 
  isValidPlay, 
  determineTrickWinner, 
  isGameOver, 
  calculatePlayerScore,
  calculateBidValue,
  determineTrumpSuit
} from '../../utils/gameUtils';
import { v4 as uuidv4 } from 'uuid';
import { Player } from '../../store/slices/gameSlice';

/**
 * Implementation of the Ninety-Nine card game
 */
export const NinetyNineGame = (): CardGame => {
  return createBaseCardGame({
    id: 'ninety-nine',
    name: 'Ninety-Nine',
    description: 'A classic trick-taking card game where players try to avoid taking tricks totaling 99 points or more.',
    minPlayers: 3,
    maxPlayers: 5,
    
    rules: {
      isValidPlay: (state, cardId, playerId) => {
        const card = state.entities.cards[cardId];
        const player = state.entities.players[playerId];
        
        if (!card || !player) return false;
        if (state.currentPlayerIndex !== state.playerIds.indexOf(playerId)) return false;
        
        // Check if the card is in the player's hand
        if (!player.handIds.includes(cardId)) return false;
        
        // Get the player's hand
        const playerHand = player.handIds.map((id: string) => state.entities.cards[id]);
        
        // Call the utility function with the required arguments
        return isValidPlay(card, state.currentTrickCardIds.map((id: string | null) => id ? state.entities.cards[id] : null), playerHand, state.currentTrickSuit);
      },
      
      isGameOver: (state) => {
        // Game is over when a player reaches 100 points or 9 rounds are played
        const players = Object.values(state.entities.players) as Player[];
        return isGameOver(players) || state.roundNumber > state.gameSettings.maxRounds;
      },
      
      determineWinner: (state) => {
        // The player with the highest score wins
        if (state.playerIds.length === 0) return null;
        
        const playerScores = state.playerIds.map((id: string) => ({
          id,
          score: state.entities.players[id].score
        }));
        
        playerScores.sort((a: {id: string, score: number}, b: {id: string, score: number}) => b.score - a.score);
        return playerScores[0].id;
      },
      
      getTrickWinner: (state, cards, leadSuit) => {
        if (!cards || cards.length === 0) return null;
        
        // Get trump suit from turnup card
        const trumpSuit = state.turnupCardId ? state.entities.cards[state.turnupCardId].suit : null;
        
        // Convert cards array to number index using determineTrickWinner
        const winnerIndex = determineTrickWinner(cards, leadSuit, trumpSuit);
        
        // Get the player ID at the winning index
        return state.playerIds[winnerIndex] || null;
      },
      
      getNextPlayer: (state) => {
        const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.playerIds.length;
        return state.playerIds[nextPlayerIndex];
      },
      
      validateAction: (state, action, playerId, payload) => {
        const playerIndex = state.playerIds.indexOf(playerId);
        if (playerIndex === -1) return false;
        
        // Validate if it's the player's turn
        if (state.currentPlayerIndex !== playerIndex && 
           !['DECLARE', 'REVEAL_BID'].includes(action)) {
          return false;
        }

        // Implement action validation based on game rules
        switch (action) {
          case 'PLAY_CARD':
            return state.rules.isValidPlay(state, payload.cardId, playerId);
          case 'PLACE_BID':
            // Validate bid cards
            if (!payload.cardIds || !Array.isArray(payload.cardIds)) return false;
            
            // Check if all bid cards are in player's hand
            const player = state.entities.players[playerId];
            const allCardsInHand = payload.cardIds.every((id: string) => player.handIds.includes(id));
            
            return allCardsInHand && payload.cardIds.length > 0 && payload.cardIds.length <= 3;
          case 'DECLARE':
            // Can only declare during bidding phase
            return state.gamePhase === 'bidding' && state.entities.players[playerId].bidCardIds.length > 0;
          case 'REVEAL_BID':
            // Can only reveal bid during playing phase
            return state.gamePhase === 'playing' && !state.entities.players[playerId].revealBid;
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
          tableColor: '#076324',
          cardBack: 'pattern-diagonal',
          textColor: '#ffffff',
          backgroundColor: '#0a4d1c'
        },
        classic: {
          tableColor: '#0f5132',
          cardBack: 'pattern-grid',
          textColor: '#e6e6e6',
          backgroundColor: '#0a3622'
        }
      }
    },
    
    setup: {
      createInitialState: (playerIds, settings) => {
        // Create a new game state with the given players
        const initialState: any = {
          entities: {
            players: {},
            cards: {}
          },
          playerIds,
          deckIds: [],
          turnupCardId: null,
          gamePhase: 'dealing',
          currentPlayerIndex: 0,
          currentTrickCardIds: Array(playerIds.length).fill(null),
          currentTrickSuit: null,
          currentTrickWinner: null,
          currentTrickLeader: 0,
          tricksPlayed: 0,
          isLoading: false,
          error: null,
          lastAction: null,
          gameStarted: false,
          roundNumber: 1,
          gameMode: 'standard',
          lastTricks: [],
          trumpSuit: null,
          gameSettings: {
            maxRounds: settings?.maxRounds || 9, // 9 rounds is typical for Ninety-Nine
            maxTricks: settings?.maxTricks || 12, // Max number of tricks based on cards per player
            cardsPerPlayer: settings?.cardsPerPlayer || 12,
            allowTrump: settings?.allowTrump !== undefined ? settings.allowTrump : true,
            allowNoTrump: settings?.allowNoTrump !== undefined ? settings.allowNoTrump : true,
            allowPartnership: settings?.allowPartnership !== undefined ? settings.allowPartnership : false,
            scoringSystem: settings?.scoringSystem || 'standard',
            timeLimit: settings?.timeLimit || 30,
            autoPlay: settings?.autoPlay !== undefined ? settings.autoPlay : false,
          }
        };
        
        // Initialize players
        initialState.playerIds.forEach((id: string, index: number) => {
          initialState.entities.players[id] = {
            id,
            name: `Player ${index + 1}`,
            handIds: [],
            bidCardIds: [],
            revealBid: false,
            tricksWon: 0,
            score: 0,
            isActive: index === 0,
            hasDeclaration: false
          };
        });
        
        return initialState;
      },
      
      // Fix the return type to match the interface expectation
      dealCards: (numPlayers) => {
        // Create a specialized deck for Ninety-Nine (37 cards)
        const deck = createNinetyNineDeck();
        
        // Use the correct number of parameters for dealCards
        const result = dealCards(deck, numPlayers, 12);
        
        // Convert null to undefined for turnUpCard to match the expected interface
        return { 
          hands: result.hands, 
          remainingDeck: result.remainingDeck, 
          turnUpCard: result.turnupCard || undefined 
        };
      },
      
      initialDeck: () => createNinetyNineDeck(),
      
      setupRound: (state, roundIndex) => {
        const updatedState = { ...state };
        
        // Reset trick-related state
        updatedState.currentTrickCardIds = Array(state.playerIds.length).fill(null);
        updatedState.currentTrickSuit = null;
        updatedState.currentTrickWinner = null;
        updatedState.tricksPlayed = 0;
        updatedState.gamePhase = 'bidding';
        
        // Set the dealer for this round (rotates)
        updatedState.currentPlayerIndex = roundIndex % state.playerIds.length;
        updatedState.currentTrickLeader = updatedState.currentPlayerIndex;
        
        // Create a new deck for each round - specifically for Ninety-Nine
        const deck = createNinetyNineDeck();
        
        // Deal new cards with all required parameters
        const { hands, remainingDeck, turnupCard } = dealCards(deck, state.playerIds.length, 12);
        
        // Update the deck
        updatedState.deckIds = remainingDeck.map(card => card.id);
        updatedState.turnupCardId = turnupCard?.id || null;
        
        // Set trump suit based on turnup card
        if (turnupCard) {
          updatedState.trumpSuit = turnupCard.suit;
        }
        
        // Add all cards to the state
        const allCards = [...remainingDeck];
        if (turnupCard) allCards.push(turnupCard);
        hands.forEach(hand => allCards.push(...hand));
        
        // Update card entities
        allCards.forEach(card => {
          updatedState.entities.cards[card.id] = card;
        });
        
        // Update players' hands and reset round-specific state
        state.playerIds.forEach((playerId: string, index: number) => {
          const playerHand = hands[index];
          updatedState.entities.players[playerId].handIds = playerHand.map(card => card.id);
          updatedState.entities.players[playerId].bidCardIds = [];
          updatedState.entities.players[playerId].revealBid = false;
          updatedState.entities.players[playerId].tricksWon = 0;
          updatedState.entities.players[playerId].hasDeclaration = false;
        });
        
        return updatedState;
      }
    },
    
    actions: {
      availableActions: (state, playerId) => {
        const availableActions: string[] = [];
        const isCurrentPlayer = state.playerIds[state.currentPlayerIndex] === playerId;
        const player = state.entities.players[playerId];
        
        if (!player) return availableActions;
        
        switch (state.gamePhase) {
          case 'bidding':
            if (isCurrentPlayer) {
              availableActions.push('PLACE_BID');
            }
            // Player can declare a special hand during bidding
            if (player.bidCardIds.length > 0 && !player.hasDeclaration) {
              availableActions.push('DECLARE');
            }
            break;
          case 'playing':
            if (isCurrentPlayer) {
              availableActions.push('PLAY_CARD');
            }
            // Player can reveal their bid during play
            if (!player.revealBid) {
              availableActions.push('REVEAL_BID');
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
        
        if (isCurrentPlayer) {
          switch (state.gamePhase) {
            case 'bidding':
              requiredActions.push('PLACE_BID');
              break;
            case 'playing':
              requiredActions.push('PLAY_CARD');
              break;
          }
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
          return actionReducer(state, payload);
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
          player.handIds = player.handIds.filter((id: string) => id !== cardId);
          
          // Add card to current trick
          const playerIndex = state.playerIds.indexOf(playerId);
          state.currentTrickCardIds[playerIndex] = cardId;
          
          // Set lead suit if this is the first card in the trick
          if (state.currentTrickLeader === playerIndex) {
            state.currentTrickSuit = card.suit;
          }
          
          // Check if all players have played
          const allPlayed = state.currentTrickCardIds.every((id: string | null) => id !== null);
          
          if (allPlayed) {
            // Determine trick winner
            const trickCards = state.currentTrickCardIds.map((id: string) => state.entities.cards[id]);
            
            // Supply the necessary parameters to determineTrickWinner
            const winningPlayerIndex = determineTrickWinner(
              trickCards, 
              state.currentTrickSuit as Suit, 
              state.trumpSuit as Suit | null
            );
            
            const winningPlayerId = state.playerIds[winningPlayerIndex];
            
            // Update winner's tricks won
            state.entities.players[winningPlayerId].tricksWon += 1;
            state.currentTrickWinner = winningPlayerId;
            
            // Save trick history
            state.lastTricks.push({
              id: uuidv4(),
              roundNumber: state.roundNumber,
              trickNumber: state.tricksPlayed + 1,
              cardIds: [...state.currentTrickCardIds],
              winnerId: winningPlayerId,
              leadSuit: state.currentTrickSuit as Suit,
              timestamp: Date.now()
            });
            
            // Set next trick leader
            state.currentTrickLeader = winningPlayerIndex;
            state.currentPlayerIndex = winningPlayerIndex;
            
            // Reset trick
            state.currentTrickCardIds = Array(state.playerIds.length).fill(null);
            state.currentTrickSuit = null;
            state.tricksPlayed += 1;
            
            // Check if round is over
            if (state.tricksPlayed >= state.gameSettings.maxTricks || 
                state.playerIds.some((id: string) => state.entities.players[id].handIds.length === 0)) {
              // Update scores for each player
              state.playerIds.forEach((id: string) => {
                // Calculate score for the round
                const player = state.entities.players[id];
                const bidCards: CardType[] = player.bidCardIds.map((id: string) => state.entities.cards[id]);
                const roundScore = calculatePlayerScore(player, player.tricksWon, bidCards);
                
                // Add round score to total score
                player.score += roundScore;
              });
              
              state.gamePhase = 'scoring';
            }
          } else {
            // Move to next player
            state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerIds.length;
          }
          
          return state;
        },
        
        PLACE_BID: (state, payload) => {
          const { cardIds, playerId } = payload;
          const player = state.entities.players[playerId];
          
          if (!player) return state;
          
          // Remove bid cards from player's hand
          player.handIds = player.handIds.filter((id: string) => !cardIds.includes(id));
          
          // Set player's bid
          player.bidCardIds = cardIds;
          
          // Move to next player
          state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerIds.length;
          
          // Check if all players have bid
          const allBid = state.playerIds.every((id: string) => state.entities.players[id].bidCardIds.length > 0);
          
          if (allBid) {
            state.gamePhase = 'playing';
          }
          
          return state;
        },
        
        DECLARE: (state, payload) => {
          const { playerId } = payload;
          const player = state.entities.players[playerId];
          
          if (!player) return state;
          
          // Set declaration flag
          player.hasDeclaration = true;
          
          return state;
        },
        
        REVEAL_BID: (state, payload) => {
          const { playerId } = payload;
          const player = state.entities.players[playerId];
          
          if (!player) return state;
          
          // Reveal player's bid
          player.revealBid = true;
          
          return state;
        },
        
        START_NEXT_ROUND: (state) => {
          // Check if game is over
          if (state.roundNumber >= state.gameSettings.maxRounds || 
              state.playerIds.some((id: string) => state.entities.players[id].score >= 100)) {
            // Game is over, determine winner
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
        const player = state.entities.players[playerId];
        // Get bid cards
        const bidCards = player.bidCardIds.map((id: string) => state.entities.cards[id]);
        return calculatePlayerScore(player, player.tricksWon, bidCards);
      },
      
      updateScores: (state) => {
        state.playerIds.forEach((id: string) => {
          state.entities.players[id].score += state.scoring.calculateScore(state, id);
        });
        
        return state;
      },
      
      winningCondition: 'highest'
    },
    
    animations: {
      dealAnimation: (card, playerIndex) => {
        // Return animation config for dealing cards
        return {
          ...card,
          isAnimating: true,
          animationType: 'move',
          animationProgress: 0
        };
      },
      
      playCardAnimation: (card, fromPosition, toPosition) => {
        // Return animation config for playing a card
        return {
          ...card,
          isAnimating: true,
          animationType: 'move',
          animationProgress: 0
        };
      },
      
      winTrickAnimation: (cards, winnerId) => {
        // Return animation config for winning a trick
        return cards.map(card => ({
          ...card,
          isAnimating: true,
          animationType: 'scale',
          animationProgress: 0
        }));
      }
    },
    
    settings: {
      maxRounds: 9, // Traditionally 9 rounds in Ninety-Nine
      cardsPerPlayer: 12,
      allowJokers: true, // Ninety-Nine uses one joker
      timeLimit: 30,
      autoPlay: false,
      specialRules: {
        bidding: true,
        partnerships: false,
        trumps: true
      }
    }
  });
};

// Function to register the game with the registry
export function registerNinetyNineGame(registry: any) {
  registry.registerGame('ninety-nine', NinetyNineGame);
} 