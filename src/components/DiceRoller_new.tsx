import React, { useState } from 'react';
import type { Participant, GameMode, GameResult } from '../types';
import './DiceRoller.css';

interface DiceRollerProps {
  participants: Participant[];
  mode: GameMode;
  onResult: (result: GameResult) => void;
  onReset: () => void;
  onBackToMenu: () => void;
}

interface DiceResult {
  participant: Participant;
  roll: number;
  diceAnimation: number[];
}

const DiceRoller: React.FC<DiceRollerProps> = ({
  participants,
 
  onResult,
  onReset,
  onBackToMenu
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [results, setResults] = useState<DiceResult[]>([]);
  const [currentRoller, setCurrentRoller] = useState<number>(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [roundParticipants, setRoundParticipants] = useState<Participant[]>([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [gamePhase, setGamePhase] = useState<'ready' | 'rolling' | 'result'>('ready');

  // Initialize round participants on first load or when participants change
  React.useEffect(() => {
    const active = participants.filter(p => !p.isEliminated);
    if (active.length > 0 && roundParticipants.length === 0) {
      setRoundParticipants(active);
    }
  }, [participants]);

  const activeParticipants = roundParticipants.length > 0 ? roundParticipants : participants.filter(p => !p.isEliminated);

  const rollDice = (): number => {
    return Math.floor(Math.random() * 6) + 1;
  };

  const animateDice = (): Promise<number> => {
    return new Promise((resolve) => {
      let animationCount = 0;
      const maxAnimations = 15;
      
      const interval = setInterval(() => {
        animationCount++;
        if (animationCount >= maxAnimations) {
          clearInterval(interval);
          const finalRoll = rollDice();
          resolve(finalRoll);
        }
      }, 100);
    });
  };

  const determineWinner = (allResults: DiceResult[]) => {
    // Always use elimination style for dice rolling
    const lowestRoll = Math.min(...allResults.map(r => r.roll));
    const eliminated = allResults.filter(r => r.roll === lowestRoll).map(r => r.participant);
    const survivors = allResults.filter(r => r.roll > lowestRoll).map(r => r.participant);
    
    if (survivors.length === 0) {
      // Everyone rolled the same (lowest) number - no one survives
      setGameFinished(true);
      setGamePhase('result');
      onResult({
        winner: null,
        message: `🎲 Everyone rolled ${lowestRoll}! Total elimination - no winner!`,
        gameFinished: true,
        eliminated: activeParticipants
      });
    } else if (survivors.length === 1) {
      // Single survivor - winner!
      setWinner(survivors[0]);
      setGameFinished(true);
      setGamePhase('result');
      onResult({
        winner: survivors[0],
        message: `🎲 ${survivors[0].name} wins the dice tournament after ${roundNumber} rounds!`,
        gameFinished: true,
        eliminated: []
      });
    } else {
      // Multiple survivors - continue to next round
      setGameFinished(false);
      setGamePhase('result');
      onResult({
        winner: null,
        message: `🎲 Round ${roundNumber} complete! Lowest roll: ${lowestRoll}. ${eliminated.map(p => p.name).join(', ')} eliminated! ${survivors.length} players remain.`,
        gameFinished: false,
        eliminated
      });
    }
  };

  const handleRollAll = async () => {
    if (isRolling) return;

    setIsRolling(true);
    setGamePhase('rolling');
    setResults([]);
    setCurrentRoller(0);
    setGameFinished(false);
    setWinner(null);

    const allResults: DiceResult[] = [];

    for (let i = 0; i < activeParticipants.length; i++) {
      const participant = activeParticipants[i];
      setCurrentRoller(i);
      
      // Add delay between rolls for dramatic effect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Animate dice rolling
      const animationFrames: number[] = [];
      for (let j = 0; j < 15; j++) {
        animationFrames.push(rollDice());
      }
      
      const finalRoll = await animateDice();
      
      const newResult: DiceResult = {
        participant,
        roll: finalRoll,
        diceAnimation: animationFrames
      };

      allResults.push(newResult);
      setResults([...allResults]);
    }

    setIsRolling(false);
    determineWinner(allResults);
  };

  const getDiceEmoji = (value: number): string => {
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return diceEmojis[value - 1] || '🎲';
  };

  const reset = () => {
    setResults([]);
    setCurrentRoller(0);
    setGameFinished(false);
    setWinner(null);
    setRoundParticipants(participants.filter(p => !p.isEliminated));
    setRoundNumber(1);
    setGamePhase('ready');
    onReset();
  };

  const nextRound = () => {
    // Get survivors from current results
    const lowestRoll = Math.min(...results.map(r => r.roll));
    const survivors = results.filter(r => r.roll > lowestRoll).map(r => r.participant);
    
    // Set up next round
    setRoundParticipants(survivors);
    setRoundNumber(prev => prev + 1);
    setGamePhase('ready');
    setResults([]);
    setCurrentRoller(0);
  };

  if (activeParticipants.length === 0) {
    return (
      <div className="dice-container">
        <div className="empty-state">
          <div className="empty-icon">🎲</div>
          <h2>No Active Participants</h2>
          <p>Add some participants to start rolling dice!</p>
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
    <div className="dice-container">
      <div className="dice-header">
        <h2>🎲 Dice Roller - Round {roundNumber}</h2>
        <p>Lowest roll gets eliminated! Last player standing wins!</p>
        <div className="participants-count">
          {activeParticipants.length} participants remaining
        </div>
      </div>

      {gamePhase === 'ready' && (
        <div className="roll-controls">
          <button 
            className="roll-all-btn"
            onClick={handleRollAll}
            disabled={isRolling}
          >
            🎲 Roll All Dice
          </button>
        </div>
      )}

      {gamePhase === 'rolling' && (
        <div className="rolling-section">
          <h3>🎲 Rolling dice...</h3>
          <div className="current-roller">
            {currentRoller < activeParticipants.length && (
              <p>Now rolling: <strong>{activeParticipants[currentRoller].name}</strong></p>
            )}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="results-section">
          <h3>Round {roundNumber} Results</h3>
          <div className="dice-results">
            {results.map((result, index) => (
              <div key={result.participant.id} className="dice-result">
                <div className="participant-info">
                  <div className="participant-avatar">
                    {result.participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="participant-name">{result.participant.name}</span>
                </div>
                <div className="dice-display">
                  <div className="dice-emoji">
                    {getDiceEmoji(result.roll)}
                  </div>
                  <div className="dice-value">{result.roll}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gamePhase === 'result' && results.length > 0 && (
        <div className="result-section">
          {(() => {
            const lowestRoll = Math.min(...results.map(r => r.roll));
            const eliminated = results.filter(r => r.roll === lowestRoll);
            const survivors = results.filter(r => r.roll > lowestRoll);
            
            if (survivors.length === 0) {
              // Total elimination
              return (
                <div className="no-winner-section">
                  <div className="no-winner-announcement">
                    <div className="elimination-icon">💀</div>
                    <h3>Total Elimination!</h3>
                    <h2>No Winner!</h2>
                    <p>Everyone rolled {lowestRoll}! No one survives!</p>
                  </div>
                </div>
              );
            } else if (survivors.length === 1) {
              // Single winner
              return (
                <div className="final-winner-section">
                  <div className="winner-announcement">
                    <div className="winner-icon">🏆</div>
                    <h3>Champion!</h3>
                    <h2>{survivors[0].participant.name}</h2>
                    <p>Won the dice tournament after {roundNumber} rounds!</p>
                  </div>
                </div>
              );
            } else {
              // Multiple survivors - show next round button
              return (
                <div className="next-round-section">
                  <h4>🔄 Round {roundNumber} Complete!</h4>
                  <p>Lowest roll: {lowestRoll}</p>
                  <p>{eliminated.map(r => r.participant.name).join(', ')} eliminated!</p>
                  <p>{survivors.length} players advance to Round {roundNumber + 1}</p>
                  <button 
                    className="next-round-btn"
                    onClick={nextRound}
                  >
                    ▶️ Start Round {roundNumber + 1}
                  </button>
                </div>
              );
            }
          })()}
        </div>
      )}

      <div className="dice-controls">
        <button className="reset-btn" onClick={reset}>
          🔄 Reset Tournament
        </button>
        <button className="back-btn" onClick={onBackToMenu}>
          🏠 Back to Menu
        </button>
      </div>
    </div>
  );
};

export default DiceRoller;
