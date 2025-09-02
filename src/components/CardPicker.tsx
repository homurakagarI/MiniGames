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
  suit: string;
  value: string;
  symbol: string;
  color: string;
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
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [eliminatedParticipants, setEliminatedParticipants] = useState<Participant[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<Participant[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [deckCards, setDeckCards] = useState<Card[]>([]);

  // Initialize card deck
  useEffect(() => {
    const suits = [
      { name: 'hearts', symbol: '♥', color: 'red' },
      { name: 'diamonds', symbol: '♦', color: 'red' },
      { name: 'clubs', symbol: '♣', color: 'black' },
      { name: 'spades', symbol: '♠', color: 'black' }
    ];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    const deck = suits.flatMap(suit => 
      values.map(value => ({
        suit: suit.name,
        value,
        symbol: suit.symbol,
        color: suit.color
      }))
    );
    
    setDeckCards(deck);
  }, []);

  // Initialize active participants
  useEffect(() => {
    setActiveParticipants(participants.filter(p => !p.isEliminated));
    setEliminatedParticipants(participants.filter(p => p.isEliminated));
  }, [participants]);

  const activeParticipantsList = activeParticipants.filter(p => !p.isEliminated);

  if (activeParticipantsList.length === 0 && participants.length > 0) {
    return (
      <div className="card-picker-container">
        <div className="no-participants">
          <h3>No more participants!</h3>
          <p>All participants have been eliminated.</p>
          <div className="controls">
            <button className="reset-button" onClick={onReset}>
              Reset Game
            </button>
            <button className="back-button" onClick={onBackToMenu}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="card-picker-container">
        <div className="no-participants">
          <h3>No participants added!</h3>
          <p>Please add participants to start the game.</p>
          <button className="back-button" onClick={onBackToMenu}>
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  const drawCard = () => {
    if (isDrawing || activeParticipantsList.length === 0 || deckCards.length === 0) return;

    setIsDrawing(true);
    setDrawnCard(null);
    setSelectedParticipant(null);

    // Simulate card drawing animation
    let animationCount = 0;
    const animationInterval = setInterval(() => {
      const randomCard = deckCards[Math.floor(Math.random() * deckCards.length)];
      setDrawnCard(randomCard);
      animationCount++;

      if (animationCount > 12) {
        clearInterval(animationInterval);
        
        // Final card and participant selection
        const finalCard = deckCards[Math.floor(Math.random() * deckCards.length)];
        const randomParticipant = activeParticipantsList[Math.floor(Math.random() * activeParticipantsList.length)];
        
        setDrawnCard(finalCard);
        setSelectedParticipant(randomParticipant);
        
        setTimeout(() => {
          setIsDrawing(false);
          handleResult(randomParticipant, finalCard);
        }, 1000);
      }
    }, 150);
  };

  const handleResult = (participant: Participant, card: Card) => {
    // Lucky cards: Aces, Kings, Queens, Jacks, and red cards
    const isLucky = card.value === 'A' || card.value === 'K' || card.value === 'Q' || card.value === 'J' || card.color === 'red';
    
    if (mode === 'elimination') {
      if (!isLucky) {
        // Participant is eliminated
        const updatedParticipant = { ...participant, isEliminated: true };
        setEliminatedParticipants(prev => [...prev, updatedParticipant]);
        setActiveParticipants(prev => prev.filter(p => p.id !== participant.id));
        
        onResult({
          winner: null,
          eliminated: [updatedParticipant],
          message: `${participant.name} drew ${card.value}${card.symbol} and was eliminated!`,
          gameFinished: activeParticipantsList.length <= 2
        });

        if (activeParticipantsList.length <= 2) {
          const winner = activeParticipantsList.find(p => p.id !== participant.id);
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
        onResult({
          winner: null,
          eliminated: [],
          message: `${participant.name} drew lucky card ${card.value}${card.symbol} and survives!`,
          gameFinished: false
        });
      }
    } else {
      // Winner picker mode
      if (isLucky) {
        setGameFinished(true);
        onResult({
          winner: participant,
          eliminated: [],
          message: `🎉 ${participant.name} drew lucky card ${card.value}${card.symbol} and wins!`,
          gameFinished: true
        });
      } else {
        onResult({
          winner: null,
          eliminated: [],
          message: `${participant.name} drew ${card.value}${card.symbol}. Try again!`,
          gameFinished: false
        });
      }
    }
  };

  const resetGame = () => {
    setIsDrawing(false);
    setDrawnCard(null);
    setSelectedParticipant(null);
    setGameFinished(false);
    setEliminatedParticipants([]);
    setActiveParticipants(participants.map(p => ({ ...p, isEliminated: false })));
    onReset();
  };

  return (
    <div className="card-picker-container">
      <div className="game-header">
        <h2>🃏 Card Picker</h2>
        <div className="game-info">
          <div className="mode-badge">
            {mode === 'elimination' ? 'Elimination Mode' : 'Winner Picker Mode'}
          </div>
          <div className="participants-count">
            {activeParticipantsList.length} Active Participants
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
            <div className="card back-card">🃏</div>
            <div className="card back-card offset-1">🃏</div>
            <div className="card back-card offset-2">🃏</div>
          </div>
          
          <div className="drawn-card-area">
            {drawnCard ? (
              <div className={`card drawn-card ${isDrawing ? 'flipping' : ''} ${drawnCard.color}`}>
                <div className="card-content">
                  <div className="card-value">{drawnCard.value}</div>
                  <div className="card-suit">{drawnCard.symbol}</div>
                </div>
              </div>
            ) : (
              <div className="empty-card">Draw a Card</div>
            )}
          </div>
        </div>

        {activeParticipantsList.length > 0 && (
          <div className="participants-display">
            <h4>Active Participants:</h4>
            <div className="participant-chips">
              {activeParticipantsList.map((participant) => (
                <div 
                  key={participant.id} 
                  className={`participant-chip ${
                    selectedParticipant?.id === participant.id ? 'selected' : ''
                  }`}
                >
                  {participant.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          className={`draw-button ${isDrawing || gameFinished ? 'disabled' : ''}`}
          onClick={drawCard}
          disabled={isDrawing || gameFinished || activeParticipantsList.length === 0}
        >
          {isDrawing ? 'Drawing...' : 'Draw Card'}
        </button>
      </div>

      {selectedParticipant && drawnCard && (
        <div className="result-display">
          <h3>{selectedParticipant.name}</h3>
          <p>Drew: <strong>{drawnCard.value}{drawnCard.symbol}</strong></p>
          {mode === 'elimination' ? (
            <p>{drawnCard.value === 'A' || drawnCard.value === 'K' || drawnCard.value === 'Q' || drawnCard.value === 'J' || drawnCard.color === 'red' ? 
                '🍀 Lucky card! Safe from elimination!' : 
                '💀 Unlucky card! Eliminated!'}</p>
          ) : (
            <p>{drawnCard.value === 'A' || drawnCard.value === 'K' || drawnCard.value === 'Q' || drawnCard.value === 'J' || drawnCard.color === 'red' ? 
                '🎉 Lucky card! You win!' : 
                '🎯 Try again for a lucky card!'}</p>
          )}
        </div>
      )}

      {eliminatedParticipants.length > 0 && mode === 'elimination' && (
        <div className="eliminated-section">
          <h4>Eliminated Participants:</h4>
          <div className="eliminated-list">
            {eliminatedParticipants.map((participant) => (
              <div key={participant.id} className="eliminated-participant">
                {participant.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="game-rules">
        <h4>Lucky Cards:</h4>
        <p>Aces (A), Kings (K), Queens (Q), Jacks (J), and all Red Cards (♥♦)</p>
      </div>

      <div className="controls">
        <button className="reset-button" onClick={resetGame}>
          Reset Game
        </button>
        <button className="back-button" onClick={onBackToMenu}>
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default CardPicker;
