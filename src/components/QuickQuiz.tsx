import React, { useState, useEffect } from 'react';
import type { Participant, GameMode, GameResult } from '../types';
import './QuickQuiz.css';

interface QuickQuizProps {
  participants: Participant[];
  mode: GameMode;
  onResult: (result: GameResult) => void;
  onReset: () => void;
  onBackToMenu: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

interface ParticipantScore {
  participant: Participant;
  score: number;
  currentAnswer?: number;
  timeRemaining: number;
}

const QuickQuiz: React.FC<QuickQuizProps> = ({
  participants,
  mode,
  onResult,
  onReset,
  onBackToMenu
}) => {
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'question' | 'results'>('setup');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [participantScores, setParticipantScores] = useState<ParticipantScore[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [showAnswer, setShowAnswer] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2,
      category: "Geography"
    },
    {
      id: 2,
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1,
      category: "Science"
    },
    {
      id: 3,
      question: "Who painted the Mona Lisa?",
      options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
      correctAnswer: 2,
      category: "Art"
    },
    {
      id: 4,
      question: "What is 2 + 2 × 3?",
      options: ["8", "12", "10", "6"],
      correctAnswer: 0,
      category: "Math"
    },
    {
      id: 5,
      question: "Which ocean is the largest?",
      options: ["Atlantic", "Indian", "Arctic", "Pacific"],
      correctAnswer: 3,
      category: "Geography"
    },
    {
      id: 6,
      question: "What year did World War II end?",
      options: ["1944", "1945", "1946", "1947"],
      correctAnswer: 1,
      category: "History"
    },
    {
      id: 7,
      question: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correctAnswer: 2,
      category: "Science"
    },
    {
      id: 8,
      question: "Which instrument has 88 keys?",
      options: ["Guitar", "Piano", "Violin", "Drums"],
      correctAnswer: 1,
      category: "Music"
    },
    {
      id: 9,
      question: "What is the largest mammal in the world?",
      options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
      correctAnswer: 1,
      category: "Nature"
    },
    {
      id: 10,
      question: "In which year was the first iPhone released?",
      options: ["2006", "2007", "2008", "2009"],
      correctAnswer: 1,
      category: "Technology"
    }
  ];

  const activeParticipants = participants.filter(p => !p.isEliminated);

  useEffect(() => {
    if (gamePhase === 'playing') {
      setParticipantScores(
        activeParticipants.map(participant => ({
          participant,
          score: 0,
          timeRemaining: 10
        }))
      );
    }
  }, [gamePhase, activeParticipants]);

  useEffect(() => {
    let timer: number;
    
    if (gamePhase === 'question' && timeRemaining > 0 && !showAnswer) {
      timer = window.setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && !showAnswer) {
      handleTimeUp();
    }
    
    return () => clearTimeout(timer);
  }, [timeRemaining, gamePhase, showAnswer]);

  const startQuiz = () => {
    setGamePhase('playing');
    setCurrentQuestionIndex(0);
    startQuestion();
  };

  const startQuestion = () => {
    setGamePhase('question');
    setTimeRemaining(10);
    setShowAnswer(false);
    setParticipantScores(prev => 
      prev.map(ps => ({ ...ps, currentAnswer: undefined }))
    );
  };

  const handleAnswer = (participantId: string, answerIndex: number) => {
    setParticipantScores(prev => 
      prev.map(ps => 
        ps.participant.id === participantId 
          ? { ...ps, currentAnswer: answerIndex }
          : ps
      )
    );
  };

  const handleTimeUp = () => {
    setShowAnswer(true);
    
    // Calculate scores
    const currentQuestion = questions[currentQuestionIndex];
    setParticipantScores(prev => 
      prev.map(ps => ({
        ...ps,
        score: ps.currentAnswer === currentQuestion.correctAnswer 
          ? ps.score + 1 
          : ps.score
      }))
    );

    // Show answer for 3 seconds then move to next question
    window.setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        startQuestion();
      } else {
        finishQuiz();
      }
    }, 3000);
  };

  const finishQuiz = () => {
    setGamePhase('results');

    // Sort participants by score
    const sortedScores = [...participantScores].sort((a, b) => b.score - a.score);
    const winner = sortedScores[0];

    if (mode === 'winner-picker') {
      onResult({
        winner: winner.participant,
        message: `🏆 Quiz Champion with ${winner.score}/${questions.length} correct answers!`,
        gameFinished: true,
        eliminated: []
      });
    } else {
      // Elimination mode - eliminate lowest scorers
      const lowestScore = sortedScores[sortedScores.length - 1].score;
      const eliminated = sortedScores
        .filter(ps => ps.score === lowestScore)
        .map(ps => ps.participant);
      
      onResult({
        winner: null,
        message: `Quiz round complete! Lowest scorers eliminated.`,
        gameFinished: false,
        eliminated
      });
    }
  };

  const resetQuiz = () => {
    setGamePhase('setup');
    setCurrentQuestionIndex(0);
    setParticipantScores([]);
    setTimeRemaining(10);
    setShowAnswer(false);
    onReset();
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (activeParticipants.length === 0) {
    return (
      <div className="quiz-container">
        <div className="empty-state">
          <div className="empty-icon">🧠</div>
          <h2>No Active Participants</h2>
          <p>Add some participants to start the quiz!</p>
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
    <div className="quiz-container">
      <div className="quiz-header">
        <h2>🧠 Quick Quiz Challenge</h2>
        <p>Answer questions quickly - you have 10 seconds each!</p>
        <div className="quiz-progress">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      {gamePhase === 'setup' && (
        <div className="setup-section">
          <div className="quiz-info">
            <h3>📋 Quiz Rules</h3>
            <div className="rules-list">
              <div className="rule-item">⏱️ 10 seconds per question</div>
              <div className="rule-item">📝 {questions.length} questions total</div>
              <div className="rule-item">🎯 Multiple choice answers</div>
              <div className="rule-item">🏆 Highest score wins</div>
            </div>
            
            <div className="participants-preview">
              <h4>👥 Participants ({activeParticipants.length})</h4>
              <div className="participants-grid">
                {activeParticipants.map(participant => (
                  <div key={participant.id} className="participant-card">
                    <div className="participant-avatar">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{participant.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button className="start-quiz-btn" onClick={startQuiz}>
            🚀 Start Quiz
          </button>
        </div>
      )}

      {gamePhase === 'question' && currentQuestion && (
        <div className="question-section">
          <div className="question-header">
            <div className="timer-display">
              <div className={`timer-circle ${timeRemaining <= 3 ? 'urgent' : ''}`}>
                {timeRemaining}
              </div>
              <span>seconds left</span>
            </div>
            <div className="category-badge">{currentQuestion.category}</div>
          </div>

          <div className="question-display">
            <h3>{currentQuestion.question}</h3>
          </div>

          <div className="answers-grid">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`answer-btn ${showAnswer ? 
                  (index === currentQuestion.correctAnswer ? 'correct' : 'wrong') : ''
                }`}
                onClick={() => handleAnswer('player', index)}
                disabled={showAnswer}
              >
                <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                <span className="answer-text">{option}</span>
              </button>
            ))}
          </div>

          {showAnswer && (
            <div className="answer-reveal">
              <h4>✅ Correct Answer: {currentQuestion.options[currentQuestion.correctAnswer]}</h4>
              <p>Moving to next question...</p>
            </div>
          )}

          <div className="scores-display">
            {participantScores.map(ps => (
              <div key={ps.participant.id} className="score-item">
                <span>{ps.participant.name}</span>
                <span className="score">{ps.score}/{currentQuestionIndex + (showAnswer ? 1 : 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gamePhase === 'results' && (
        <div className="results-section">
          <div className="results-header">
            <h3>🎉 Quiz Complete!</h3>
          </div>
          
          <div className="final-scores">
            {participantScores
              .sort((a, b) => b.score - a.score)
              .map((ps, index) => (
                <div key={ps.participant.id} className={`score-card ${index === 0 ? 'winner' : ''}`}>
                  <div className="rank">{index + 1}</div>
                  <div className="participant-info">
                    <div className="participant-avatar">
                      {ps.participant.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{ps.participant.name}</span>
                  </div>
                  <div className="final-score">
                    {ps.score}/{questions.length}
                    <span className="percentage">
                      ({Math.round((ps.score / questions.length) * 100)}%)
                    </span>
                  </div>
                  {index === 0 && <div className="winner-crown">👑</div>}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="quiz-controls">
        <button className="reset-btn" onClick={resetQuiz}>
          🔄 Reset Quiz
        </button>
        <button className="select-game-btn" onClick={() => {
          console.log('Select Another Game clicked in QuickQuiz');
          onBackToMenu();
        }}>
          🎮 Select Another Game
        </button>
        <button className="back-btn" onClick={() => {
          console.log('Back to Menu clicked in QuickQuiz');
          onBackToMenu();
        }}>
          🏠 Back to Menu
        </button>
      </div>
    </div>
  );
};

export default QuickQuiz;
