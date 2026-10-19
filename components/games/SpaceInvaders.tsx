'use client'

import { useEffect, useRef, useCallback } from 'react'
import TouchControls from './TouchControls'

interface SpaceInvadersProps {
  onBack: () => void
}

const CANVAS_W = 640
const CANVAS_H = 480
const PLAYER_W = 40
const PLAYER_H = 20
const BULLET_W = 3
const BULLET_H = 10
const ALIEN_COLS = 8
const ALIEN_ROWS = 4
const ALIEN_W = 30
const ALIEN_H = 20
const ALIEN_PAD = 12
const SHIELD_COUNT = 4
const SHIELD_W = 48
const SHIELD_H = 32

type AlienKind = 0 | 1 | 2

interface Alien {
  x: number
  y: number
  kind: AlienKind
  alive: boolean
}

interface Bullet {
  x: number
  y: number
  dy: number
  fromPlayer: boolean
}

interface Shield {
  x: number
  y: number
  blocks: boolean[][]
}

const ALIEN_COLORS: Record<AlienKind, string> = {
  0: '#33ff66',
  1: '#4fffb0',
  2: '#ffb347',
}

const ALIEN_SHAPES: string[][] = [
  ['  █  ', ' ███ ', '█████', '█ █ █', '█   █'],
  [' ███ ', '█████', '█ █ █', '█████', ' █ █ '],
  ['  █  ', ' █ █ ', '█████', ' ██ ', '  █  '],
]

export default function SpaceInvaders({ onBack }: SpaceInvadersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onBackRef = useRef(onBack)
  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])
  const stateRef = useRef({
    player: { x: CANVAS_W / 2 - PLAYER_W / 2, y: CANVAS_H - 50 },
    aliens: [] as Alien[],
    alienDir: 1,
    alienSpeed: 1,
    alienDropTimer: 0,
    bullets: [] as Bullet[],
    shields: [] as Shield[],
    score: 0,
    lives: 3,
    gameOver: false,
    won: false,
    lastShot: 0,
    keys: {} as Record<string, boolean>,
    frame: 0,
  })

  const initGame = useCallback(() => {
    const s = stateRef.current
    s.aliens = []
    for (let row = 0; row < ALIEN_ROWS; row++) {
      for (let col = 0; col < ALIEN_COLS; col++) {
        s.aliens.push({
          x: 60 + col * (ALIEN_W + ALIEN_PAD),
          y: 40 + row * (ALIEN_H + ALIEN_PAD),
          kind: (row % 3) as AlienKind,
          alive: true,
        })
      }
    }
    s.shields = []
    const shieldSpacing = CANVAS_W / (SHIELD_COUNT + 1)
    for (let i = 0; i < SHIELD_COUNT; i++) {
      const sx = shieldSpacing * (i + 1) - SHIELD_W / 2
      const sy = CANVAS_H - 120
      const blocks: boolean[][] = []
      for (let r = 0; r < SHIELD_H; r += 4) {
        const row: boolean[] = []
        for (let c = 0; c < SHIELD_W; c += 4) {
          const cx = c - SHIELD_W / 2
          const cy = r - SHIELD_H / 2
          row.push(Math.sqrt(cx * cx + cy * cy) < SHIELD_W / 2 - 4)
        }
        blocks.push(row)
      }
      s.shields.push({ x: sx, y: sy, blocks })
    }
    s.bullets = []
    s.score = 0
    s.lives = 3
    s.gameOver = false
    s.won = false
    s.alienDir = 1
    s.alienSpeed = 0.5
    s.alienDropTimer = 0
    s.player.x = CANVAS_W / 2 - PLAYER_W / 2
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    initGame()

    const onKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = true
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const update = () => {
      const s = stateRef.current
      if (s.gameOver || s.won) return

      s.frame++

      // Player movement
      if (s.keys['ArrowLeft'] || s.keys['a']) {
        s.player.x = Math.max(0, s.player.x - 8)
      }
      if (s.keys['ArrowRight'] || s.keys['d']) {
        s.player.x = Math.min(CANVAS_W - PLAYER_W, s.player.x + 8)
      }

      // Shooting
      const now = Date.now()
      if (s.keys[' '] && now - s.lastShot > 250) {
        s.bullets.push({
          x: s.player.x + PLAYER_W / 2 - BULLET_W / 2,
          y: s.player.y - BULLET_H,
          dy: -12,
          fromPlayer: true,
        })
        s.lastShot = now
      }

      // Alien shooting
      if (s.frame % 30 === 0) {
        const alive = s.aliens.filter(a => a.alive)
        if (alive.length > 0) {
          const shooter = alive[Math.floor(Math.random() * alive.length)]
          s.bullets.push({
            x: shooter.x + ALIEN_W / 2,
            y: shooter.y + ALIEN_H,
            dy: 6,
            fromPlayer: false,
          })
        }
      }

      // Move aliens
      let hitEdge = false
      for (const a of s.aliens) {
        if (!a.alive) continue
        a.x += s.alienDir * s.alienSpeed
        if (a.x <= 5 || a.x + ALIEN_W >= CANVAS_W - 5) hitEdge = true
      }
      if (hitEdge) {
        s.alienDir *= -1
        for (const a of s.aliens) {
          if (a.alive) a.y += 24
        }
      }

      // Move bullets
      s.bullets = s.bullets.filter(b => {
        b.y += b.dy
        return b.y > -10 && b.y < CANVAS_H + 10
      })

      // Bullet-alien collisions (player bullets)
      for (const b of s.bullets) {
        if (!b.fromPlayer) continue
        for (const a of s.aliens) {
          if (!a.alive) continue
          if (
            b.x < a.x + ALIEN_W &&
            b.x + BULLET_W > a.x &&
            b.y < a.y + ALIEN_H &&
            b.y + BULLET_H > a.y
          ) {
            a.alive = false
            b.y = -100
            s.score += [10, 20, 30][a.kind]
          }
        }
      }

      // Bullet-shield collisions
      for (const b of s.bullets) {
        for (const sh of s.shields) {
          const relX = Math.floor((b.x - sh.x) / 4)
          const relY = Math.floor((b.y - sh.y) / 4)
          if (
            relX >= 0 && relX < sh.blocks[0]?.length &&
            relY >= 0 && relY < sh.blocks.length
          ) {
            if (sh.blocks[relY][relX]) {
              sh.blocks[relY][relX] = false
              b.y = b.fromPlayer ? CANVAS_H + 100 : -100
              break
            }
          }
        }
      }

      // Alien bullet hits player
      for (const b of s.bullets) {
        if (b.fromPlayer) continue
        if (
          b.x < s.player.x + PLAYER_W &&
          b.x + BULLET_W > s.player.x &&
          b.y < s.player.y + PLAYER_H &&
          b.y + BULLET_H > s.player.y
        ) {
          s.lives--
          b.y = CANVAS_H + 100
          if (s.lives <= 0) s.gameOver = true
        }
      }

      // Aliens reach bottom
      for (const a of s.aliens) {
        if (a.alive && a.y + ALIEN_H >= s.player.y) {
          s.gameOver = true
        }
      }

      // Win check
      if (s.aliens.every(a => !a.alive)) {
        s.won = true
      }
    }

    const draw = () => {
      const s = stateRef.current
      ctx.fillStyle = '#000a02'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // Shields
      ctx.fillStyle = '#1a8f3d'
      for (const sh of s.shields) {
        for (let r = 0; r < sh.blocks.length; r++) {
          for (let c = 0; c < sh.blocks[r].length; c++) {
            if (sh.blocks[r][c]) {
              ctx.fillRect(sh.x + c * 4, sh.y + r * 4, 4, 4)
            }
          }
        }
      }

      // Aliens
      for (const a of s.aliens) {
        if (!a.alive) continue
        ctx.fillStyle = ALIEN_COLORS[a.kind]
        const shape = ALIEN_SHAPES[a.kind]
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === '█') {
              ctx.fillRect(a.x + c * 6, a.y + r * 4, 6, 4)
            }
          }
        }
      }

      // Player
      ctx.fillStyle = '#33ff66'
      const px = s.player.x
      const py = s.player.y
      ctx.fillRect(px + PLAYER_W / 2 - 2, py, 4, PLAYER_H)
      ctx.fillRect(px + PLAYER_W / 2 - 12, py + 6, 24, 4)
      ctx.fillRect(px + PLAYER_W / 2 - 18, py + 10, 36, 4)
      ctx.fillRect(px + PLAYER_W / 2 - 20, py + 14, 40, 6)

      // Bullets
      for (const b of s.bullets) {
        ctx.fillStyle = b.fromPlayer ? '#33ff66' : '#ff3300'
        ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H)
      }

      // HUD
      ctx.fillStyle = '#33ff66'
      ctx.font = '14px "Share Tech Mono", monospace'
      ctx.fillText(`SCORE: ${s.score}`, 10, 24)
      ctx.fillText(`LIVES: ${'█'.repeat(s.lives)}`, CANVAS_W - 140, 24)

      // Game over / win
      if (s.gameOver || s.won) {
        ctx.fillStyle = 'rgba(0, 10, 2, 0.85)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.fillStyle = s.won ? '#33ff66' : '#ff3300'
        ctx.font = '28px "Share Tech Mono", monospace'
        const msg = s.won ? 'VICTORY' : 'GAME OVER'
        ctx.fillText(msg, CANVAS_W / 2 - ctx.measureText(msg).width / 2, CANVAS_H / 2 - 20)
        ctx.font = '14px "Share Tech Mono", monospace'
        ctx.fillStyle = '#1a8f3d'
        ctx.fillText(
          'PRESS ENTER TO RESTART',
          CANVAS_W / 2 - 100,
          CANVAS_H / 2 + 20
        )
      }
    }

    let animId: number
    let lastTime = 0
    const FRAME_MS = 1000 / 30

    const loop = (now: number) => {
      if (now - lastTime >= FRAME_MS) {
        lastTime = now
        update()
        draw()
      }
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (stateRef.current.gameOver || stateRef.current.won)) {
        initGame()
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        onBackRef.current()
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('keydown', onKey)
    }
  }, [initGame])

  return (
    <div className="space-invaders" style={{ animation: 'fadein 0.2s ease-in' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="space-invaders-canvas"
        style={{ maxWidth: '100%', height: 'auto', border: '1px solid var(--arcbyte-border)' }}
        onTouchStart={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />
      <div className="space-invaders-controls">
        ARROW KEYS / A,D: move &middot; SPACE: shoot &middot; ENTER: restart &middot; BKSP: back
      </div>
      <TouchControls
        zone={{
          dirs: [
            { key: 'ArrowLeft', label: '\u25c0', className: 'touch-left' },
            { key: 'ArrowRight', label: '\u25b6', className: 'touch-right' },
          ],
          actions: [
            { key: ' ', label: 'FIRE', className: 'touch-primary' },
            { key: 'Enter', label: 'RESTART', className: 'touch-secondary' },
          ],
        }}
      />
      <div className="back-link" onClick={onBack}>{'< cd /back  [BKSP]'}</div>
    </div>
  )
}
