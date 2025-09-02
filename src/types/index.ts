export interface Participant {
  id: string
  name: string
  isEliminated?: boolean
}

export type GameMode = 'elimination' | 'winner-picker'

export interface GameSettings {
  mode: GameMode
  participants: Participant[]
}

export interface GameResult {
  winner: Participant | null
  eliminated: Participant[]
  message: string
  gameFinished: boolean
}