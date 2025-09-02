import { useState } from 'react'
import './App.css'
import type { GameMode, Participant, GameResult } from './types'
import ParticipantManager from './components/ParticipantManager'
import SpinTheWheel from './components/SpinTheWheel'
import SlotMachine from './components/SlotMachine'
import DrawABall from './components/DrawABall_enhanced'
import CardPicker from './components/CardPicker_enhanced'
import DiceRoller from './components/DiceRoller'
import CoinFlip from './components/CoinFlip'
import RockPaperScissors from './components/RockPaperScissors'
import QuickQuiz from './components/QuickQuiz'
import SpaceShooter from './components/SpaceShooter'
import TargetPractice from './components/TargetPractice'

type GameType = 'spin' | 'slot' | 'ball' | 'card' | 'dice' | 'coin' | 'rock' | 'quiz' | 'spaceshooter' | 'targetpractice' | null
type AppState = 'menu' | 'setup' | 'playing' | 'result'

function App() {
  const [appState, setAppState] = useState<AppState>('menu')
  const [currentGame, setCurrentGame] = useState<GameType>(null)
  const [gameMode, setGameMode] = useState<GameMode>('winner-picker')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  const games = [
    { 
      id: 'spin' as const, 
      name: 'Spin the Wheel', 
      emoji: '🎡',
      subtitle: 'Classic wheel of fortune',
      description: 'Spin to select winners or eliminate players'
    },
    { 
      id: 'slot' as const, 
      name: 'Slot Machine', 
      emoji: '🎰',
      subtitle: 'Lucky slot machine',
      description: 'Pull the lever and test your luck'
    },
    { 
      id: 'ball' as const, 
      name: 'Draw a Ball', 
      emoji: '🎱',
      subtitle: 'Lottery-style drawing',
      description: 'Assign participants to numbered balls'
    },
    { 
      id: 'card' as const, 
      name: 'Card Picker', 
      emoji: '🃏',
      subtitle: 'Playing card selection',
      description: 'Assign participants to playing cards'
    },
    { 
      id: 'dice' as const, 
      name: 'Dice Roller', 
      emoji: '🎲',
      subtitle: 'Roll the dice',
      description: 'Tournament-style elimination rounds'
    },
    { 
      id: 'coin' as const, 
      name: 'Coin Flip', 
      emoji: '🪙',
      subtitle: 'Heads or tails',
      description: 'Tournament-style team elimination'
    },
    { 
      id: 'rock' as const, 
      name: 'Rock Paper Scissors', 
      emoji: '✂️',
      subtitle: 'Classic hand game',
      description: 'Tournament-style bracket elimination'
    },
    { 
      id: 'quiz' as const, 
      name: 'Quick Quiz Challenge', 
      emoji: '🧠',
      subtitle: 'Q&A trivia game',
      description: 'Answer questions in 10 seconds each'
    },
    { 
      id: 'spaceshooter' as const, 
      name: 'Space Shooter', 
      emoji: '🚀',
      subtitle: 'Shooting game',
      description: 'Control spaceship and shoot enemies'
    },
    { 
      id: 'targetpractice' as const, 
      name: 'Target Practice', 
      emoji: '🎯',
      subtitle: 'Shooting game',
      description: 'Hit targets to score points'
    }
  ]

  const handleGameSelect = (gameId: GameType) => {
    setCurrentGame(gameId)
    setAppState('setup')
  }

  const handleStartGame = (mode: GameMode, gameParticipants: Participant[]) => {
    setGameMode(mode)
    setParticipants(gameParticipants)
    setAppState('playing')
  }

  const handleGameComplete = (result: GameResult) => {
    setGameResult(result)
    // Only go to result screen if the game is actually finished
    if (result.gameFinished) {
      setAppState('result')
    }
  }

  const handleReset = () => {
    setParticipants(participants.map(p => ({ ...p, isEliminated: false })))
    setGameResult(null)
  }

  const handleBackToMenu = () => {
    console.log('handleBackToMenu called in App.tsx');
    setAppState('menu')
    setCurrentGame(null)
    setGameResult(null)
    setParticipants([])
  }

  const handleBackToSetup = () => {
    setAppState('setup')
    setGameResult(null)
  }

  const handlePlayAgain = () => {
    setAppState('playing')
    setGameResult(null)
  }

  const renderGame = () => {
    switch (currentGame) {
      case 'spin':
        return (
          <SpinTheWheel 
            participants={participants}
            mode={gameMode}
            onResult={handleGameComplete}
            onReset={handleReset}
            onBackToMenu={handleBackToMenu}
          />
        )
      case 'slot':
        return (
          <SlotMachine 
            participants={participants}
            mode={gameMode}
            onResult={handleGameComplete}
            onReset={handleReset}
            onBackToMenu={handleBackToMenu}
          />
        )
      case 'ball':
        return (
          <DrawABall 
            participants={participants}
            mode={gameMode}
            onResult={handleGameComplete}
            onReset={handleReset}
            onBackToMenu={handleBackToMenu}
          />
        )
      case 'card':
        return (
          <CardPicker 
            participants={participants}
            mode={gameMode}
            onResult={handleGameComplete}
            onReset={handleReset}
            onBackToMenu={handleBackToMenu}
          />
        )
      case 'dice':
        return (
          <DiceRoller 
            participants={participants}
            mode={gameMode}
            onResult={handleGameComplete}
            onReset={handleReset}
            onBackToMenu={handleBackToMenu}
          />
        )
      case 'coin':
        return (
          <CoinFlip 
            participants={participants}
            mode={gameMode}
            onResult={handleGameComplete}
            onReset={handleReset}
            onBackToMenu={handleBackToMenu}
          />
        )
      case 'rock':
        return (
          <RockPaperScissors 
            participants={participants}
            mode={gameMode}
            onResult={handleGameComplete}
            onReset={handleReset}
            onBackToMenu={handleBackToMenu}
          />
        )
      case 'quiz':
        return (
          <QuickQuiz 
            participants={participants}
            mode={gameMode}
            onResult={handleGameComplete}
            onReset={handleReset}
            onBackToMenu={handleBackToMenu}
          />
        )
      case 'spaceshooter':
        return (
          <SpaceShooter 
            participants={participants}
            mode={gameMode}
            onResult={handleGameComplete}
            onReset={handleReset}
            onBackToMenu={handleBackToMenu}
          />
        )
      case 'targetpractice':
        return (
          <TargetPractice 
            participants={participants}
            mode={gameMode}
            onResult={handleGameComplete}
            onReset={handleReset}
            onBackToMenu={handleBackToMenu}
          />
        )
      default:
        return null
    }
  }

  const getCurrentGameName = () => {
    return games.find(game => game.id === currentGame)?.name || ''
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 Mini Games Collection 🎮</h1>
        <p>Interactive games perfect for groups, events, and decision-making!</p>
        <div className="app-subtitle">Choose your adventure and let the fun begin</div>
      </header>

      {appState === 'menu' && (
        <>
          <div className="menu-features">
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <span>Multiplayer Support</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span>Winner & Elimination Modes</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎨</span>
              <span>Beautiful Animations</span>
            </div>
          </div>
          
          <div className="game-menu">
            {games.map((game) => (
              <button
                key={game.id}
                className="game-button"
                onClick={() => handleGameSelect(game.id)}
              >
                <span className="game-emoji">{game.emoji}</span>
                <div className="game-details">
                  <span className="game-name">{game.name}</span>
                  <span className="game-subtitle">{game.subtitle}</span>
                  <span className="game-description">{game.description}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="game-stats">
            <p>🌟 10 Amazing Games • 🎊 Unlimited Fun • 🚀 Easy to Play</p>
          </div>
        </>
      )}

      {appState === 'setup' && currentGame && (
        <ParticipantManager
          onStartGame={handleStartGame}
          onBack={handleBackToMenu}
          gameTitle={getCurrentGameName()}
        />
      )}

      {appState === 'playing' && (
        <div className="game-container">
          {renderGame()}
        </div>
      )}

      {appState === 'result' && gameResult && (
        <div className="result-container">
          <div className="final-result">
            <h2>🎉 Game Complete! 🎉</h2>
            <div className="winner-display">
              {gameResult.winner ? (
                <>
                  <div className="winner-icon">🏆</div>
                  <h3>Winner: {gameResult.winner.name}</h3>
                  <p>{gameResult.message}</p>
                </>
              ) : (
                <>
                  <div className="winner-icon">🎯</div>
                  <h3>Game Update</h3>
                  <p>{gameResult.message}</p>
                </>
              )}
            </div>
            
            <div className="result-actions">
              <button className="play-again-btn" onClick={handlePlayAgain}>
                🔄 Play Again
              </button>
              <button className="setup-btn" onClick={handleBackToSetup}>
                ⚙️ Change Settings
              </button>
              <button className="menu-btn" onClick={handleBackToMenu}>
                🏠 Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
