import React, { useState } from 'react';
import type { Participant, GameMode, GameResult } from '../types';
import './CoinFlip.css';

interface CoinFlipProps {
  participants: Participant[];
  mode: GameMode;
  onResult: (result: GameResult) => void;
  onReset: () => void;
  onBackToMenu: () => void;
}

type CoinSide = 'heads' | 'tails';

interface TeamAssignment {
  participant: Participant;
  choice: CoinSide;
}

const CoinFlip: React.FC<CoinFlipProps> = ({
  participants,
 
  onResult,
  onReset,
  onBackToMenu
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<CoinSide | null>(null);
  const [teams, setTeams] = useState<{ heads: Participant[], tails: Participant[] }>({ heads: [], tails: [] });
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [gamePhase, setGamePhase] = useState<'assignment' | 'flipping' | 'result'>('assignment');
  const [flipAnimation, setFlipAnimation] = useState(false);
  const [roundParticipants, setRoundParticipants] = useState<Participant[]>([]);
  const [roundNumber, setRoundNumber] = useState(1);

  // Initialize round participants on first load or when participants change
  React.useEffect(() => {
    const active = participants.filter(p => !p.isEliminated);
    if (active.length > 0 && roundParticipants.length === 0) {
      setRoundParticipants(active);
    }
  }, [participants]);

  const activeParticipants = roundParticipants.length > 0 ? roundParticipants : participants.filter(p => !p.isEliminated);

  const assignToTeam = (participant: Participant, choice: CoinSide) => {
    const newAssignment: TeamAssignment = { participant, choice };
    const updatedAssignments = assignments.filter(a => a.participant.id !== participant.id);
    updatedAssignments.push(newAssignment);
    setAssignments(updatedAssignments);

    // Update teams
    const newTeams = { heads: [] as Participant[], tails: [] as Participant[] };
    updatedAssignments.forEach(assignment => {
      newTeams[assignment.choice].push(assignment.participant);
    });
    setTeams(newTeams);
  };

  const autoAssignTeams = () => {
    const shuffled = [...activeParticipants].sort(() => Math.random() - 0.5);
    const newAssignments: TeamAssignment[] = [];
    
    shuffled.forEach((participant, index) => {
      const choice: CoinSide = index % 2 === 0 ? 'heads' : 'tails';
      newAssignments.push({ participant, choice });
    });

    setAssignments(newAssignments);
    
    const newTeams = { heads: [] as Participant[], tails: [] as Participant[] };
    newAssignments.forEach(assignment => {
      newTeams[assignment.choice].push(assignment.participant);
    });
    setTeams(newTeams);
  };

  const flipCoin = async () => {
    if (isFlipping || assignments.length !== activeParticipants.length) return;

    setIsFlipping(true);
    setGamePhase('flipping');
    setFlipAnimation(true);

    // Animate coin flip
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails';
    setCoinResult(result);
    setFlipAnimation(false);
    setIsFlipping(false);
    setGamePhase('result');

    // Determine who chose the winning side and who chose the losing side
    const winners = teams[result];
    const losers = teams[result === 'heads' ? 'tails' : 'heads'];

    if (winners.length === 0) {
      // No one chose the winning side - everyone is eliminated
      onResult({
        winner: null,
        message: `🪙 ${result.charAt(0).toUpperCase() + result.slice(1)}! But no one chose the winning side - everyone eliminated!`,
        gameFinished: true,
        eliminated: activeParticipants
      });
    } else if (winners.length === 1) {
      // Single winner - game complete
      onResult({
        winner: winners[0],
        message: `🪙 ${result.charAt(0).toUpperCase() + result.slice(1)}! ${winners[0].name} is the last one standing and wins!`,
        gameFinished: true,
        eliminated: []
      });
    } else {
      // Multiple winners - continue elimination, eliminate the losers
      onResult({
        winner: null,
        message: `🪙 ${result.charAt(0).toUpperCase() + result.slice(1)}! ${losers.length > 0 ? losers.map(p => p.name).join(', ') + ' eliminated!' : 'No eliminations this round!'} ${winners.length} players remain.`,
        gameFinished: false,
        eliminated: losers
      });
    }
  };

  const reset = () => {
    setIsFlipping(false);
    setCoinResult(null);
    setTeams({ heads: [], tails: [] });
    setAssignments([]);
    setGamePhase('assignment');
    setFlipAnimation(false);
    setRoundParticipants(participants.filter(p => !p.isEliminated));
    setRoundNumber(1);
    onReset();
  };

  const getCoinEmoji = () => {
    if (flipAnimation) return '🪙';
    if (coinResult === 'heads') return '👑';
    if (coinResult === 'tails') return '🏛️';
    return '🪙';
  };

  if (activeParticipants.length === 0) {
    return (
      <div className="coin-container">
        <div className="empty-state">
          <div className="empty-icon">🪙</div>
          <h2>No Active Participants</h2>
          <p>Add some participants to start flipping coins!</p>
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
    <div className="coin-container">
      <div className="coin-header">
        <h2>🪙 Coin Flip - Round {roundNumber}</h2>
        <p>
          All participants choose heads or tails, then the coin is flipped. 
          Those who chose wrong are eliminated! Continue until only 1 remains or everyone is eliminated.
        </p>
        <div className="participants-count">
          {activeParticipants.length} participants • {assignments.length} assigned
        </div>
      </div>

      {gamePhase === 'assignment' && (
        <>
          <div className="assignment-controls">
            <button 
              className="auto-assign-btn"
              onClick={autoAssignTeams}
            >
              🎲 Auto-Assign Teams
            </button>
            <button 
              className={`flip-btn ${assignments.length !== activeParticipants.length ? 'disabled' : ''}`}
              onClick={flipCoin}
              disabled={assignments.length !== activeParticipants.length}
            >
              🪙 Flip Coin ({assignments.length}/{activeParticipants.length})
            </button>
          </div>

          <div className="team-assignment">
            <div className="team-section">
              <h3>👑 Team Heads ({teams.heads.length})</h3>
              <div className="team-members">
                {teams.heads.map(participant => (
                  <div key={participant.id} className="team-member heads">
                    <div className="member-avatar">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-name">{participant.name}</div>
                    <button 
                      className="remove-btn"
                      onClick={() => {
                        const updated = assignments.filter(a => a.participant.id !== participant.id);
                        setAssignments(updated);
                        const newTeams = { heads: [] as Participant[], tails: [] as Participant[] };
                        updated.forEach(a => newTeams[a.choice].push(a.participant));
                        setTeams(newTeams);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="coin-display-center">
              <div className="coin-visual">
                <div className="coin-side heads">👑</div>
                <div className="coin-side tails">🏛️</div>
              </div>
              <p>Assign participants to teams</p>
            </div>

            <div className="team-section">
              <h3>🏛️ Team Tails ({teams.tails.length})</h3>
              <div className="team-members">
                {teams.tails.map(participant => (
                  <div key={participant.id} className="team-member tails">
                    <div className="member-avatar">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-name">{participant.name}</div>
                    <button 
                      className="remove-btn"
                      onClick={() => {
                        const updated = assignments.filter(a => a.participant.id !== participant.id);
                        setAssignments(updated);
                        const newTeams = { heads: [] as Participant[], tails: [] as Participant[] };
                        updated.forEach(a => newTeams[a.choice].push(a.participant));
                        setTeams(newTeams);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="unassigned-participants">
            <h3>👥 Unassigned Participants</h3>
            <div className="unassigned-list">
              {activeParticipants
                .filter(p => !assignments.some(a => a.participant.id === p.id))
                .map(participant => (
                  <div key={participant.id} className="unassigned-participant">
                    <div className="participant-info">
                      <div className="participant-avatar">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="participant-name">{participant.name}</div>
                    </div>
                    <div className="assignment-buttons">
                      <button 
                        className="assign-btn heads"
                        onClick={() => assignToTeam(participant, 'heads')}
                      >
                        👑 Heads
                      </button>
                      <button 
                        className="assign-btn tails"
                        onClick={() => assignToTeam(participant, 'tails')}
                      >
                        🏛️ Tails
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {gamePhase === 'flipping' && (
        <div className="flip-animation-section">
          <div className="coin-flip-display">
            <div className={`coin-animation ${flipAnimation ? 'flipping' : ''}`}>
              {getCoinEmoji()}
            </div>
            <h3>🪙 Flipping...</h3>
            <p>The coin is in the air!</p>
          </div>
        </div>
      )}

      {gamePhase === 'result' && coinResult && (
        <div className="result-section">
          <div className="coin-result-display">
            <div className="result-coin">
              {getCoinEmoji()}
            </div>
            <h3>Result: {coinResult.charAt(0).toUpperCase() + coinResult.slice(1)}!</h3>
            
            <div className="teams-result">
              <div className={`team-result ${coinResult === 'heads' ? 'winning' : 'losing'}`}>
                <h4>👑 Team Heads {coinResult === 'heads' ? '🏆 SURVIVES' : '� ELIMINATED'}</h4>
                <div className="team-members-result">
                  {teams.heads.map(p => (
                    <div key={p.id} className={`member-result ${coinResult === 'heads' ? 'survivor' : 'eliminated'}`}>
                      {p.name}
                    </div>
                  ))}
                  {teams.heads.length === 0 && (
                    <div className="no-members">No one chose this side</div>
                  )}
                </div>
              </div>
              
              <div className={`team-result ${coinResult === 'tails' ? 'winning' : 'losing'}`}>
                <h4>🏛️ Team Tails {coinResult === 'tails' ? '🏆 SURVIVES' : '� ELIMINATED'}</h4>
                <div className="team-members-result">
                  {teams.tails.map(p => (
                    <div key={p.id} className={`member-result ${coinResult === 'tails' ? 'survivor' : 'eliminated'}`}>
                      {p.name}
                    </div>
                  ))}
                  {teams.tails.length === 0 && (
                    <div className="no-members">No one chose this side</div>
                  )}
                </div>
              </div>
            </div>

            {/* Next Round Controls */}
            {(() => {
              const winners = teams[coinResult];
              const survivorsCount = winners.length;
              
              if (survivorsCount === 0) {
                // No one chose the winning side - everyone eliminated
                return (
                  <div className="no-winner-section">
                    <div className="no-winner-announcement">
                      <div className="elimination-icon">💀</div>
                      <h3>Total Elimination!</h3>
                      <h2>No Winner!</h2>
                      <p>No one chose {coinResult}! Everyone is eliminated!</p>
                    </div>
                  </div>
                );
              } else if (survivorsCount > 1) {
                // Multiple survivors - show next round button
                return (
                  <div className="next-round-section">
                    <h4>🔄 Round {roundNumber} Complete!</h4>
                    <p>{survivorsCount} players advance to Round {roundNumber + 1}</p>
                    <button 
                      className="next-round-btn"
                      onClick={() => {
                        // Advance winners to next round
                        setRoundParticipants(winners);
                        setRoundNumber(prev => prev + 1);
                        setGamePhase('assignment');
                        setCoinResult(null);
                        setAssignments([]);
                        setTeams({ heads: [], tails: [] });
                      }}
                    >
                      ▶️ Start Round {roundNumber + 1}
                    </button>
                  </div>
                );
              } else if (survivorsCount === 1) {
                // Single winner
                return (
                  <div className="final-winner-section">
                    <div className="winner-announcement">
                      <div className="winner-icon">🏆</div>
                      <h3>Champion!</h3>
                      <h2>{winners[0].name}</h2>
                      <p>Won the coin flip tournament after {roundNumber} rounds!</p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}

      <div className="coin-controls">
        <button className="reset-btn" onClick={reset}>
          🔄 Reset
        </button>
        <button className="select-game-btn" onClick={() => {
          console.log('Select Another Game clicked in CoinFlip');
          onBackToMenu();
        }}>
          🎮 Select Another Game
        </button>
        <button className="back-btn" onClick={() => {
          console.log('Back to Menu clicked in CoinFlip');
          onBackToMenu();
        }}>
          🏠 Back
        </button>
      </div>
    </div>
  );
};

export default CoinFlip;
