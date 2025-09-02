import React, { useState, useEffect } from 'react';
import './SpinTheWheel.css';
import type { Participant, GameMode, GameResult } from '../types';

interface SpinTheWheelProps {
  participants: Participant[];
  mode: GameMode;
  onResult: (result: GameResult) => void;
  onReset: () => void;
  onBackToMenu: () => void;
}

const SpinTheWheel: React.FC<SpinTheWheelProps> = ({ 
  participants, 
  mode, 
  onResult, 
  onReset, 
  onBackToMenu 
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [eliminatedParticipants, setEliminatedParticipants] = useState<Participant[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<Participant[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  // Initialize active participants
  useEffect(() => {
    setActiveParticipants(participants.filter(p => !p.isEliminated));
    setEliminatedParticipants(participants.filter(p => p.isEliminated));
  }, [participants]);

  const activeParticipantsList = activeParticipants.filter(p => !p.isEliminated);

  // Error states with better UX
  if (activeParticipantsList.length === 0 && participants.length > 0) {
    return (
      <div className="wheel-game-container">
        <div className="empty-state">
          <div className="empty-icon">🏁</div>
          <h2>Game Complete!</h2>
          <p>All participants have been eliminated.</p>
          <div className="empty-actions">
            <button className="action-btn primary" onClick={onReset}>
              <span className="btn-icon">🔄</span>
              Start New Game
            </button>
            <button className="action-btn secondary" onClick={onBackToMenu}>
              <span className="btn-icon">🏠</span>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="wheel-game-container">
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

  // Enhanced color palette for better visual appeal
  const getParticipantColor = (index: number) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#FF7675', '#74B9FF',
      '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7',
      '#E17055', '#00B894', '#E84393', '#0984E3'
    ];
    return colors[index % colors.length];
  };

  // Enhanced spin function with better animation
  const spin = () => {
    if (isSpinning || activeParticipantsList.length === 0) return;

    setIsSpinning(true);
    setSpinCount(prev => prev + 1);

    // More realistic spin with varying speed
    const minSpins = 4;
    const maxSpins = 8;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    const newRotation = rotation + (360 * spins) + Math.random() * 360;
    setRotation(newRotation);

    // Calculate result with more sophisticated timing
    setTimeout(() => {
      const normalizedRotation = newRotation % 360;
      const sectionSize = 360 / activeParticipantsList.length;
      const selectedIndex = Math.floor((360 - normalizedRotation + (sectionSize / 2)) / sectionSize) % activeParticipantsList.length;
      const selectedParticipant = activeParticipantsList[selectedIndex];

      setIsSpinning(false);
      
      // Delay result handling for better UX
      setTimeout(() => handleResult(selectedParticipant), 500);
    }, 3500);
  };

  const handleResult = (selectedParticipant: Participant) => {
    if (mode === 'elimination') {
      // In elimination mode, the selected participant is always eliminated
      const updatedParticipant = { ...selectedParticipant, isEliminated: true };
      
      // Update state to remove participant from wheel
      setEliminatedParticipants(prev => [...prev, updatedParticipant]);
      setActiveParticipants(prev => prev.filter(p => p.id !== selectedParticipant.id));
      
      const remainingCount = activeParticipantsList.length - 1; // -1 because we just eliminated one
      
      onResult({
        winner: null,
        eliminated: [updatedParticipant],
        message: `💀 ${selectedParticipant.name} has been eliminated!`,
        gameFinished: remainingCount === 1
      });

      // Check if we have a winner (last person standing)
      if (remainingCount === 1) {
        const winner = activeParticipantsList.find(p => p.id !== selectedParticipant.id);
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
      } else if (remainingCount > 1) {
        // For intermediate eliminations, we don't need to call onResult 
        // since the game continues. The result display will show the elimination.
        console.log(`${remainingCount} participants remaining. Game continues...`);
      }
    } else {
      // Winner picker mode - keep original logic
      const isLucky = Math.random() > 0.3; // 70% chance of being lucky
      if (isLucky) {
        setGameFinished(true);
        onResult({
          winner: selectedParticipant,
          eliminated: [],
          message: `🎉 ${selectedParticipant.name} landed on the winning spot!`,
          gameFinished: true
        });
      } else {
        onResult({
          winner: null,
          eliminated: [],
          message: `${selectedParticipant.name} didn't land on the winning spot. Spin again!`,
          gameFinished: false
        });
      }
    }
  };

  const resetGame = () => {
    setIsSpinning(false);
    setRotation(0);
    setGameFinished(false);
    setSpinCount(0);
    // Reset all participants to active state
    const resetParticipants = participants.map(p => ({ ...p, isEliminated: false }));
    setEliminatedParticipants([]);
    setActiveParticipants(resetParticipants);
    onReset();
  };

  return (
    <div className="wheel-game-container">
      {/* Game Header */}
      <div className="game-header-section">
        <div className="game-title">
          <span className="game-icon">🎡</span>
          <h1>Spin the Wheel</h1>
          <span className="game-icon">🎡</span>
        </div>
        <div className="game-stats">
          <div className="stat-card">
            <div className="stat-number">{activeParticipantsList.length}</div>
            <div className="stat-label">Active Players</div>
          </div>
          <div className="stat-card mode-indicator">
            <div className="stat-content">
              <span className="mode-icon">{mode === 'elimination' ? '⚔️' : '🏆'}</span>
              <div className="mode-text">
                {mode === 'elimination' ? 'Elimination' : 'Winner Picker'}
              </div>
            </div>
          </div>
          {mode === 'elimination' && eliminatedParticipants.length > 0 && (
            <div className="stat-card eliminated-count">
              <div className="stat-number">{eliminatedParticipants.length}</div>
              <div className="stat-label">Eliminated</div>
            </div>
          )}
          <div className="stat-card spin-counter">
            <div className="stat-number">{spinCount}</div>
            <div className="stat-label">Spins</div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="game-main-area">
        {/* Wheel Section */}
        <div className="wheel-section-enhanced">
          <div className="wheel-container">
            {/* Wheel pointer */}
            <div className="wheel-pointer-enhanced">
              <div className="pointer-triangle"></div>
            </div>
            
            {/* The wheel */}
            <div 
              className={`wheel-enhanced ${isSpinning ? 'spinning' : ''}`}
              style={{ transform: `rotate(${rotation}deg)` }}
              role="img"
              aria-label="Spinning wheel"
            >
              <svg width="100%" height="100%" viewBox="0 0 200 200">
                {activeParticipantsList.map((participant, index) => {
                  const sectionAngle = 360 / activeParticipantsList.length;
                  const startAngle = (sectionAngle * index) - 90;
                  const endAngle = startAngle + sectionAngle;
                  
                  const centerX = 100;
                  const centerY = 100;
                  const radius = 95;
                  
                  const startAngleRad = (startAngle * Math.PI) / 180;
                  const endAngleRad = (endAngle * Math.PI) / 180;
                  
                  const x1 = centerX + radius * Math.cos(startAngleRad);
                  const y1 = centerY + radius * Math.sin(startAngleRad);
                  const x2 = centerX + radius * Math.cos(endAngleRad);
                  const y2 = centerY + radius * Math.sin(endAngleRad);
                  
                  const largeArcFlag = sectionAngle > 180 ? 1 : 0;
                  
                  const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');
                  
                  const textAngle = startAngle + sectionAngle / 2;
                  const textRadius = radius * 0.7;
                  const textAngleRad = (textAngle * Math.PI) / 180;
                  const textX = centerX + textRadius * Math.cos(textAngleRad);
                  const textY = centerY + textRadius * Math.sin(textAngleRad);
                  
                  return (
                    <g key={participant.id} className="wheel-section">
                      <path
                        d={pathData}
                        fill={getParticipantColor(index)}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="2"
                        className="wheel-segment"
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="participant-name"
                        style={{
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'
                        }}
                      >
                        {participant.name.length > 8 ? 
                          participant.name.substring(0, 8) + '...' : 
                          participant.name
                        }
                      </text>
                    </g>
                  );
                })}
                
                {/* Center circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="15"
                  fill="url(#centerGradient)"
                  stroke="#333"
                  strokeWidth="3"
                />
                
                {/* Gradient definitions */}
                <defs>
                  <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff" />
                    <stop offset="100%" stopColor="#ddd" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="controls-section-enhanced">
          {/* Spin Button */}
          <button 
            className={`spin-button-enhanced ${isSpinning || gameFinished ? 'disabled' : ''}`}
            onClick={spin}
            disabled={isSpinning || gameFinished || activeParticipantsList.length === 0}
            aria-label="Spin the wheel"
          >
            <span className="button-icon">
              {isSpinning ? '⏳' : '🎯'}
            </span>
            <span className="button-text">
              {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL'}
            </span>
          </button>

          {/* Eliminated Players */}
          {eliminatedParticipants.length > 0 && mode === 'elimination' && (
            <div className="eliminated-section-enhanced">
              <div className="section-header">
                <span className="section-icon">💀</span>
                <h4>Eliminated Players</h4>
              </div>
              <div className="eliminated-grid">
                {eliminatedParticipants.map((participant) => (
                  <div key={participant.id} className="eliminated-card">
                    <div className="eliminated-avatar">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="eliminated-name">{participant.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="action-btn reset-btn" onClick={resetGame}>
              <span className="btn-icon">🔄</span>
              Reset Game
            </button>
            <button className="action-btn select-game-btn" onClick={() => {
              console.log('Select Another Game clicked in SpinTheWheel');
              onBackToMenu();
            }}>
              <span className="btn-icon">🎮</span>
              Select Another Game
            </button>
            <button className="action-btn back-btn" onClick={() => {
              console.log('Back to Menu clicked in SpinTheWheel');
              onBackToMenu();
            }}>
              <span className="btn-icon">🏠</span>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpinTheWheel;
