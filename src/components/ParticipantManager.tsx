import { useState } from 'react'
import type { Participant, GameMode } from '../types'
import './ParticipantManager.css'

interface ParticipantManagerProps {
  onStartGame: (mode: GameMode, participants: Participant[]) => void
  onBack: () => void
  gameTitle: string
}

const ParticipantManager = ({ onStartGame, onBack, gameTitle }: ParticipantManagerProps) => {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [newParticipantName, setNewParticipantName] = useState('')
  const [selectedMode, setSelectedMode] = useState<GameMode>('winner-picker')

  const addParticipant = () => {
    if (newParticipantName.trim() && !participants.some(p => p.name.toLowerCase() === newParticipantName.toLowerCase())) {
      const newParticipant: Participant = {
        id: Date.now().toString(),
        name: newParticipantName.trim(),
        isEliminated: false
      }
      setParticipants([...participants, newParticipant])
      setNewParticipantName('')
    }
  }

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addParticipant()
    }
  }

  const handleStartGame = () => {
    if (participants.length >= 2) {
      onStartGame(selectedMode, participants)
    }
  }

  const addQuickParticipants = () => {
    const quickNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank']
    const newParticipants = quickNames
      .filter(name => !participants.some(p => p.name === name))
      .slice(0, 6 - participants.length)
      .map(name => ({
        id: Date.now().toString() + Math.random(),
        name,
        isEliminated: false
      }))
    
    setParticipants([...participants, ...newParticipants])
  }

  return (
    <div className="participant-manager">
      <div className="manager-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Games
        </button>
        <h2>🎮 Setup {gameTitle}</h2>
      </div>

      <div className="setup-container">
        <div className="participants-section">
          <h3>👥 Add Participants</h3>
          
          <div className="add-participant">
            <input
              type="text"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter participant name..."
              maxLength={20}
            />
            <button onClick={addParticipant} disabled={!newParticipantName.trim()}>
              Add
            </button>
          </div>

          <button className="quick-add-btn" onClick={addQuickParticipants}>
            🚀 Add Sample Names
          </button>

          <div className="participants-list">
            {participants.length === 0 ? (
              <p className="empty-list">No participants added yet</p>
            ) : (
              <>
                <h4>Participants ({participants.length}):</h4>
                <div className="participant-cards">
                  {participants.map((participant) => (
                    <div key={participant.id} className="participant-card">
                      <span className="participant-name">{participant.name}</span>
                      <button
                        className="remove-btn"
                        onClick={() => removeParticipant(participant.id)}
                        title="Remove participant"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mode-selection">
          <h3>🎯 Game Mode</h3>
          
          <div className="mode-options">
            <label className={`mode-option ${selectedMode === 'winner-picker' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="winner-picker"
                checked={selectedMode === 'winner-picker'}
                onChange={(e) => setSelectedMode(e.target.value as GameMode)}
              />
              <div className="mode-card">
                <div className="mode-icon">🏆</div>
                <div className="mode-title">Winner Picker</div>
                <div className="mode-description">
                  Randomly select one winner from all participants
                </div>
              </div>
            </label>

            <label className={`mode-option ${selectedMode === 'elimination' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="elimination"
                checked={selectedMode === 'elimination'}
                onChange={(e) => setSelectedMode(e.target.value as GameMode)}
              />
              <div className="mode-card">
                <div className="mode-icon">❌</div>
                <div className="mode-title">Elimination</div>
                <div className="mode-description">
                  Eliminate participants one by one until one remains
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="start-section">
          <button
            className={`start-game-btn ${participants.length < 2 ? 'disabled' : ''}`}
            onClick={handleStartGame}
            disabled={participants.length < 2}
          >
            {participants.length < 2
              ? 'Add at least 2 participants'
              : `Start ${gameTitle} (${selectedMode === 'winner-picker' ? 'Winner Picker' : 'Elimination'})`
            }
          </button>
          
          <button className="back-to-games-btn" onClick={onBack}>
            🎮 Back to Games Menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default ParticipantManager
