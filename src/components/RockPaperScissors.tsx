import React, { useState } from 'react';
import type { Participant, GameMode, GameResult } from '../types';
import './RockPaperScissors.css';

interface RockPaperScissorsProps {
  participants: Participant[];
  mode: GameMode;
  onResult: (result: GameResult) => void;
  onReset: () => void;
  onBackToMenu: () => void;
}

type Choice = 'rock' | 'paper' | 'scissors';

interface Match {
  id: string;
  player1: Participant;
  player2: Participant;
  player1Choice?: Choice;
  player2Choice?: Choice;
  winner?: Participant;
  completed: boolean;
}

interface Tournament {
  rounds: Match[][];
  currentRound: number;
  winner?: Participant;
}

const RockPaperScissors: React.FC<RockPaperScissorsProps> = ({
  participants,
  mode,
  onResult,
  onReset,
  onBackToMenu
}) => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [isAnimating, setIsAnimating] = useState(false);

  const activeParticipants = participants.filter(p => !p.isEliminated);

  const getChoiceEmoji = (choice: Choice): string => {
    switch (choice) {
      case 'rock': return '🪨';
      case 'paper': return '📄';
      case 'scissors': return '✂️';
    }
  };

  const determineWinner = (choice1: Choice, choice2: Choice): 'player1' | 'player2' | 'tie' => {
    if (choice1 === choice2) return 'tie';
    
    if (
      (choice1 === 'rock' && choice2 === 'scissors') ||
      (choice1 === 'paper' && choice2 === 'rock') ||
      (choice1 === 'scissors' && choice2 === 'paper')
    ) {
      return 'player1';
    }
    
    return 'player2';
  };

  const createTournament = (players: Participant[]): Tournament => {
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const firstRound: Match[] = [];
    
    // Create pairs for first round
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      if (i + 1 < shuffledPlayers.length) {
        firstRound.push({
          id: `match-${i}-${i+1}`,
          player1: shuffledPlayers[i],
          player2: shuffledPlayers[i + 1],
          completed: false
        });
      } else {
        // Odd number of players - this player gets a bye
        firstRound.push({
          id: `bye-${i}`,
          player1: shuffledPlayers[i],
          player2: shuffledPlayers[i], // Self-match indicates bye
          winner: shuffledPlayers[i],
          completed: true
        });
      }
    }
    
    return {
      rounds: [firstRound],
      currentRound: 0
    };
  };

  const startTournament = () => {
    if (activeParticipants.length < 2) return;
    
    const newTournament = createTournament(activeParticipants);
    setTournament(newTournament);
    setGamePhase('playing');
    
    // Start first match
    const firstMatch = newTournament.rounds[0].find(m => !m.completed);
    if (firstMatch) {
      setCurrentMatch(firstMatch);
    }
  };

  const makeChoice = async (player: 'player1' | 'player2', choice: Choice) => {
    if (!currentMatch || !tournament) return;
    
    const updatedMatch = { ...currentMatch };
    
    if (player === 'player1') {
      updatedMatch.player1Choice = choice;
    } else {
      updatedMatch.player2Choice = choice;
    }
    
    setCurrentMatch(updatedMatch);
    
    // Check if both players have made choices
    if (updatedMatch.player1Choice && updatedMatch.player2Choice) {
      setIsAnimating(true);
      
      // Add animation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = determineWinner(updatedMatch.player1Choice, updatedMatch.player2Choice);
      
      if (result === 'tie') {
        // Reset choices for rematch
        updatedMatch.player1Choice = undefined;
        updatedMatch.player2Choice = undefined;
        setCurrentMatch(updatedMatch);
        setIsAnimating(false);
        return;
      }
      
      // Determine winner
      updatedMatch.winner = result === 'player1' ? updatedMatch.player1 : updatedMatch.player2;
      updatedMatch.completed = true;
      
      // Update tournament
      const updatedTournament = { ...tournament };
      const currentRoundIndex = updatedTournament.currentRound;
      const matchIndex = updatedTournament.rounds[currentRoundIndex].findIndex(m => m.id === updatedMatch.id);
      updatedTournament.rounds[currentRoundIndex][matchIndex] = updatedMatch;
      
      setTournament(updatedTournament);
      setIsAnimating(false);
      
      // Check if round is complete
      const currentRound = updatedTournament.rounds[currentRoundIndex];
      const allMatchesComplete = currentRound.every(m => m.completed);
      
      if (allMatchesComplete) {
        const roundWinners = currentRound.map(m => m.winner!);
        
        if (roundWinners.length === 1) {
          // Tournament complete
          updatedTournament.winner = roundWinners[0];
          setTournament(updatedTournament);
          setGamePhase('result');
          setCurrentMatch(null);
          
          if (mode === 'winner-picker') {
            onResult({
              winner: roundWinners[0],
              message: `🏆 Tournament Winner! Defeated all opponents!`,
              gameFinished: true,
              eliminated: []
            });
          } else {
            // In elimination mode, eliminate all except winner
            const eliminated = activeParticipants.filter(p => p.id !== roundWinners[0].id);
            onResult({
              winner: null,
              message: `🏆 ${roundWinners[0].name} wins the tournament! Others eliminated.`,
              gameFinished: false,
              eliminated
            });
          }
        } else {
          // Create next round
          const nextRound: Match[] = [];
          for (let i = 0; i < roundWinners.length; i += 2) {
            if (i + 1 < roundWinners.length) {
              nextRound.push({
                id: `round${currentRoundIndex + 1}-match-${i}-${i+1}`,
                player1: roundWinners[i],
                player2: roundWinners[i + 1],
                completed: false
              });
            } else {
              // Bye
              nextRound.push({
                id: `round${currentRoundIndex + 1}-bye-${i}`,
                player1: roundWinners[i],
                player2: roundWinners[i],
                winner: roundWinners[i],
                completed: true
              });
            }
          }
          
          updatedTournament.rounds.push(nextRound);
          updatedTournament.currentRound++;
          setTournament(updatedTournament);
          
          // Start next match
          const nextMatch = nextRound.find(m => !m.completed);
          if (nextMatch) {
            setCurrentMatch(nextMatch);
          }
        }
      } else {
        // Find next uncompleted match in current round
        const nextMatch = currentRound.find(m => !m.completed);
        if (nextMatch) {
          setCurrentMatch(nextMatch);
        }
      }
    }
  };

  const reset = () => {
    setTournament(null);
    setCurrentMatch(null);
    setGamePhase('setup');
    setIsAnimating(false);
    onReset();
  };

  if (activeParticipants.length === 0) {
    return (
      <div className="rps-container">
        <div className="empty-state">
          <div className="empty-icon">✂️</div>
          <h2>No Active Participants</h2>
          <p>Add some participants to start the tournament!</p>
          <div className="empty-actions">
            <button className="action-btn primary" onClick={onBackToMenu}>
              🏠 Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeParticipants.length === 1) {
    return (
      <div className="rps-container">
        <div className="empty-state">
          <div className="empty-icon">✂️</div>
          <h2>Need More Players</h2>
          <p>Rock Paper Scissors needs at least 2 participants!</p>
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
    <div className="rps-container">
      <div className="rps-header">
        <h2>✂️ Rock Paper Scissors Tournament</h2>
        <p>
          {mode === 'winner-picker' 
            ? 'Tournament-style elimination to find the ultimate champion!' 
            : 'Battle through rounds to determine who gets eliminated!'}
        </p>
        <div className="participants-count">
          {activeParticipants.length} participants • Tournament style
        </div>
      </div>

      {gamePhase === 'setup' && (
        <div className="setup-section">
          <div className="tournament-preview">
            <h3>🏆 Tournament Bracket Preview</h3>
            <p>Players will face off in elimination rounds until one remains!</p>
            
            <div className="rules-section">
              <h4>📋 Rules</h4>
              <div className="rules-grid">
                <div className="rule-item">
                  <span className="rule-emoji">🪨</span>
                  <span>Rock beats Scissors</span>
                </div>
                <div className="rule-item">
                  <span className="rule-emoji">📄</span>
                  <span>Paper beats Rock</span>
                </div>
                <div className="rule-item">
                  <span className="rule-emoji">✂️</span>
                  <span>Scissors beats Paper</span>
                </div>
                <div className="rule-item">
                  <span className="rule-emoji">🔄</span>
                  <span>Ties require rematch</span>
                </div>
              </div>
            </div>
            
            <div className="participants-preview">
              <h4>👥 Participants</h4>
              <div className="participants-grid">
                {activeParticipants.map(participant => (
                  <div key={participant.id} className="participant-preview">
                    <div className="participant-avatar">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="participant-name">{participant.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button className="start-tournament-btn" onClick={startTournament}>
            🚀 Start Tournament
          </button>
        </div>
      )}

      {gamePhase === 'playing' && tournament && (
        <div className="tournament-section">
          <div className="tournament-status">
            <h3>
              Round {tournament.currentRound + 1} 
              {tournament.rounds[tournament.currentRound] && 
                ` • Match ${tournament.rounds[tournament.currentRound].filter(m => m.completed).length + 1}/${tournament.rounds[tournament.currentRound].length}`
              }
            </h3>
          </div>

          {currentMatch && currentMatch.player1.id !== currentMatch.player2.id && (
            <div className="current-match">
              <div className="match-header">
                <h4>⚔️ Current Battle</h4>
                {currentMatch.player1Choice && currentMatch.player2Choice && (
                  <p>Revealing choices...</p>
                )}
              </div>
              
              <div className="battle-arena">
                <div className="player-section">
                  <div className="player-info">
                    <div className="player-avatar">
                      {currentMatch.player1.name.charAt(0).toUpperCase()}
                    </div>
                    <h4>{currentMatch.player1.name}</h4>
                  </div>
                  
                  <div className="choice-display">
                    {currentMatch.player1Choice ? (
                      // Show hidden choice until both players have chosen
                      currentMatch.player1Choice && currentMatch.player2Choice ? (
                        <div className={`choice-revealed ${isAnimating ? 'animating' : ''}`}>
                          {getChoiceEmoji(currentMatch.player1Choice)}
                        </div>
                      ) : (
                        <div className="choice-hidden">
                          <div className="hidden-indicator">✓</div>
                          <span>Choice Made</span>
                        </div>
                      )
                    ) : (
                      <div className="choice-buttons">
                        <button 
                          className="choice-btn rock"
                          onClick={() => makeChoice('player1', 'rock')}
                        >
                          🪨 Rock
                        </button>
                        <button 
                          className="choice-btn paper"
                          onClick={() => makeChoice('player1', 'paper')}
                        >
                          📄 Paper
                        </button>
                        <button 
                          className="choice-btn scissors"
                          onClick={() => makeChoice('player1', 'scissors')}
                        >
                          ✂️ Scissors
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="vs-section">
                  <div className="vs-text">VS</div>
                  {isAnimating && (
                    <div className="battle-animation">⚡</div>
                  )}
                  {!isAnimating && (currentMatch.player1Choice || currentMatch.player2Choice) && 
                   !(currentMatch.player1Choice && currentMatch.player2Choice) && (
                    <div className="waiting-status">
                      <div className="waiting-dots">⏳</div>
                      <span>Waiting for choices...</span>
                    </div>
                  )}
                </div>

                <div className="player-section">
                  <div className="player-info">
                    <div className="player-avatar">
                      {currentMatch.player2.name.charAt(0).toUpperCase()}
                    </div>
                    <h4>{currentMatch.player2.name}</h4>
                  </div>
                  
                  <div className="choice-display">
                    {currentMatch.player2Choice ? (
                      // Show hidden choice until both players have chosen
                      currentMatch.player1Choice && currentMatch.player2Choice ? (
                        <div className={`choice-revealed ${isAnimating ? 'animating' : ''}`}>
                          {getChoiceEmoji(currentMatch.player2Choice)}
                        </div>
                      ) : (
                        <div className="choice-hidden">
                          <div className="hidden-indicator">✓</div>
                          <span>Choice Made</span>
                        </div>
                      )
                    ) : (
                      <div className="choice-buttons">
                        <button 
                          className="choice-btn rock"
                          onClick={() => makeChoice('player2', 'rock')}
                        >
                          🪨 Rock
                        </button>
                        <button 
                          className="choice-btn paper"
                          onClick={() => makeChoice('player2', 'paper')}
                        >
                          📄 Paper
                        </button>
                        <button 
                          className="choice-btn scissors"
                          onClick={() => makeChoice('player2', 'scissors')}
                        >
                          ✂️ Scissors
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {currentMatch.winner && (
                <div className="match-result">
                  <h3>🏆 {currentMatch.winner.name} wins this round!</h3>
                  <p>
                    {getChoiceEmoji(currentMatch.player1Choice!)} vs {getChoiceEmoji(currentMatch.player2Choice!)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tournament Bracket Display */}
          <div className="tournament-bracket">
            <h4>🏆 Tournament Progress</h4>
            {tournament.rounds.map((round, roundIndex) => (
              <div key={roundIndex} className="round-display">
                <h5>Round {roundIndex + 1}</h5>
                <div className="matches-display">
                  {round.map(match => (
                    <div 
                      key={match.id} 
                      className={`match-display ${match.completed ? 'completed' : 'pending'} ${match === currentMatch ? 'current' : ''}`}
                    >
                      {match.player1.id === match.player2.id ? (
                        <div className="bye-match">
                          <span>{match.player1.name}</span>
                          <span className="bye-text">(Bye)</span>
                        </div>
                      ) : (
                        <>
                          <span className={match.winner?.id === match.player1.id ? 'winner' : ''}>
                            {match.player1.name}
                          </span>
                          <span className="vs">vs</span>
                          <span className={match.winner?.id === match.player2.id ? 'winner' : ''}>
                            {match.player2.name}
                          </span>
                          {match.winner && (
                            <div className="match-winner">
                              🏆 {match.winner.name}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gamePhase === 'result' && tournament?.winner && (
        <div className="tournament-result">
          <div className="winner-announcement">
            <div className="winner-icon">🏆</div>
            <h3>Tournament Champion!</h3>
            <h2>{tournament.winner.name}</h2>
            <p>Defeated all opponents to claim victory!</p>
          </div>
        </div>
      )}

      <div className="rps-controls">
        <button className="reset-btn" onClick={reset}>
          🔄 Reset Tournament
        </button>
        <button className="select-game-btn" onClick={() => {
          console.log('Select Another Game clicked in RockPaperScissors');
          onBackToMenu();
        }}>
          🎮 Select Another Game
        </button>
        <button className="back-btn" onClick={() => {
          console.log('Back to Menu clicked in RockPaperScissors');
          onBackToMenu();
        }}>
          🏠 Back to Menu
        </button>
      </div>
    </div>
  );
};

export default RockPaperScissors;
