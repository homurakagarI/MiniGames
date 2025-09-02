import React, { useState, useEffect } from 'react';
import './CardPicker.css';
import type { Participant, GameMode, GameResult } from '../types';

interface CardPickerProps {
  participants: Participant[];
  mode: GameMode;
  onResult: (result: GameResult) => void;
  onReset: () => void;
  onBackToMenu: () => void;
}

interface Card {
  id: string;
  suit: string;
  value: string;
  symbol: string;
  color: string;
  displayName: string;
  assignedParticipant?: Participant;
}

interface CardAssignment {
  cardId: string;
  participantId: string;
}

const CardPicker: React.FC<CardPickerProps> = ({ 
  participants, 
  mode, 
  onResult, 
  onReset, 
  onBackToMenu 
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const [eliminatedParticipants, setEliminatedParticipants] = useState<Participant[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<Participant[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [cardAssignments, setCardAssignments] = useState<CardAssignment[]>([]);
  const [showAssignmentView, setShowAssignmentView] = useState(true);
  const [shuffledCards, setShuffledCards] = useState<Card[]>([]);

  // Initialize cards based on number of participants
  useEffect(() => {
    const suits = [
      { name: 'hearts', symbol: '♥', color: 'red' },
      { name: 'diamonds', symbol: '♦', color: 'red' },
      { name: 'clubs', symbol: '♣', color: 'black' },
      { name: 'spades', symbol: '♠', color: 'black' }
    ];
    
    // All card values from high to low
    const allValues = [
      { value: 'A', name: 'Ace' },
      { value: 'K', name: 'King' },
      { value: 'Q', name: 'Queen' },
      { value: 'J', name: 'Jack' },
      { value: '10', name: '10' },
      { value: '9', name: '9' },
      { value: '8', name: '8' },
      { value: '7', name: '7' },
      { value: '6', name: '6' },
      { value: '5', name: '5' },
      { value: '4', name: '4' },
      { value: '3', name: '3' },
      { value: '2', name: '2' }
    ];
    
    // Generate all possible cards
    const allCards = suits.flatMap(suit => 
      allValues.map(val => ({
        id: `${val.value}-${suit.name}`,
        suit: suit.name,
        value: val.value,
        symbol: suit.symbol,
        color: suit.color,
        displayName: `${val.name} of ${suit.name.charAt(0).toUpperCase() + suit.name.slice(1)}`,
        assignedParticipant: undefined
      }))
    );
    
    // Only take as many cards as there are participants
    const participantCount = participants.filter(p => !p.isEliminated).length;
    const cardsToUse = allCards.slice(0, participantCount);
    
    setAvailableCards(cardsToUse);
  }, [participants]);

  // Initialize active participants
  useEffect(() => {
    setActiveParticipants(participants.filter(p => !p.isEliminated));
    setEliminatedParticipants(participants.filter(p => p.isEliminated));
  }, [participants]);

  const activeParticipantsList = activeParticipants.filter(p => !p.isEliminated);
  const assignedCards = availableCards.filter(card => 
    cardAssignments.some(assignment => assignment.cardId === card.id)
  );

  // Get participant for a card
  const getCardParticipant = (cardId: string): Participant | undefined => {
    const assignment = cardAssignments.find(a => a.cardId === cardId);
    if (!assignment) return undefined;
    return activeParticipantsList.find(p => p.id === assignment.participantId);
  };

  // Assign participant to card
  const assignParticipantToCard = (cardId: string, participantId: string) => {
    setCardAssignments(prev => {
      // Remove any existing assignment for this card
      const filtered = prev.filter(a => a.cardId !== cardId);
      // Add new assignment
      return [...filtered, { cardId, participantId }];
    });
  };

  // Remove assignment
  const removeAssignment = (cardId: string) => {
    setCardAssignments(prev => prev.filter(a => a.cardId !== cardId));
  };

  // Start the game with assigned cards
  const startGame = () => {
    if (assignedCards.length === 0) {
      alert('Please assign at least one participant to a card before starting!');
      return;
    }
    
    // Create shuffled deck from assigned cards
    const shuffled = [...assignedCards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setShowAssignmentView(false);
  };

  // Go back to assignment view
  const backToAssignment = () => {
    setShowAssignmentView(true);
    setDrawnCard(null);
    setIsDrawing(false);
  };

  const drawCard = () => {
    if (isDrawing || shuffledCards.length === 0) return;

    setIsDrawing(true);
    setDrawnCard(null);

    // Animate through cards before final selection
    let animationCount = 0;
    const animationInterval = setInterval(() => {
      const randomCard = shuffledCards[Math.floor(Math.random() * shuffledCards.length)];
      setDrawnCard(randomCard);
      animationCount++;

      if (animationCount > 15) {
        clearInterval(animationInterval);
        
        // Final card selection
        const finalCard = shuffledCards[Math.floor(Math.random() * shuffledCards.length)];
        const assignedParticipant = getCardParticipant(finalCard.id);
        
        setDrawnCard(finalCard);
        
        setTimeout(() => {
          setIsDrawing(false);
          if (assignedParticipant) {
            handleResult(assignedParticipant, finalCard);
          }
        }, 1000);
      }
    }, 120);
  };

  const handleResult = (participant: Participant, card: Card) => {
    if (mode === 'elimination') {
      // In elimination mode, the participant assigned to the drawn card is eliminated
      const updatedParticipant = { ...participant, isEliminated: true };
      setEliminatedParticipants(prev => [...prev, updatedParticipant]);
      setActiveParticipants(prev => prev.filter(p => p.id !== participant.id));
      
      // Remove the card from shuffled deck
      setShuffledCards(prev => prev.filter(c => c.id !== card.id));
      
      // Also remove from assignments
      removeAssignment(card.id);
      
      const remainingAssigned = cardAssignments.filter(a => a.cardId !== card.id).length;
      
      onResult({
        winner: null,
        eliminated: [updatedParticipant],
        message: `${participant.name} was assigned to ${card.displayName} and has been eliminated!`,
        gameFinished: remainingAssigned === 1
      });

      // Check if we have a winner (last person standing)
      if (remainingAssigned === 1) {
        const lastAssignment = cardAssignments.find(a => a.cardId !== card.id);
        const winner = lastAssignment ? activeParticipantsList.find(p => p.id === lastAssignment.participantId) : null;
        
        setTimeout(() => {
          setGameFinished(true);
          if (winner) {
            onResult({
              winner,
              eliminated: [],
              message: `🎉 ${winner.name} is the last one standing and wins!`,
              gameFinished: true
            });
          }
        }, 2000);
      }
    } else {
      // Winner picker mode - the drawn card's participant wins
      setGameFinished(true);
      onResult({
        winner: participant,
        eliminated: [],
        message: `🎉 ${participant.name} was assigned to ${card.displayName} and wins!`,
        gameFinished: true
      });
    }
  };

  const resetGame = () => {
    setIsDrawing(false);
    setDrawnCard(null);
    setGameFinished(false);
    setEliminatedParticipants([]);
    setActiveParticipants(participants.map(p => ({ ...p, isEliminated: false })));
    setCardAssignments([]);
    setShowAssignmentView(true);
    setShuffledCards([]);
    onReset();
  };

  // Error states
  if (participants.length === 0) {
    return (
      <div className="card-picker-container">
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h2>No Participants</h2>
          <p>Please add participants to start playing!</p>
          <div className="empty-actions">
            <button className="action-btn primary" onClick={onBackToMenu}>
              <span className="btn-icon">➕</span>
              Add Participants
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assignment View
  if (showAssignmentView) {
    return (
      <div className="card-picker-container">
        <div className="assignment-header">
          <h2>🃏 Card Assignment</h2>
          <p>Assign participants to playing cards. When a card is drawn, its assigned participant will be selected!</p>
          <div className="mode-badge">
            {mode === 'elimination' ? 'Elimination Mode' : 'Winner Picker Mode'}
          </div>
        </div>

        <div className="assignment-grid">
          <div className="available-participants">
            <h3>👥 Participants ({activeParticipantsList.length})</h3>
            <div className="participant-list">
              {activeParticipantsList.map(participant => (
                <div key={participant.id} className="participant-card">
                  <div className="participant-avatar">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="participant-name">{participant.name}</span>
                  <div className="assigned-to">
                    {cardAssignments.find(a => a.participantId === participant.id) ? 
                      `→ ${availableCards.find(c => c.id === cardAssignments.find(a => a.participantId === participant.id)?.cardId)?.displayName}` :
                      'Not assigned'
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="available-cards">
            <h3>🃏 Playing Cards</h3>
            <div className="cards-grid">
              {availableCards.map(card => {
                const assignedParticipant = getCardParticipant(card.id);
                const isAssigned = !!assignedParticipant;
                
                return (
                  <div key={card.id} className={`card-assignment ${isAssigned ? 'assigned' : 'available'}`}>
                    <div className={`playing-card ${card.color}`}>
                      <div className="card-content">
                        <div className="card-value">{card.value}</div>
                        <div className="card-suit">{card.symbol}</div>
                      </div>
                    </div>
                    <div className="card-info">
                      <div className="card-name">{card.displayName}</div>
                      {isAssigned ? (
                        <div className="assignment-info">
                          <span className="assigned-participant">
                            👤 {assignedParticipant.name}
                          </span>
                          <button 
                            className="remove-assignment"
                            onClick={() => removeAssignment(card.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <select 
                          className="participant-selector"
                          onChange={(e) => e.target.value && assignParticipantToCard(card.id, e.target.value)}
                          value=""
                        >
                          <option value="">Assign participant...</option>
                          {activeParticipantsList
                            .filter(p => !cardAssignments.some(a => a.participantId === p.id))
                            .map(participant => (
                              <option key={participant.id} value={participant.id}>
                                {participant.name}
                              </option>
                            ))
                          }
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="assignment-summary">
          <h4>📊 Assignment Summary</h4>
          <p>{cardAssignments.length} of {activeParticipantsList.length} participants assigned to cards</p>
          {cardAssignments.length < activeParticipantsList.length && (
            <p style={{ color: '#e74c3c', fontSize: '0.9rem' }}>
              Please assign all participants to cards before starting the game
            </p>
          )}
          <div className="assigned-list">
            {assignedCards.map(card => {
              const participant = getCardParticipant(card.id);
              return (
                <div key={card.id} className="assignment-item">
                  <span className="card-name">{card.displayName}</span>
                  <span className="arrow">→</span>
                  <span className="participant-name">{participant?.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="assignment-actions">
          <button 
            className={`start-game-btn ${cardAssignments.length !== activeParticipantsList.length ? 'disabled' : ''}`}
            onClick={startGame}
            disabled={cardAssignments.length !== activeParticipantsList.length}
          >
            <span className="btn-icon">🎯</span>
            Start Card Game ({cardAssignments.length}/{activeParticipantsList.length} assigned)
          </button>
          <button className="back-btn" onClick={onBackToMenu}>
            <span className="btn-icon">🏠</span>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Game View
  return (
    <div className="card-picker-container">
      <div className="game-header">
        <h2>🃏 Card Drawing Game</h2>
        <div className="game-info">
          <div className="mode-badge">
            {mode === 'elimination' ? 'Elimination Mode' : 'Winner Picker Mode'}
          </div>
          <div className="cards-count">
            {shuffledCards.length} Cards Remaining
          </div>
        </div>
      </div>

      <div className="card-table">
        <div className="table-header">
          <div className="table-lights">
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
          </div>
        </div>

        <div className="card-display">
          <div className="deck">
            {shuffledCards.slice(0, 3).map((_, index) => (
              <div key={index} className={`card back-card offset-${index}`}>🃏</div>
            ))}
          </div>
          
          <div className="drawn-card-area">
            {drawnCard ? (
              <div className={`card drawn-card ${isDrawing ? 'flipping' : ''} ${drawnCard.color}`}>
                <div className="card-content">
                  <div className="card-value">{drawnCard.value}</div>
                  <div className="card-suit">{drawnCard.symbol}</div>
                </div>
                <div className="card-assignment-info">
                  {getCardParticipant(drawnCard.id)?.name}
                </div>
              </div>
            ) : (
              <div className="empty-card">Draw a Card</div>
            )}
          </div>
        </div>

        <button 
          className={`draw-button ${isDrawing || gameFinished || shuffledCards.length === 0 ? 'disabled' : ''}`}
          onClick={drawCard}
          disabled={isDrawing || gameFinished || shuffledCards.length === 0}
        >
          {isDrawing ? 'Drawing...' : 'Draw Card'}
        </button>
      </div>

      {drawnCard && !isDrawing && (
        <div className="result-display">
          <h3>Card Drawn: {drawnCard.displayName}</h3>
          <p>Assigned to: <strong>{getCardParticipant(drawnCard.id)?.name}</strong></p>
          {mode === 'elimination' ? (
            <p>💀 This participant has been eliminated!</p>
          ) : (
            <p>🎉 This participant wins!</p>
          )}
        </div>
      )}

      {eliminatedParticipants.length > 0 && mode === 'elimination' && (
        <div className="eliminated-section">
          <h4>💀 Eliminated Participants:</h4>
          <div className="eliminated-list">
            {eliminatedParticipants.map((participant) => (
              <div key={participant.id} className="eliminated-participant">
                {participant.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="remaining-assignments">
        <h4>🃏 Remaining Cards & Assignments:</h4>
        <div className="assignment-chips">
          {shuffledCards.map(card => {
            const participant = getCardParticipant(card.id);
            return (
              <div key={card.id} className="assignment-chip">
                <span className="card-info">{card.displayName}</span>
                <span className="participant-info">→ {participant?.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="controls">
        <button className="assignment-btn" onClick={backToAssignment}>
          🔄 Change Assignments
        </button>
        <button className="reset-button" onClick={resetGame}>
          Reset Game
        </button>
        <button className="select-game-button" onClick={() => {
          console.log('Select Another Game clicked in CardPicker_enhanced');
          onBackToMenu();
        }}>
          🎮 Select Another Game
        </button>
        <button className="back-button" onClick={() => {
          console.log('Back to Menu clicked in CardPicker_enhanced');
          onBackToMenu();
        }}>
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default CardPicker;
