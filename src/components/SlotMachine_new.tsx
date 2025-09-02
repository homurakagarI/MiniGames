import type { Participant, GameMode } from '../types'
import './SlotMachine.css'

interface SlotMachineProps {
  mode: GameMode
  participants: Participant[]
  onGameComplete?: (result: { participant: Participant; mode: GameMode }) => void
  onBack?: () => void
}

const SlotMachine = ({ mode, participants, onGameComplete, onBack }: SlotMachineProps) => {
  // Temporary implementation - will be updated with participant functionality
  return (
    <div className="slot-machine-container">
      {onBack && (
        <button className="back-button" onClick={onBack}>
          ← Back to Setup
        </button>
      )}
      <h2>🎰 Slot Machine - Coming Soon with Participants!</h2>
      <p>Mode: {mode}</p>
      <p>Participants: {participants.map(p => p.name).join(', ')}</p>
      <button onClick={() => onGameComplete?.({ participant: participants[0], mode })}>
        Test Complete
      </button>
    </div>
  )
}

export default SlotMachine
