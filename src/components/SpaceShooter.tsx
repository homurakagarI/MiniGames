import React, { useState, useEffect, useCallback } from 'react';
import type { Participant, GameMode, GameResult } from '../types';
import './SpaceShooter.css';

interface SpaceShooterProps {
  participants: Participant[];
  mode: GameMode;
  onResult: (result: GameResult) => void;
  onReset: () => void;
  onBackToMenu: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  speed: number;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
}

interface PlayerScore {
  participant: Participant;
  score: number;
  isPlaying: boolean;
}

const SpaceShooter: React.FC<SpaceShooterProps> = ({
  participants,
  mode,
  onResult,
  onReset,
  onBackToMenu
}) => {
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'gameOver'>('setup');
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 250, y: 450 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [score, setScore] = useState(0);
  const [gameTime, setGameTime] = useState(60); // 60 seconds game
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());

  const GAME_WIDTH = 500;
  const GAME_HEIGHT = 500;
  const PLAYER_SPEED = 8;
  const BULLET_SPEED = 10;
  const ENEMY_SPEED = 2;

  const activeParticipants = participants.filter(p => !p.isEliminated);

  useEffect(() => {
    if (gamePhase === 'setup') {
      setPlayerScores(
        activeParticipants.map(participant => ({
          participant,
          score: 0,
          isPlaying: false
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

  // Enemy spawning
  useEffect(() => {
    let spawnTimer: number;
    if (gamePhase === 'playing') {
      spawnTimer = window.setTimeout(() => {
        spawnEnemy();
      }, 1000 + Math.random() * 2000);
    }
    return () => clearTimeout(spawnTimer);
  }, [enemies, gamePhase]);

  // Game loop
  useEffect(() => {
    let gameLoop: number;
    if (gamePhase === 'playing') {
      gameLoop = requestAnimationFrame(updateGame);
    }
    return () => cancelAnimationFrame(gameLoop);
  }, [gamePhase, enemies, bullets, playerPosition, keysPressed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed(prev => new Set(prev).add(e.key));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.key);
        return newSet;
      });
    };

    if (gamePhase === 'playing') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gamePhase]);

  const spawnEnemy = () => {
    const newEnemy: Enemy = {
      id: Date.now() + Math.random(),
      x: Math.random() * (GAME_WIDTH - 40),
      y: -40,
      speed: ENEMY_SPEED + Math.random() * 2
    };
    setEnemies(prev => [...prev, newEnemy]);
  };

  const shootBullet = useCallback(() => {
    const newBullet: Bullet = {
      id: Date.now() + Math.random(),
      x: playerPosition.x + 20,
      y: playerPosition.y
    };
    setBullets(prev => [...prev, newBullet]);
  }, [playerPosition]);

  const updateGame = useCallback(() => {
    // Update player position
    setPlayerPosition(prev => {
      let newX = prev.x;
      let newY = prev.y;

      if (keysPressed.has('ArrowLeft') || keysPressed.has('a')) {
        newX = Math.max(0, newX - PLAYER_SPEED);
      }
      if (keysPressed.has('ArrowRight') || keysPressed.has('d')) {
        newX = Math.min(GAME_WIDTH - 40, newX + PLAYER_SPEED);
      }
      if (keysPressed.has('ArrowUp') || keysPressed.has('w')) {
        newY = Math.max(0, newY - PLAYER_SPEED);
      }
      if (keysPressed.has('ArrowDown') || keysPressed.has('s')) {
        newY = Math.min(GAME_HEIGHT - 40, newY + PLAYER_SPEED);
      }

      return { x: newX, y: newY };
    });

    // Shoot bullets
    if (keysPressed.has(' ')) {
      shootBullet();
    }

    // Update bullets
    setBullets(prev => 
      prev
        .map(bullet => ({ ...bullet, y: bullet.y - BULLET_SPEED }))
        .filter(bullet => bullet.y > -10)
    );

    // Update enemies
    setEnemies(prev => 
      prev
        .map(enemy => ({ ...enemy, y: enemy.y + enemy.speed }))
        .filter(enemy => enemy.y < GAME_HEIGHT + 40)
    );

    // Check collisions
    setBullets(prevBullets => {
      const remainingBullets: Bullet[] = [];
      let scoreIncrease = 0;

      setEnemies(prevEnemies => {
        const remainingEnemies: Enemy[] = [];

        prevBullets.forEach(bullet => {
          let bulletHit = false;
          
          prevEnemies.forEach(enemy => {
            if (!bulletHit && 
                bullet.x < enemy.x + 40 && 
                bullet.x + 10 > enemy.x &&
                bullet.y < enemy.y + 40 && 
                bullet.y + 10 > enemy.y) {
              bulletHit = true;
              scoreIncrease += 10;
            }
          });
          
          if (!bulletHit) {
            remainingBullets.push(bullet);
          }
        });

        // Add enemies that weren't hit
        prevEnemies.forEach(enemy => {
          let enemyHit = false;
          prevBullets.forEach(bullet => {
            if (bullet.x < enemy.x + 40 && 
                bullet.x + 10 > enemy.x &&
                bullet.y < enemy.y + 40 && 
                bullet.y + 10 > enemy.y) {
              enemyHit = true;
            }
          });
          if (!enemyHit) {
            remainingEnemies.push(enemy);
          }
        });

        if (scoreIncrease > 0) {
          setScore(prev => prev + scoreIncrease);
        }

        return remainingEnemies;
      });
      
      return remainingBullets.filter(bullet => bullet.y > -10);
    });

    if (gamePhase === 'playing') {
      requestAnimationFrame(updateGame);
    }
  }, [keysPressed, playerPosition, shootBullet, gamePhase]);

  const startGame = () => {
    if (activeParticipants.length === 0) return;
    
    setCurrentPlayerIndex(0);
    startPlayerTurn(0);
  };

  const startPlayerTurn = (playerIndex: number) => {
    setGamePhase('playing');
    setPlayerPosition({ x: 250, y: 450 });
    setEnemies([]);
    setBullets([]);
    setScore(0);
    setGameTime(60);
    setKeysPressed(new Set());
    
    setPlayerScores(prev => 
      prev.map((ps, index) => ({
        ...ps,
        isPlaying: index === playerIndex
      }))
    );
  };

  const endCurrentPlayerTurn = () => {
    setGamePhase('setup');
    
    // Update the current player's score
    setPlayerScores(prev => 
      prev.map((ps, index) => 
        index === currentPlayerIndex 
          ? { ...ps, score: Math.max(ps.score, score), isPlaying: false }
          : ps
      )
    );

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
        message: `🚀 Space Ace with ${winner.score} points!`,
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
        message: `Space battle complete! Lowest scorers eliminated.`,
        gameFinished: false,
        eliminated
      });
    }
  };

  const resetGame = () => {
    setGamePhase('setup');
    setCurrentPlayerIndex(0);
    setPlayerScores([]);
    setScore(0);
    setGameTime(60);
    setPlayerPosition({ x: 250, y: 450 });
    setEnemies([]);
    setBullets([]);
    setKeysPressed(new Set());
    onReset();
  };

  if (activeParticipants.length === 0) {
    return (
      <div className="spaceshooter-container">
        <div className="empty-state">
          <div className="empty-icon">🚀</div>
          <h2>No Active Participants</h2>
          <p>Add some participants to start the space battle!</p>
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
    <div className="spaceshooter-container">
      <div className="spaceshooter-header">
        <h2>🚀 Space Shooter</h2>
        <p>Control your spaceship and shoot down enemies!</p>
        <div className="game-info">
          Use WASD or Arrow Keys to move • SPACE to shoot • 60 seconds per player
        </div>
      </div>

      {gamePhase === 'setup' && (
        <div className="setup-section">
          <div className="game-instructions">
            <h3>🎮 How to Play</h3>
            <div className="instructions-grid">
              <div className="instruction-item">
                <div className="instruction-icon">⌨️</div>
                <div>Use WASD or Arrow Keys to move your spaceship</div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">🔫</div>
                <div>Press SPACE to shoot bullets at enemies</div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">🎯</div>
                <div>Each enemy destroyed gives you 10 points</div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">⏱️</div>
                <div>You have 60 seconds to get the highest score</div>
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
                    <div className="player-score">
                      {playerScores.find(ps => ps.participant.id === participant.id)?.score || 0} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {currentPlayerIndex === 0 && playerScores.every(ps => ps.score === 0) ? (
            <button className="start-game-btn" onClick={startGame}>
              🚀 Start Space Battle
            </button>
          ) : (
            <div className="next-player-info">
              <h3>🎯 Next Up: {activeParticipants[currentPlayerIndex]?.name}</h3>
              <p>Get ready to pilot your spaceship!</p>
              <button 
                className="start-turn-btn" 
                onClick={() => startPlayerTurn(currentPlayerIndex)}
              >
                🛸 Start Turn
              </button>
            </div>
          )}
        </div>
      )}

      {gamePhase === 'playing' && (
        <div className="game-section">
          <div className="game-ui">
            <div className="player-info">
              <strong>🚀 {activeParticipants[currentPlayerIndex]?.name}</strong>
            </div>
            <div className="score-display">Score: {score}</div>
            <div className="timer-display">Time: {gameTime}s</div>
          </div>
          
          <div className="game-area" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
            {/* Player */}
            <div 
              className="player"
              style={{
                left: playerPosition.x,
                top: playerPosition.y
              }}
            >
              🚀
            </div>
            
            {/* Enemies */}
            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className="enemy"
                style={{
                  left: enemy.x,
                  top: enemy.y
                }}
              >
                👾
              </div>
            ))}
            
            {/* Bullets */}
            {bullets.map(bullet => (
              <div
                key={bullet.id}
                className="bullet"
                style={{
                  left: bullet.x,
                  top: bullet.y
                }}
              >
                •
              </div>
            ))}
          </div>
          
          <div className="controls-help">
            <span>WASD/Arrows: Move</span>
            <span>SPACE: Shoot</span>
          </div>
        </div>
      )}

      {gamePhase === 'gameOver' && (
        <div className="results-section">
          <div className="results-header">
            <h3>🎉 Space Battle Complete!</h3>
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
                  <div className="final-score">{ps.score} points</div>
                  {index === 0 && <div className="winner-crown">👑</div>}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="spaceshooter-controls">
        <button className="reset-btn" onClick={resetGame}>
          🔄 Reset Game
        </button>
        <button className="select-game-btn" onClick={() => {
          console.log('Select Another Game clicked in SpaceShooter');
          onBackToMenu();
        }}>
          🎮 Select Another Game
        </button>
        <button className="back-btn" onClick={() => {
          console.log('Back to Menu clicked in SpaceShooter');
          onBackToMenu();
        }}>
          🏠 Back to Menu
        </button>
      </div>
    </div>
  );
};

export default SpaceShooter;
