export interface Game {
  id: string
  name: string
  description: string
  status: 'playable' | 'coming-soon'
}

export const GAMES: Game[] = [
  {
    id: 'space-invaders',
    name: 'Space Invaders',
    description: 'Classic arcade shooter. Defend Earth from descending alien formations.',
    status: 'playable',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Stack falling tetrominoes. Clear lines, score points, survive.',
    status: 'playable',
  },
  {
    id: 'pac-man',
    name: 'Pac-Man',
    description: 'Navigate the maze, eat all dots, avoid the ghosts.',
    status: 'playable',
  },
  {
    id: 'doom',
    name: 'DOOM',
    description: 'Rip and tear. The 1993 shareware classic, running on DOSBox in your browser.',
    status: 'playable',
  },
]
