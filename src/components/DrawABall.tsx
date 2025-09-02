import React, { useState, useEffect } from 'react';
import './DrawABall.css';
import type { Participant, GameMode, GameResult } from '../types';

interface DrawABallProps {
  participants: Participant[];
  mode: GameMode;
  onResult: (result: GameResult) => void;
  onReset: () => void;
  onBackToMenu: () => void;
}

const DrawABall: React.FC<DrawABallProps> = ({ 
  participants, 
  mode, 
  onResult, 
  onReset, 
  onBackToMenu 
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnBall, setDrawnBall] = useState<number | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [eliminatedParticipants, setEliminatedParticipants] = useState<Participant[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<Participant[]>([]);
  const [gameFinished, setGameFinished] = useState(false);

  // Initialize active participants
  useEffect(() => {
    setActiveParticipants(participants.filter(p => !p.isEliminated));
    setEliminatedParticipants(participants.filter(p => p.isEliminated));
  }, [participants]);

  const activeParticipantsList = activeParticipants.filter(p => !p.isEliminated);

  if (activeParticipantsList.length === 0 && participants.length > 0) {
    return (
      <div className="draw-ball-container">
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
      <div className="draw-ball-container">
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

  const drawBall = () => {
    if (isDrawing || activeParticipantsList.length === 0) return;

    setIsDrawing(true);
    setDrawnBall(null);
    setSelectedParticipant(null);

    // Simulate ball drawing animation
    let animationCount = 0;
    const animationInterval = setInterval(() => {
      const randomBall = Math.floor(Math.random() * 50) + 1;
      setDrawnBall(randomBall);
      animationCount++;

      if (animationCount > 15) {
        clearInterval(animationInterval);
        
        // Final ball number and participant selection
        const finalBall = Math.floor(Math.random() * 50) + 1;
        const randomParticipant = activeParticipantsList[Math.floor(Math.random() * activeParticipantsList.length)];
        
        setDrawnBall(finalBall);
        setSelectedParticipant(randomParticipant);
        
        setTimeout(() => {
          setIsDrawing(false);
          handleResult(randomParticipant, finalBall);
        }, 1000);
      }
    }, 100);
  };

  const handleResult = (participant: Participant, ballNumber: number) => {
    const isLucky = ballNumber % 7 === 0 || ballNumber === 13 || ballNumber === 21 || ballNumber === 42;
    
    if (mode === 'elimination') {
      if (!isLucky) {
        // Participant is eliminated
        const updatedParticipant = { ...participant, isEliminated: true };
        setEliminatedParticipants(prev => [...prev, updatedParticipant]);
        setActiveParticipants(prev => prev.filter(p => p.id !== participant.id));
        
        onResult({
          winner: null,
          eliminated: [updatedParticipant],
          message: `${participant.name} drew ball ${ballNumber} and was eliminated!`,
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
          message: `${participant.name} drew lucky ball ${ballNumber} and survives!`,
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
          message: `🎉 ${participant.name} drew lucky ball ${ballNumber} and wins!`,
          gameFinished: true
        });
      } else {
        onResult({
          winner: null,
          eliminated: [],
          message: `${participant.name} drew ball ${ballNumber}. Try again!`,
          gameFinished: false
        });
      }
    }
  };

  const resetGame = () => {
    setIsDrawing(false);
    setDrawnBall(null);
    setSelectedParticipant(null);
    setGameFinished(false);
    setEliminatedParticipants([]);
    setActiveParticipants(participants.map(p => ({ ...p, isEliminated: false })));
    onReset();
  };

  return (
    <div className="draw-ball-container">
      <div className="game-header">
        <h2>🎱 Draw a Ball</h2>
        <div className="game-info">
          <div className="mode-badge">
            {mode === 'elimination' ? 'Elimination Mode' : 'Winner Picker Mode'}
          </div>
          <div className="participants-count">
            {activeParticipantsList.length} Active Participants
          </div>
        </div>
      </div>

      <div className="ball-machine">
        <div className="machine-header">
          <div className="lights">
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
          </div>
        </div>

        <div className="ball-chamber">
          <div className={`ball ${isDrawing ? 'drawing' : ''}`}>
            {drawnBall !== null ? drawnBall : '?'}
          </div>
          <div className="chamber-label">Ball Numbers 1-50</div>
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
          onClick={drawBall}
          disabled={isDrawing || gameFinished || activeParticipantsList.length === 0}
        >
          {isDrawing ? 'Drawing...' : 'Draw Ball'}
        </button>
      </div>

      {selectedParticipant && drawnBall !== null && (
        <div className="result-display">
          <h3>{selectedParticipant.name}</h3>
          <p>Drew Ball Number: <strong>{drawnBall}</strong></p>
          {mode === 'elimination' ? (
            <p>{drawnBall % 7 === 0 || drawnBall === 13 || drawnBall === 21 || drawnBall === 42 ? 
                '🍀 Lucky ball! Safe from elimination!' : 
                '💀 Unlucky ball! Eliminated!'}</p>
          ) : (
            <p>{drawnBall % 7 === 0 || drawnBall === 13 || drawnBall === 21 || drawnBall === 42 ? 
                '🎉 Lucky ball! You win!' : 
                '🎯 Try again for a lucky number!'}</p>
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

export default DrawABall;
