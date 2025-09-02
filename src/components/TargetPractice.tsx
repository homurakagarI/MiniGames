import React, { useState, useEffect, useCallback } from 'react';
import type { Participant, GameMode, GameResult } from '../types';
import './TargetPractice.css';

interface TargetPracticeProps {
  participants: Participant[];
  mode: GameMode;
  onResult: (result: GameResult) => void;
  onReset: () => void;
  onBackToMenu: () => void;
}

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  points: number;
  color: string;
  isHit: boolean;
  timeLeft: number;
}

interface PlayerScore {
  participant: Participant;
  score: number;
  shots: number;
  hits: number;
  accuracy: number;
}

const TargetPractice: React.FC<TargetPracticeProps> = ({
  participants,
  mode,
  onResult,
  onReset,
  onBackToMenu
}) => {
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'gameOver'>('setup');
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [gameTime, setGameTime] = useState(30); // 30 seconds per player
  const [crosshair, setCrosshair] = useState({ x: 250, y: 250 });

  const GAME_WIDTH = 500;
  const GAME_HEIGHT = 400;
  const TARGET_LIFETIME = 3000; // 3 seconds
  
  const activeParticipants = participants.filter(p => !p.isEliminated);

  useEffect(() => {
    if (gamePhase === 'setup') {
      setPlayerScores(
        activeParticipants.map(participant => ({
          participant,
          score: 0,
          shots: 0,
          hits: 0,
          accuracy: 0
        }))
      );
    }
  }, [gamePhase, activeParticipants]);

  // Game timer
  useEffect(() => {
    let timer: number;
    if (gamePhase === 'playing' && gameTime > 0) {
      timer = window.setTimeout(() => {
        setGameTime(prev => prev - 1);
      }, 1000);
    } else if (gameTime === 0) {
      endCurrentPlayerTurn();
    }
    return () => clearTimeout(timer);
  }, [gameTime, gamePhase]);

  // Target spawning
  useEffect(() => {
    let spawnTimer: number;
    if (gamePhase === 'playing') {
      spawnTimer = window.setTimeout(() => {
        spawnTarget();
      }, 800 + Math.random() * 1500);
    }
    return () => clearTimeout(spawnTimer);
  }, [targets, gamePhase]);

  // Target lifecycle
  useEffect(() => {
    let lifecycleTimer: number;
    if (gamePhase === 'playing') {
      lifecycleTimer = window.setTimeout(() => {
        setTargets(prev => 
          prev
            .map(target => ({ ...target, timeLeft: target.timeLeft - 100 }))
            .filter(target => target.timeLeft > 0 && !target.isHit)
        );
      }, 100);
    }
    return () => clearTimeout(lifecycleTimer);
  }, [targets, gamePhase]);

  // Mouse tracking for crosshair
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const gameArea = document.querySelector('.target-game-area');
      if (gameArea && gamePhase === 'playing') {
        const rect = gameArea.getBoundingClientRect();
        setCrosshair({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    if (gamePhase === 'playing') {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gamePhase]);

  const spawnTarget = () => {
    const targetTypes = [
      { size: 60, points: 10, color: '#ff6b6b' },   // Large, easy
      { size: 40, points: 25, color: '#4ecdc4' },   // Medium
      { size: 25, points: 50, color: '#45b7d1' },   // Small, hard
      { size: 80, points: 5, color: '#ffa726' }     // Very large, low points
    ];
    
    const type = targetTypes[Math.floor(Math.random() * targetTypes.length)];
    
    const newTarget: Target = {
      id: Date.now() + Math.random(),
      x: Math.random() * (GAME_WIDTH - type.size - 20) + 10,
      y: Math.random() * (GAME_HEIGHT - type.size - 20) + 10,
      size: type.size,
      points: type.points,
      color: type.color,
      isHit: false,
      timeLeft: TARGET_LIFETIME
    };
    
    setTargets(prev => [...prev, newTarget]);
  };

  const handleTargetClick = useCallback((targetId: number) => {
    setTargets(prev => 
      prev.map(target => 
        target.id === targetId ? { ...target, isHit: true } : target
      )
    );

    const hitTarget = targets.find(t => t.id === targetId);
    if (hitTarget && !hitTarget.isHit) {
      // Update current player's score
      setPlayerScores(prev => 
        prev.map((ps, index) => {
          if (index === currentPlayerIndex) {
            const newHits = ps.hits + 1;
            const newShots = ps.shots + 1;
            return {
              ...ps,
              score: ps.score + hitTarget.points,
              hits: newHits,
              shots: newShots,
              accuracy: Math.round((newHits / newShots) * 100)
            };
          }
          return ps;
        })
      );
    }
  }, [targets, currentPlayerIndex]);

  const handleMiss = useCallback(() => {
    // Update shots count for current player
    setPlayerScores(prev => 
      prev.map((ps, index) => {
        if (index === currentPlayerIndex) {
          const newShots = ps.shots + 1;
          return {
            ...ps,
            shots: newShots,
            accuracy: ps.hits > 0 ? Math.round((ps.hits / newShots) * 100) : 0
          };
        }
        return ps;
      })
    );
  }, [currentPlayerIndex]);

  const startGame = () => {
    if (activeParticipants.length === 0) return;
    
    setCurrentPlayerIndex(0);
    startPlayerTurn(0);
  };

  const startPlayerTurn = (playerIndex: number) => {
    setCurrentPlayerIndex(playerIndex);
    setGamePhase('playing');
    setTargets([]);
    setGameTime(30);
    setCrosshair({ x: 250, y: 250 });
  };

  const endCurrentPlayerTurn = () => {
    setGamePhase('setup');
    setTargets([]);

    // Move to next player or end game
    if (currentPlayerIndex < activeParticipants.length - 1) {
      const nextIndex = currentPlayerIndex + 1;
      setCurrentPlayerIndex(nextIndex);
      // Auto-start next player after 2 seconds
      window.setTimeout(() => {
        startPlayerTurn(nextIndex);
      }, 2000);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setGamePhase('gameOver');
    
    // Sort players by score
    const sortedScores = [...playerScores].sort((a, b) => b.score - a.score);
    const winner = sortedScores[0];

    if (mode === 'winner-picker') {
      onResult({
        winner: winner.participant,
        message: `🎯 Sharpshooter with ${winner.score} points! (${winner.accuracy}% accuracy)`,
        gameFinished: true,
        eliminated: []
      });
    } else {
      // Elimination mode - eliminate lowest scorers
      const lowestScore = sortedScores[sortedScores.length - 1].score;
      const eliminated = sortedScores
        .filter(ps => ps.score === lowestScore)
        .map(ps => ps.participant);
      
      onResult({
        winner: null,
        message: `Target practice complete! Lowest scorers eliminated.`,
        gameFinished: false,
        eliminated
      });
    }
  };

  const resetGame = () => {
    setGamePhase('setup');
    setCurrentPlayerIndex(0);
    setPlayerScores([]);
    setTargets([]);
    setGameTime(30);
    setCrosshair({ x: 250, y: 250 });
    onReset();
  };

  if (activeParticipants.length === 0) {
    return (
      <div className="targetpractice-container">
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h2>No Active Participants</h2>
          <p>Add some participants to start target practice!</p>
          <div className="empty-actions">
            <button className="action-btn primary" onClick={onBackToMenu}>
              🏠 Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="targetpractice-container">
      <div className="targetpractice-header">
        <h2>🎯 Target Practice</h2>
        <p>Click on targets to score points - smaller targets are worth more!</p>
        <div className="game-info">
          30 seconds per player • Different target sizes = different points
        </div>
      </div>

      {gamePhase === 'setup' && (
        <div className="setup-section">
          <div className="game-instructions">
            <h3>🎮 How to Play</h3>
            <div className="target-types">
              <div className="target-example">
                <div className="example-target large" style={{ backgroundColor: '#ffa726' }}></div>
                <span>Large Target = 5 points</span>
              </div>
              <div className="target-example">
                <div className="example-target medium" style={{ backgroundColor: '#ff6b6b' }}></div>
                <span>Medium Target = 10 points</span>
              </div>
              <div className="target-example">
                <div className="example-target small" style={{ backgroundColor: '#4ecdc4' }}></div>
                <span>Small Target = 25 points</span>
              </div>
              <div className="target-example">
                <div className="example-target tiny" style={{ backgroundColor: '#45b7d1' }}></div>
                <span>Tiny Target = 50 points</span>
              </div>
            </div>
            
            <div className="instructions-list">
              <div className="instruction-item">
                <div className="instruction-icon">🖱️</div>
                <div>Click on targets before they disappear</div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">⏱️</div>
                <div>Targets last 3 seconds each</div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">🎯</div>
                <div>Smaller targets = higher points</div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">📊</div>
                <div>Accuracy matters too!</div>
              </div>
            </div>
            
            <div className="players-queue">
              <h4>👥 Player Queue</h4>
              <div className="queue-list">
                {activeParticipants.map((participant, index) => (
                  <div 
                    key={participant.id} 
                    className={`queue-item ${index === currentPlayerIndex ? 'current' : ''} ${
                      playerScores.find(ps => ps.participant.id === participant.id)?.score ? 'completed' : ''
                    }`}
                  >
                    <div className="queue-position">{index + 1}</div>
                    <div className="participant-info">
                      <div className="participant-avatar">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{participant.name}</span>
                    </div>
                    <div className="player-stats">
                      {playerScores.find(ps => ps.participant.id === participant.id) && (
                        <>
                          <div className="score">{playerScores.find(ps => ps.participant.id === participant.id)?.score || 0} pts</div>
                          <div className="accuracy">{playerScores.find(ps => ps.participant.id === participant.id)?.accuracy || 0}% acc</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {currentPlayerIndex === 0 && playerScores.every(ps => ps.score === 0) ? (
            <button className="start-game-btn" onClick={startGame}>
              🎯 Start Target Practice
            </button>
          ) : (
            <div className="next-player-info">
              <h3>🎯 Next Up: {activeParticipants[currentPlayerIndex]?.name}</h3>
              <p>Get ready to aim and click!</p>
              <button 
                className="start-turn-btn" 
                onClick={() => startPlayerTurn(currentPlayerIndex)}
              >
                🎯 Start Turn
              </button>
            </div>
          )}
        </div>
      )}

      {gamePhase === 'playing' && (
        <div className="game-section">
          <div className="game-ui">
            <div className="player-info">
              <strong>🎯 {activeParticipants[currentPlayerIndex]?.name}</strong>
            </div>
            <div className="score-display">
              Score: {playerScores[currentPlayerIndex]?.score || 0}
            </div>
            <div className="stats-display">
              Shots: {playerScores[currentPlayerIndex]?.shots || 0} | 
              Hits: {playerScores[currentPlayerIndex]?.hits || 0} | 
              Accuracy: {playerScores[currentPlayerIndex]?.accuracy || 0}%
            </div>
            <div className="timer-display">Time: {gameTime}s</div>
          </div>
          
          <div 
            className="target-game-area" 
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              
              // Check if click hit any target
              let hitTarget = false;
              targets.forEach(target => {
                const distance = Math.sqrt(
                  Math.pow(clickX - (target.x + target.size/2), 2) + 
                  Math.pow(clickY - (target.y + target.size/2), 2)
                );
                if (distance <= target.size/2 && !target.isHit) {
                  handleTargetClick(target.id);
                  hitTarget = true;
                }
              });
              
              if (!hitTarget) {
                handleMiss();
              }
            }}
          >
            {/* Crosshair */}
            <div 
              className="crosshair"
              style={{
                left: crosshair.x - 10,
                top: crosshair.y - 10
              }}
            >
              ✚
            </div>
            
            {/* Targets */}
            {targets.map(target => (
              <div
                key={target.id}
                className={`target ${target.isHit ? 'hit' : ''}`}
                style={{
                  left: target.x,
                  top: target.y,
                  width: target.size,
                  height: target.size,
                  backgroundColor: target.color,
                  opacity: target.isHit ? 0.3 : (target.timeLeft / TARGET_LIFETIME)
                }}
              >
                {target.isHit && <span className="hit-marker">+{target.points}</span>}
              </div>
            ))}
          </div>
          
          <div className="game-help">
            <span>Move mouse to aim • Click to shoot</span>
          </div>
        </div>
      )}

      {gamePhase === 'gameOver' && (
        <div className="results-section">
          <div className="results-header">
            <h3>🎉 Target Practice Complete!</h3>
          </div>
          
          <div className="final-scores">
            {playerScores
              .sort((a, b) => b.score - a.score)
              .map((ps, index) => (
                <div key={ps.participant.id} className={`score-card ${index === 0 ? 'winner' : ''}`}>
                  <div className="rank">{index + 1}</div>
                  <div className="participant-info">
                    <div className="participant-avatar">
                      {ps.participant.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{ps.participant.name}</span>
                  </div>
                  <div className="final-stats">
                    <div className="final-score">{ps.score} points</div>
                    <div className="final-accuracy">{ps.accuracy}% accuracy</div>
                    <div className="final-ratio">{ps.hits}/{ps.shots} hits</div>
                  </div>
                  {index === 0 && <div className="winner-crown">👑</div>}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="targetpractice-controls">
        <button className="reset-btn" onClick={resetGame}>
          🔄 Reset Game
        </button>
        <button className="select-game-btn" onClick={() => {
          console.log('Select Another Game clicked in TargetPractice');
          onBackToMenu();
        }}>
          🎮 Select Another Game
        </button>
        <button className="back-btn" onClick={() => {
          console.log('Back to Menu clicked in TargetPractice');
          onBackToMenu();
        }}>
          🏠 Back to Menu
        </button>
      </div>
    </div>
  );
};

export default TargetPractice;
