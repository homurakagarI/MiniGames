import type { Participant, GameMode } from '../types'
import './DrawABall.css'

interface DrawABallProps {
  mode: GameMode
  participants: Participant[]
  onGameComplete?: (result: { participant: Participant; mode: GameMode }) => void
  onBack?: () => void
}

const DrawABall = ({ mode, participants, onGameComplete, onBack }: DrawABallProps) => {
  // Temporary implementation - will be updated with participant functionality
  return (
    <div className="draw-ball-container">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          ← Back to Setup
        </button>
      )}
      <h2>🎱 Draw a Ball - Coming Soon with Participants!</h2>
      <p>Mode: {mode}</p>
      <p>Participants: {participants.map(p => p.name).join(', ')}</p>
      <button onClick={() => onGameComplete?.({ participant: participants[0], mode })}>
        Test Complete
      </button>
    </div>
  )
}

export default DrawABall
