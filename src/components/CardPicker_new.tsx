import type { Participant, GameMode } from '../types'
import './CardPicker.css'

interface CardPickerProps {
  mode: GameMode
  participants: Participant[]
  onGameComplete?: (result: { participant: Participant; mode: GameMode }) => void
  onBack?: () => void
}

const CardPicker = ({ mode, participants, onGameComplete, onBack }: CardPickerProps) => {
  // Temporary implementation - will be updated with participant functionality
  return (
    <div className="card-picker-container">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          ← Back to Setup
        </button>
      )}
      <h2>🃏 Card Picker - Coming Soon with Participants!</h2>
      <p>Mode: {mode}</p>
      <p>Participants: {participants.map(p => p.name).join(', ')}</p>
      <button onClick={() => onGameComplete?.({ participant: participants[0], mode })}>
        Test Complete
      </button>
    </div>
  )
}

export default CardPicker
