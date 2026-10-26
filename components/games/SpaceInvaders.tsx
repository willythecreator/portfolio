'use client'

import { useEffect, useRef, useCallback } from 'react'
import TouchControls from './TouchControls'

interface SpaceInvadersProps {
  onBack: () => void
}

const CANVAS_W = 640
const CANVAS_H = 480
const PLAYER_W = 44
const PLAYER_H = 18
const BULLET_W = 3
const BULLET_H = 10

type AlienKind = 0 | 1 | 2
type WeaponType = 'single' | 'spread' | 'laser'

interface Alien {
  x: number
  y: number
  kind: AlienKind
  alive: boolean
  hp: number
  maxHp: number
  isBoss: boolean
}

interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  fromPlayer: boolean
  damage: number
}

interface Shield {
  x: number
  y: number
  blocks: boolean[][]
}

interface PowerUp {
  x: number
  y: number
  vy: number
  type: WeaponType
  life: number
}

const ALIEN_COLORS: Record<AlienKind, string> = {
  0: '#33ff66',
  1: '#4fffb0',
  2: '#ffb347',
}

export default function SpaceInvaders({ onBack }: SpaceInvadersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onBackRef = useRef(onBack)
  useEffect(() => { onBackRef.current = onBack }, [onBack])

  const stateRef = useRef({
    player: { x: CANVAS_W / 2 - PLAYER_W / 2, y: CANVAS_H - 75 },
    aliens: [] as Alien[],
    alienDirX: 1,
    alienDirY: 0,
    alienSpeed: 0.9,
    alienMoveTimer: 0,
    alienMoveInterval: 16,
    bullets: [] as Bullet[],
    shields: [] as Shield[],
    powerups: [] as PowerUp[],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    won: false,
    paused: false,
    lastShot: 0,
    keys: {} as Record<string, boolean>,
    frame: 0,
    weapon: 'single' as WeaponType,
    weaponTimer: 0,
    bossActive: false,
    bossShotTimer: 0,
  })

  const initLevel = useCallback((level: number) => {
    const s = stateRef.current
    s.aliens = []
    s.bullets = []
    s.powerups = []
    s.bossActive = false

    if (level % 5 === 0) {
      s.aliens.push({
        x: CANVAS_W / 2 - 70,
        y: 35,
        kind: 2,
        alive: true,
        hp: 60 + level * 12,
        maxHp: 60 + level * 12,
        isBoss: true,
      })
      s.bossActive = true
      s.alienSpeed = 1.4
      s.alienMoveInterval = 10
    } else {
      const cols = Math.min(11, 7 + Math.floor(level / 2))
      const rows = Math.min(7, 4 + Math.floor(level / 3))
      const aw = 30
      const ah = 20
      const padX = 10
      const padY = 10
      const startX = (CANVAS_W - (cols * (aw + padX) - padX)) / 2
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const kind = (row % 3) as AlienKind
          s.aliens.push({
            x: startX + col * (aw + padX),
            y: 40 + row * (ah + padY),
            kind,
            alive: true,
            hp: 1 + Math.floor(level / 4),
            maxHp: 1 + Math.floor(level / 4),
            isBoss: false,
          })
        }
      }
      s.alienSpeed = 0.7 + level * 0.18
      s.alienMoveInterval = Math.max(7, 22 - level)
    }

    s.shields = []
    const shieldSpacing = CANVAS_W / 5
    for (let i = 0; i < 4; i++) {
      const sx = shieldSpacing * (i + 1) - 26
      const sy = CANVAS_H - 160
      const blocks: boolean[][] = []
      for (let r = 0; r < 12; r++) {
        const row: boolean[] = []
        for (let c = 0; c < 18; c++) {
          const cx = c - 9
          const cy = r - 6
          row.push(Math.sqrt(cx * cx + cy * cy) < 9)
        }
        blocks.push(row)
      }
      s.shields.push({ x: sx, y: sy, blocks })
    }

    s.alienDirX = 1
    s.alienDirY = 0
    s.alienMoveTimer = 0
    s.player.x = Math.max(0, Math.min(CANVAS_W - PLAYER_W, s.player.x))
  }, [])

  const initGame = useCallback(() => {
    const s = stateRef.current
    s.score = 0
    s.lives = 3
    s.level = 1
    s.gameOver = false
    s.won = false
    s.paused = false
    s.weapon = 'single'
    s.weaponTimer = 0
    s.player.y = CANVAS_H - 75
    initLevel(1)
  }, [initLevel])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    initGame()

    const onKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = true
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const shoot = () => {
      const s = stateRef.current
      if (s.gameOver || s.paused || s.won) return
      const now = Date.now()
      const rate = s.weapon === 'laser' ? 120 : s.weapon === 'spread' ? 180 : 200
      if (now - s.lastShot < rate) return
      s.lastShot = now

      if (s.weapon === 'spread') {
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 1, y: s.player.y, vx: -2, vy: -12, fromPlayer: true, damage: 1 })
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 1, y: s.player.y, vx: 0, vy: -13, fromPlayer: true, damage: 1 })
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 1, y: s.player.y, vx: 2, vy: -12, fromPlayer: true, damage: 1 })
      } else if (s.weapon === 'laser') {
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 2, y: s.player.y, vx: 0, vy: -16, fromPlayer: true, damage: 2 })
      } else {
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 1, y: s.player.y, vx: 0, vy: -12, fromPlayer: true, damage: 1 })
      }
    }

    const update = () => {
      const s = stateRef.current
      if (s.gameOver || s.paused || s.won) return
      s.frame++

      const speed = 6
      if (s.keys['ArrowLeft'] || s.keys['a']) s.player.x -= speed
      if (s.keys['ArrowRight'] || s.keys['d']) s.player.x += speed
      if (s.keys['ArrowUp'] || s.keys['w']) s.player.y -= speed
      if (s.keys['ArrowDown'] || s.keys['s']) s.player.y += speed
      s.player.x = Math.max(0, Math.min(CANVAS_W - PLAYER_W, s.player.x))
      s.player.y = Math.max(CANVAS_H - 200, Math.min(CANVAS_H - PLAYER_H - 5, s.player.y))

      if (s.keys[' '] || s.keys['x']) shoot()

      if (s.weaponTimer > 0) {
        s.weaponTimer--
        if (s.weaponTimer === 0) s.weapon = 'single'
      }

      s.alienMoveTimer++
      if (s.alienMoveTimer >= s.alienMoveInterval) {
        s.alienMoveTimer = 0
        let hitEdge = false
        for (const a of s.aliens) {
          if (!a.alive) continue
          a.x += s.alienDirX * s.alienSpeed * 4
          if (a.x < 4 || a.x > CANVAS_W - 40) hitEdge = true
        }
        if (hitEdge) {
          s.alienDirX *= -1
          for (const a of s.aliens) {
            if (!a.alive) continue
            a.y += 16
          }
        }
      }

      if (s.bossActive) {
        const boss = s.aliens.find(a => a.isBoss && a.alive)
        if (boss) {
          boss.x += Math.sin(s.frame * 0.05) * 3
          boss.x = Math.max(20, Math.min(CANVAS_W - 160, boss.x))
          s.bossShotTimer++
          if (s.bossShotTimer > 35) {
            s.bossShotTimer = 0
            s.bullets.push({ x: boss.x + 70, y: boss.y + 40, vx: 0, vy: 9, fromPlayer: false, damage: 1 })
            s.bullets.push({ x: boss.x + 40, y: boss.y + 40, vx: -2.5, vy: 8, fromPlayer: false, damage: 1 })
            s.bullets.push({ x: boss.x + 100, y: boss.y + 40, vx: 2.5, vy: 8, fromPlayer: false, damage: 1 })
          }
        }
      }

      if (!s.bossActive && s.frame % 38 === 0) {
        const alive = s.aliens.filter(a => a.alive && !a.isBoss)
        if (alive.length > 0) {
          const shooter = alive[Math.floor(Math.random() * alive.length)]
          s.bullets.push({ x: shooter.x + 15, y: shooter.y + 20, vx: 0, vy: 8, fromPlayer: false, damage: 1 })
        }
      }

      s.powerups = s.powerups.filter(p => {
        p.y += p.vy
        p.life--
        if (p.life <= 0) return false
        if (p.x < s.player.x + PLAYER_W && p.x + 12 > s.player.x && p.y < s.player.y + PLAYER_H && p.y + 12 > s.player.y) {
          s.weapon = p.type
          s.weaponTimer = 700
          return false
        }
        return p.y < CANVAS_H
      })

      s.bullets = s.bullets.filter(b => {
        b.x += b.vx
        b.y += b.vy
        return b.y > -25 && b.y < CANVAS_H + 25 && b.x > -25 && b.x < CANVAS_W + 25
      })

      for (const b of s.bullets) {
        if (!b.fromPlayer) continue
        for (const a of s.aliens) {
          if (!a.alive) continue
          const aw = a.isBoss ? 140 : 30
          const ah = a.isBoss ? 40 : 20
          if (b.x < a.x + aw && b.x + BULLET_W > a.x && b.y < a.y + ah && b.y + BULLET_H > a.y) {
            a.hp -= b.damage
            b.y = -300
            if (a.hp <= 0) {
              a.alive = false
              s.score += a.isBoss ? 1500 + s.level * 150 : [18, 28, 45][a.kind] * s.level
              if (Math.random() < 0.18 && !a.isBoss) {
                const types: WeaponType[] = ['spread', 'laser']
                s.powerups.push({ x: a.x, y: a.y, vy: 2.2, type: types[Math.floor(Math.random() * types.length)], life: 950 })
              }
              if (a.isBoss) {
                s.bossActive = false
                setTimeout(() => {
                  s.level++
                  if (s.level > 15) s.won = true
                  else initLevel(s.level)
                }, 900)
              }
            }
            break
          }
        }
      }

      for (const b of s.bullets) {
        for (const sh of s.shields) {
          const relX = Math.floor((b.x - sh.x) / 3)
          const relY = Math.floor((b.y - sh.y) / 3)
          if (relX >= 0 && relX < (sh.blocks[0]?.length || 0) && relY >= 0 && relY < sh.blocks.length) {
            if (sh.blocks[relY][relX]) {
              sh.blocks[relY][relX] = false
              b.y = b.fromPlayer ? CANVAS_H + 150 : -150
              break
            }
          }
        }
      }

      for (const b of s.bullets) {
        if (b.fromPlayer) continue
        if (b.x < s.player.x + PLAYER_W && b.x + BULLET_W > s.player.x && b.y < s.player.y + PLAYER_H && b.y + BULLET_H > s.player.y) {
          s.lives--
          b.y = CANVAS_H + 150
          if (s.lives <= 0) s.gameOver = true
        }
      }

      for (const a of s.aliens) {
        if (a.alive && !a.isBoss && a.y + 22 >= s.player.y) {
          s.gameOver = true
        }
      }

      if (!s.bossActive && s.aliens.every(a => !a.alive)) {
        s.level++
        if (s.level > 15) s.won = true
        else {
          s.paused = true
          setTimeout(() => {
            initLevel(s.level)
            s.paused = false
          }, 700)
        }
      }
    }

    const draw = () => {
      const s = stateRef.current
      ctx.fillStyle = '#000a02'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      ctx.fillStyle = '#22aa44'
      for (const sh of s.shields) {
        for (let r = 0; r < sh.blocks.length; r++) {
          for (let c = 0; c < sh.blocks[r].length; c++) {
            if (sh.blocks[r][c]) {
              ctx.fillRect(sh.x + c * 3, sh.y + r * 3, 3, 3)
            }
          }
        }
      }

      for (const a of s.aliens) {
        if (!a.alive) continue
        if (a.isBoss) {
          ctx.fillStyle = '#ff3333'
          ctx.fillRect(a.x, a.y, 140, 8)
          ctx.fillRect(a.x + 8, a.y + 8, 124, 12)
          ctx.fillRect(a.x + 18, a.y + 20, 104, 12)
          ctx.fillRect(a.x + 40, a.y + 32, 60, 8)
          ctx.fillStyle = '#222'
          ctx.fillRect(a.x, a.y - 10, 140, 5)
          ctx.fillStyle = '#ff5555'
          ctx.fillRect(a.x, a.y - 10, 140 * Math.max(0, a.hp / a.maxHp), 5)
        } else {
          ctx.fillStyle = ALIEN_COLORS[a.kind]
          if (a.kind === 0) {
            ctx.fillRect(a.x + 12, a.y, 6, 4)
            ctx.fillRect(a.x + 6, a.y + 4, 18, 4)
            ctx.fillRect(a.x, a.y + 8, 30, 4)
            ctx.fillRect(a.x + 6, a.y + 12, 6, 4)
            ctx.fillRect(a.x + 18, a.y + 12, 6, 4)
            ctx.fillRect(a.x + 6, a.y + 16, 18, 4)
          } else if (a.kind === 1) {
            ctx.fillRect(a.x + 4, a.y, 22, 4)
            ctx.fillRect(a.x, a.y + 4, 30, 8)
            ctx.fillRect(a.x + 6, a.y + 12, 6, 8)
            ctx.fillRect(a.x + 18, a.y + 12, 6, 8)
          } else {
            ctx.fillRect(a.x + 12, a.y, 6, 6)
            ctx.fillRect(a.x + 6, a.y + 6, 18, 6)
            ctx.fillRect(a.x, a.y + 12, 30, 4)
            ctx.fillRect(a.x + 4, a.y + 16, 6, 4)
            ctx.fillRect(a.x + 20, a.y + 16, 6, 4)
          }
        }
      }

      for (const p of s.powerups) {
        ctx.fillStyle = p.type === 'laser' ? '#ff00ff' : '#00ffff'
        ctx.fillRect(p.x, p.y, 12, 12)
        ctx.fillStyle = '#000'
        ctx.font = '8px "Share Tech Mono", monospace'
        ctx.fillText(p.type === 'laser' ? 'L' : 'S', p.x + 3, p.y + 9)
      }

      ctx.fillStyle = '#33ff66'
      const px = s.player.x, py = s.player.y
      ctx.fillRect(px + 20, py, 4, 8)
      ctx.fillRect(px + 14, py + 8, 16, 4)
      ctx.fillRect(px + 8, py + 12, 28, 4)
      ctx.fillRect(px, py + 16, 44, 2)

      for (const b of s.bullets) {
        ctx.fillStyle = b.fromPlayer ? (s.weapon === 'laser' ? '#ff66ff' : '#33ff66') : '#ff4444'
        ctx.fillRect(b.x, b.y, b.vx !== 0 ? BULLET_W + 1 : BULLET_W, BULLET_H)
      }

      ctx.fillStyle = '#33ff66'
      ctx.font = '12px "Share Tech Mono", monospace'
      ctx.fillText('SCORE:' + s.score, 10, 18)
      ctx.fillText('LIVES:' + '♥'.repeat(s.lives), 10, 34)
      ctx.fillText('LEVEL:' + s.level, CANVAS_W - 78, 18)
      ctx.fillText('WPN:' + s.weapon.toUpperCase(), CANVAS_W - 98, 34)

      if (s.paused && !s.gameOver && !s.won) {
        ctx.fillStyle = 'rgba(0,10,2,0.75)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.fillStyle = '#33ff66'
        ctx.font = '26px "Share Tech Mono", monospace'
        const msg = s.level > 1 ? 'LEVEL ' + s.level : 'PAUSED'
        ctx.fillText(msg, CANVAS_W / 2 - ctx.measureText(msg).width / 2, CANVAS_H / 2)
      }

      if (s.gameOver || s.won) {
        ctx.fillStyle = 'rgba(0,10,2,0.88)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.fillStyle = s.won ? '#33ff66' : '#ff3333'
        ctx.font = '30px "Share Tech Mono", monospace'
        const msg = s.won ? 'MISSION COMPLETE' : 'GAME OVER'
        ctx.fillText(msg, CANVAS_W / 2 - ctx.measureText(msg).width / 2, CANVAS_H / 2 - 18)
        ctx.font = '13px "Share Tech Mono", monospace'
        ctx.fillStyle = '#1a8f3d'
        const sub = 'PRESS ENTER TO RESTART'
        ctx.fillText(sub, CANVAS_W / 2 - ctx.measureText(sub).width / 2, CANVAS_H / 2 + 28)
      }
    }

    let animId: number
    let lastTime = 0
    const FRAME_MS = 1000 / 60

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
      if (e.key === 'Enter') {
        const s = stateRef.current
        if (s.gameOver || s.won) initGame()
        else s.paused = !s.paused
      }
      if (e.key === 'Escape' || e.key === 'Backspace') {
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
  }, [initGame, initLevel])

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
        WASD/ARROWS: 8-directional · SPACE/X: shoot · ENTER: pause/restart · ESC/BKSP: back
      </div>
      <TouchControls
        zone={{
          dpad: [
            { dir: 'up', key: 'ArrowUp' },
            { dir: 'left', key: 'ArrowLeft' },
            { dir: 'down', key: 'ArrowDown' },
            { dir: 'right', key: 'ArrowRight' },
          ],
          actions: [
            { key: ' ', label: 'A', variant: 'a' },
            { key: 'Enter', label: 'START', variant: 'start' },
          ],
        }}
      />
      <div className="back-link" onClick={onBack}>{'< cd /back  [BKSP]'}</div>
    </div>
  )
}
