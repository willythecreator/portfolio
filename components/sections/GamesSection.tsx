'use client'

import { useEffect, useCallback } from 'react'
import { GAMES } from '@/lib/data/games'
import { useNav } from '@/lib/NavigationProvider'

interface GamesSectionProps {
  onBack: () => void
  onPlayGame: (id: string) => void
}

export default function GamesSection({ onBack, onPlayGame }: GamesSectionProps) {
  const nav = useNav()
  const total = GAMES.length

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); nav.move(-1, 0, 3, total) }
    else if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); nav.move(1, 0, 3, total) }
    else if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); nav.move(0, -1, 3, total) }
    else if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); nav.move(0, 1, 3, total) }
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      const game = GAMES[nav.focused]
      if (game?.status === 'playable') onPlayGame(game.id)
    }
    else if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault()
      onBack()
    }
  }, [nav, total, onPlayGame, onBack])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">╔══ GAMES ══╗</div>
        <div className="section-divider">╚{'═'.repeat(46)}╝</div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--arcbyte-green-dim)', marginBottom: 8 }}>
        ←→↑↓: navigate &middot; SPACE: play &middot; ESC: back
      </div>

      <div className="games-grid">
        {GAMES.map((game, i) => (
          <div
            key={game.id}
            className={`game-card ${nav.focused === i ? 'focused' : ''}`}
            onClick={() => game.status === 'playable' && onPlayGame(game.id)}
            onMouseEnter={() => nav.setFocused(i)}
          >
            <div className="game-card-title">{'> '}{game.name}</div>
            <div className="game-card-desc">{game.description}</div>
            <div className="game-card-status">
              {game.status === 'playable' ? '[ SPACE TO PLAY ]' : '[ COMING SOON ]'}
            </div>
          </div>
        ))}
      </div>

      <div className="back-link" onClick={onBack}>{'< cd /back  [ESC]'}</div>
    </div>
  )
}
