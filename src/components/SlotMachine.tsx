import { useState, useEffect } from 'react'
import type { Participant, GameMode, GameResult } from '../types'
import './SlotMachine.css'

interface SlotMachineProps {
  participants: Participant[]
  mode: GameMode
  onResult: (result: GameResult) => void
  onReset: () => void
  onBackToMenu: () => void
}

const SlotMachine = ({ participants, mode, onResult, onReset, onBackToMenu }: SlotMachineProps) => {
  const [isSpinning, setIsSpinning] = useState(false)
  const [reels, setReels] = useState(['🍒', '🍒', '🍒'])
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [activeParticipants, setActiveParticipants] = useState<Participant[]>(
    participants.filter(p => !p.isEliminated)
  )
  const [eliminatedParticipants, setEliminatedParticipants] = useState<Participant[]>([])

  const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎', '7️⃣']

  useEffect(() => {
    setActiveParticipants(participants.filter(p => !p.isEliminated))
  }, [participants])

  const getRandomSymbol = () => symbols[Math.floor(Math.random() * symbols.length)]
  
  const getRandomParticipant = () => {
    if (activeParticipants.length === 0) return null
    return activeParticipants[Math.floor(Math.random() * activeParticipants.length)]
  }

  const spin = () => {
    if (isSpinning || activeParticipants.length === 0) return

    setIsSpinning(true)
    setSelectedParticipant(null)

    // Animate each reel separately
    const newReels = ['', '', '']
    let reelsCompleted = 0

    // Spin each reel with different timing
    const delays = [1000, 1500, 2000]
    delays.forEach((delay: number, index: number) => {
      const interval = setInterval(() => {
        setReels(prev => {
          const updated = [...prev]
          updated[index] = getRandomSymbol()
          return updated
        })
      }, 100)

      setTimeout(() => {
        clearInterval(interval)
        newReels[index] = getRandomSymbol()
        setReels(prev => {
          const updated = [...prev]
          updated[index] = newReels[index]
          return updated
        })
        
        reelsCompleted++
        if (reelsCompleted === 3) {
          setIsSpinning(false)
          handleSpinResult(newReels)
        }
      }, delay)
    })
  }

  const handleSpinResult = (finalReels: string[]) => {
    const selected = getRandomParticipant()
    if (!selected) return

    setSelectedParticipant(selected)

    // Check for win condition (determines if participant is eliminated or wins)
    const isWin = checkWin(finalReels)
    
    if (mode === 'elimination') {
      if (!isWin) {
        // Participant is eliminated on a loss
        const newEliminated = [...eliminatedParticipants, selected]
        const newActive = activeParticipants.filter(p => p.id !== selected.id)
        
        setEliminatedParticipants(newEliminated)
        setActiveParticipants(newActive)

        // Check if game is complete (only 1 participant left)
        if (newActive.length === 1) {
          setTimeout(() => {
            onResult({
              winner: newActive[0],
              eliminated: [],
              message: `🎉 ${newActive[0].name} is the last one standing and wins!`,
              gameFinished: true
            })
          }, 2000)
        }
      }
      // If win, participant stays in the game
    } else {
      // Winner picker mode - selected participant wins regardless of slot result
      setTimeout(() => {
        onResult({
          winner: selected,
          eliminated: [],
          message: `🎉 ${selected.name} hit the jackpot and wins!`,
          gameFinished: true
        })
      }, 2000)
    }
  }

  const checkWin = (finalReels: string[]): boolean => {
    // Three of a kind
    if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
      return true
    }
    // Any pair
    if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
      return true
    }
    return false
  }

  const getResultMessage = () => {
    if (!selectedParticipant) return ''
    
    const isWin = checkWin(reels)
    
    if (mode === 'elimination') {
      return isWin 
        ? `🎉 ${selectedParticipant.name} survives this round!`
        : `❌ ${selectedParticipant.name} is eliminated!`
    } else {
      return `🏆 ${selectedParticipant.name} is selected!`
    }
  }

  const resetGame = () => {
    setActiveParticipants(participants.filter(p => !p.isEliminated))
    setEliminatedParticipants([])
    setSelectedParticipant(null)
    setReels(['🍒', '🍒', '🍒'])
    onReset()
  }

  if (activeParticipants.length === 0) {
    return (
      <div className="slot-machine-container">
        <div className="no-participants">
          <h2>No participants available!</h2>
          <button onClick={onBackToMenu} className="back-button">
            ⬅️ Back to Setup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="slot-machine-container">
      <div className="game-header">
        <h2>🎰 Slot Machine</h2>
        <div className="game-info">
          <span className="mode-badge">
            {mode === 'winner-picker' ? '🏆 Winner Picker' : '⚔️ Elimination'}
          </span>
          <span className="participants-count">
            {activeParticipants.length} participants remaining
          </span>
        </div>
      </div>
      
      <div className="slot-machine">
        <div className="slot-header">
          <div className="lights">
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
            <div className="light"></div>
          </div>
        </div>
        
        <div className="reels-container">
          {reels.map((symbol, index) => (
            <div key={index} className={`reel ${isSpinning ? 'spinning' : ''}`}>
              <div className="symbol">{symbol}</div>
            </div>
          ))}
        </div>
        
        <div className="participants-display">
          <h4>Active Participants:</h4>
          <div className="participant-chips">
            {activeParticipants.map((participant) => (
              <span 
                key={participant.id} 
                className={`participant-chip ${selectedParticipant?.id === participant.id ? 'selected' : ''}`}
              >
                {participant.name}
              </span>
            ))}
          </div>
        </div>
        
        <button 
          className={`pull-lever ${isSpinning || activeParticipants.length === 0 ? 'disabled' : ''}`}
          onClick={spin}
          disabled={isSpinning || activeParticipants.length === 0}
        >
          {isSpinning ? 'SPINNING...' : 'PULL LEVER!'}
        </button>
      </div>

      {selectedParticipant && (
        <div className="result-display">
          <h3>{getResultMessage()}</h3>
          {mode === 'elimination' && activeParticipants.length > 1 && (
            <p>Continue spinning to eliminate more participants!</p>
          )}
          {mode === 'elimination' && activeParticipants.length === 1 && (
            <p>🎉 {activeParticipants[0].name} is the final winner! 🎉</p>
          )}
        </div>
      )}

      {eliminatedParticipants.length > 0 && mode === 'elimination' && (
        <div className="eliminated-section">
          <h4>❌ Eliminated Participants:</h4>
          <div className="eliminated-list">
            {eliminatedParticipants.map((participant, index) => (
              <span key={participant.id} className="eliminated-participant">
                {index + 1}. {participant.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="controls">
        {mode === 'elimination' && activeParticipants.length > 1 && (
          <button onClick={resetGame} className="reset-button">
            🔄 Reset Game
          </button>
        )}
        <button onClick={() => {
          console.log('Select Another Game clicked in SlotMachine');
          onBackToMenu();
        }} className="select-game-button">
          🎮 Select Another Game
        </button>
        <button onClick={() => {
          console.log('Back to Setup clicked in SlotMachine');
          onBackToMenu();
        }} className="back-button">
          ⬅️ Back to Setup
        </button>
      </div>
    </div>
  )
}

export default SlotMachine
