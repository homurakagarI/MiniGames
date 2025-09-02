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

interface Ball {
  id: string;
  number: number;
  assignedParticipant?: Participant;
}

interface BallAssignment {
  ballId: string;
  participantId: string;
}

const DrawABall: React.FC<DrawABallProps> = ({ 
  participants, 
  mode, 
  onResult, 
  onReset, 
  onBackToMenu 
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnBall, setDrawnBall] = useState<Ball | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<Participant[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [availableBalls, setAvailableBalls] = useState<Ball[]>([]);
  const [ballAssignments, setBallAssignments] = useState<BallAssignment[]>([]);
  const [showAssignmentView, setShowAssignmentView] = useState(true);
  const [shuffledBalls, setShuffledBalls] = useState<Ball[]>([]);

  // Initialize balls based on number of participants
  useEffect(() => {
    // Only take as many balls as there are participants
    const participantCount = participants.filter(p => !p.isEliminated).length;
    const ballsToUse = Array.from({ length: participantCount }, (_, index) => ({
      id: `ball-${index + 1}`,
      number: index + 1,
      assignedParticipant: undefined
    }));
    
    setAvailableBalls(ballsToUse);
  }, [participants]);

  // Initialize active participants
  useEffect(() => {
    setActiveParticipants(participants.filter(p => !p.isEliminated));
  }, [participants]);

  const activeParticipantsList = activeParticipants.filter(p => !p.isEliminated);
  const assignedBalls = availableBalls.filter(ball => 
    ballAssignments.some(assignment => assignment.ballId === ball.id)
  );

  // Assignment functions
  const assignParticipantToBall = (ballId: string, participantId: string) => {
    // Remove any existing assignment for this participant
    const filteredAssignments = ballAssignments.filter(
      assignment => assignment.participantId !== participantId
    );
    
    // Remove any existing assignment for this ball
    const finalAssignments = filteredAssignments.filter(
      assignment => assignment.ballId !== ballId
    );
    
    // Add new assignment
    setBallAssignments([...finalAssignments, { ballId, participantId }]);
  };

  const removeAssignment = (ballId: string) => {
    setBallAssignments(ballAssignments.filter(assignment => assignment.ballId !== ballId));
  };

  const getBallParticipant = (ballId: string) => {
    const assignment = ballAssignments.find(a => a.ballId === ballId);
    return assignment ? participants.find(p => p.id === assignment.participantId) : null;
  };

  const getParticipantBall = (participantId: string) => {
    const assignment = ballAssignments.find(a => a.participantId === participantId);
    return assignment ? availableBalls.find(b => b.id === assignment.ballId) : null;
  };

  const startGame = () => {
    if (ballAssignments.length !== activeParticipantsList.length) return;
    
    // Create shuffled array of assigned balls
    const assignedBallsArray = ballAssignments.map(assignment => {
      const ball = availableBalls.find(b => b.id === assignment.ballId);
      const participant = participants.find(p => p.id === assignment.participantId);
      return { ...ball!, assignedParticipant: participant };
    });
    
    // Shuffle the balls
    const shuffled = [...assignedBallsArray].sort(() => Math.random() - 0.5);
    setShuffledBalls(shuffled);
    setShowAssignmentView(false);
  };

  const drawBall = () => {
    if (isDrawing || shuffledBalls.length === 0) return;

    setIsDrawing(true);
    setDrawnBall(null);

    // Simulate ball drawing animation
    let animationCount = 0;
    const animationInterval = setInterval(() => {
      const randomBall = shuffledBalls[Math.floor(Math.random() * shuffledBalls.length)];
      setDrawnBall(randomBall);
      animationCount++;

      if (animationCount > 15) {
        clearInterval(animationInterval);
        
        // Final ball selection
        const finalBall = shuffledBalls[Math.floor(Math.random() * shuffledBalls.length)];
        
        setDrawnBall(finalBall);
        
        setTimeout(() => {
          setIsDrawing(false);
          handleResult(finalBall);
        }, 1000);
      }
    }, 100);
  };

  const handleResult = (ball: Ball) => {
    if (!ball.assignedParticipant) return;

    const participant = ball.assignedParticipant;
    
    if (mode === 'winner-picker') {
      setGameFinished(true);
      onResult({
        winner: participant,
        eliminated: [],
        gameFinished: true,
        message: `🎉 ${participant.name} drew ball ${ball.number} and wins!`
      });
    } else if (mode === 'elimination') {
      // Remove the drawn ball from shuffled balls
      const remainingBalls = shuffledBalls.filter(b => b.id !== ball.id);
      setShuffledBalls(remainingBalls);

      if (remainingBalls.length === 1) {
        const winner = remainingBalls[0].assignedParticipant!;
        setGameFinished(true);
        onResult({
          winner: winner,
          eliminated: [participant],
          gameFinished: true,
          message: `🎉 ${winner.name} is the last one standing and wins!`
        });
      } else {
        onResult({
          winner: null,
          eliminated: [participant],
          gameFinished: false,
          message: `${participant.name} drew ball ${ball.number} and was eliminated!`
        });
      }
    }
  };

  const resetAssignments = () => {
    setBallAssignments([]);
  };

  const goBackToAssignment = () => {
    setShowAssignmentView(true);
    setDrawnBall(null);
    setIsDrawing(false);
  };

  if (activeParticipantsList.length === 0 && participants.length > 0) {
    return (
      <div className="draw-ball-container">
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h2>Game Complete!</h2>
          <p>All participants have been processed.</p>
          <div className="empty-actions">
            <button className="action-btn primary" onClick={onReset}>
              <span className="btn-icon">🔄</span>
              New Game
            </button>
            <button className="back-btn" onClick={onBackToMenu}>
              <span className="btn-icon">🏠</span>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assignment View
  if (showAssignmentView) {
    return (
      <div className="draw-ball-container">
        <div className="assignment-header">
          <h2>🎱 Ball Assignment</h2>
          <p>Assign each participant to a numbered ball. There are exactly <strong>{activeParticipantsList.length}</strong> balls available.</p>
          <div className="balls-count">
            {availableBalls.length} balls available for {activeParticipantsList.length} participants
          </div>
        </div>

        <div className="assignment-grid">
          {/* Participants Section */}
          <div className="available-participants">
            <h3>👥 Participants ({activeParticipantsList.length})</h3>
            <div className="participant-list">
              {activeParticipantsList.map(participant => {
                const assignedBall = getParticipantBall(participant.id);
                return (
                  <div key={participant.id} className="participant-card">
                    <div className="participant-avatar">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="participant-name">{participant.name}</div>
                    {assignedBall && (
                      <div className="assigned-to">
                        → Ball #{assignedBall.number}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Balls Section */}
          <div className="available-balls">
            <h3>🎱 Available Balls ({availableBalls.length})</h3>
            <div className="balls-grid">
              {availableBalls.map(ball => {
                const assignedParticipant = getBallParticipant(ball.id);
                const isAssigned = !!assignedParticipant;
                
                return (
                  <div 
                    key={ball.id} 
                    className={`ball-assignment ${isAssigned ? 'assigned' : 'available'}`}
                  >
                    <div className="lottery-ball">
                      <div className="ball-number">{ball.number}</div>
                    </div>
                    <div className="ball-info">
                      <span className="ball-name">Ball #{ball.number}</span>
                      {isAssigned ? (
                        <div className="assignment-info">
                          <span className="assigned-participant">
                            {assignedParticipant.name}
                          </span>
                          <button
                            className="remove-assignment"
                            onClick={() => removeAssignment(ball.id)}
                            title="Remove assignment"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <select
                          className="participant-selector"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              assignParticipantToBall(ball.id, e.target.value);
                            }
                          }}
                        >
                          <option value="">Select participant...</option>
                          {activeParticipantsList
                            .filter(p => !getParticipantBall(p.id))
                            .map(participant => (
                              <option key={participant.id} value={participant.id}>
                                {participant.name}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assignment Summary */}
        <div className="assignment-summary">
          <h4>📊 Assignment Summary</h4>
          <p>{ballAssignments.length} of {activeParticipantsList.length} participants assigned to balls</p>
          {ballAssignments.length < activeParticipantsList.length && (
            <p style={{ color: '#e74c3c', fontSize: '0.9rem' }}>
              Please assign all participants to balls before starting the game
            </p>
          )}
          <div className="assigned-list">
            {assignedBalls.map(ball => {
              const participant = getBallParticipant(ball.id);
              return (
                <div key={ball.id} className="assignment-item">
                  <span className="ball-name">Ball #{ball.number}</span>
                  <span className="arrow">→</span>
                  <span className="participant-name">{participant?.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="assignment-actions">
          <button 
            className={`start-game-btn ${ballAssignments.length !== activeParticipantsList.length ? 'disabled' : ''}`}
            onClick={startGame}
            disabled={ballAssignments.length !== activeParticipantsList.length}
          >
            <span className="btn-icon">🎯</span>
            Start Ball Draw ({ballAssignments.length}/{activeParticipantsList.length} assigned)
          </button>
          <button className="assignment-btn" onClick={resetAssignments}>
            <span className="btn-icon">🔄</span>
            Reset Assignments
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
    <div className="draw-ball-container">
      <div className="game-header">
        <h2>🎱 Draw a Ball</h2>
        <p>Click to draw a ball and see which participant is selected!</p>
      </div>

      <div className="drawing-machine">
        <div className="chamber">
          <div className="chamber-content">
            {isDrawing ? (
              <div className="ball-animation">
                {drawnBall && (
                  <div className="animated-ball">
                    <div className="ball-number">{drawnBall.number}</div>
                  </div>
                )}
              </div>
            ) : drawnBall ? (
              <div className="final-ball">
                <div className="lottery-ball drawn">
                  <div className="ball-number">{drawnBall.number}</div>
                </div>
                <div className="ball-assignment-info">
                  {drawnBall.assignedParticipant?.name}
                </div>
              </div>
            ) : (
              <div className="chamber-placeholder">
                <div className="placeholder-text">Ready to Draw</div>
              </div>
            )}
          </div>
          <div className="chamber-label">
            Balls 1-{availableBalls.length} ({shuffledBalls.length} remaining)
          </div>
        </div>
      </div>

      {drawnBall && !isDrawing && (
        <div className="result-display">
          <h3>🎊 Ball Drawn!</h3>
          <div className="result-info">
            <p>Ball Number: <strong>#{drawnBall.number}</strong></p>
            <p>Selected: <strong>{drawnBall.assignedParticipant?.name}</strong></p>
          </div>
        </div>
      )}

      {/* Remaining Assignments Display */}
      {shuffledBalls.length > 0 && (
        <div className="remaining-assignments">
          <h4>🎱 Remaining Balls ({shuffledBalls.length})</h4>
          <div className="assignment-chips">
            {shuffledBalls.map(ball => (
              <div key={ball.id} className="assignment-chip">
                <div className="ball-info">Ball #{ball.number}</div>
                <div className="participant-info">{ball.assignedParticipant?.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="controls">
        {!gameFinished && shuffledBalls.length > 0 && (
          <button 
            className="draw-button" 
            onClick={drawBall}
            disabled={isDrawing}
          >
            {isDrawing ? 'Drawing...' : 'Draw Ball'}
          </button>
        )}
        
        <button className="assignment-btn" onClick={goBackToAssignment}>
          <span className="btn-icon">⚙️</span>
          Back to Assignment
        </button>
        
        <button className="select-game-button" onClick={() => {
          console.log('Select Another Game clicked in DrawABall_enhanced');
          onBackToMenu();
        }}>
          🎮 Select Another Game
        </button>
        
        <button className="back-button" onClick={() => {
          console.log('Back to Menu clicked in DrawABall_enhanced');
          onBackToMenu();
        }}>
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default DrawABall;
