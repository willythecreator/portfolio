'use client'

import { useEffect, useRef, useCallback } from 'react'
import TouchControls from './TouchControls'

interface SpaceInvadersProps {
  onBack: () => void
}

const CANVAS_W = 760
const CANVAS_H = 580
const PLAYER_W = 52
const PLAYER_H = 26
const BULLET_W = 3
const BULLET_H = 12

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
  phase: number
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
  2: '#ff9933',
}

export default function SpaceInvaders({ onBack }: SpaceInvadersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onBackRef = useRef(onBack)
  useEffect(() => { onBackRef.current = onBack }, [onBack])

  const stateRef = useRef({
    player: { x: CANVAS_W / 2 - PLAYER_W / 2, y: CANVAS_H - 80 },
    aliens: [] as Alien[],
    alienDirX: 1,
    alienMoveTimer: 0,
    alienMoveInterval: 14,
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
        x: CANVAS_W / 2 - 80,
        y: 30,
        kind: 2,
        alive: true,
        hp: 80 + level * 15,
        maxHp: 80 + level * 15,
        isBoss: true,
        phase: 0,
      })
      s.bossActive = true
      s.alienMoveInterval = 9
    } else {
      const cols = Math.min(12, 8 + Math.floor(level / 2))
      const rows = Math.min(8, 5 + Math.floor(level / 3))
      const aw = 28
      const ah = 18
      const padX = 12
      const padY = 12
      const startX = (CANVAS_W - (cols * (aw + padX) - padX)) / 2
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const kind = (row % 3) as AlienKind
          s.aliens.push({
            x: startX + col * (aw + padX),
            y: 45 + row * (ah + padY),
            kind,
            alive: true,
            hp: 1 + Math.floor(level / 5),
            maxHp: 1 + Math.floor(level / 5),
            isBoss: false,
            phase: row,
          })
        }
      }
      s.alienMoveInterval = Math.max(6, 24 - level * 1.2)
    }

    s.shields = []
    s.alienDirX = 1
    s.alienMoveTimer = 0
    s.player.x = Math.max(10, Math.min(CANVAS_W - PLAYER_W - 10, s.player.x))
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
    s.player.y = CANVAS_H - 85
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
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) e.preventDefault()
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
      const rate = s.weapon === 'laser' ? 100 : s.weapon === 'spread' ? 160 : 190
      if (now - s.lastShot < rate) return
      s.lastShot = now

      if (s.weapon === 'spread') {
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 1, y: s.player.y + 2, vx: -2.5, vy: -13, fromPlayer: true, damage: 1 })
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 1, y: s.player.y + 2, vx: 0, vy: -14, fromPlayer: true, damage: 1 })
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 1, y: s.player.y + 2, vx: 2.5, vy: -13, fromPlayer: true, damage: 1 })
      } else if (s.weapon === 'laser') {
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 2, y: s.player.y + 2, vx: 0, vy: -18, fromPlayer: true, damage: 3 })
      } else {
        s.bullets.push({ x: s.player.x + PLAYER_W / 2 - 1, y: s.player.y + 2, vx: 0, vy: -14, fromPlayer: true, damage: 1 })
      }
    }

    const update = () => {
      const s = stateRef.current
      if (s.gameOver || s.paused || s.won) return
      s.frame++

      const spd = 7
      if (s.keys['ArrowLeft'] || s.keys['a'] || s.keys['A']) s.player.x -= spd
      if (s.keys['ArrowRight'] || s.keys['d'] || s.keys['D']) s.player.x += spd
      if (s.keys['ArrowUp'] || s.keys['w'] || s.keys['W']) s.player.y -= spd
      if (s.keys['ArrowDown'] || s.keys['s'] || s.keys['S']) s.player.y += spd
      s.player.x = Math.max(6, Math.min(CANVAS_W - PLAYER_W - 6, s.player.x))
      s.player.y = Math.max(20, Math.min(CANVAS_H - PLAYER_H - 4, s.player.y))

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
          const aw = a.isBoss ? 160 : 28
          a.x += s.alienDirX * (a.isBoss ? 2.2 : 1.6)
          if (a.x < 8 || a.x + aw > CANVAS_W - 8) hitEdge = true
        }
        if (hitEdge) {
          s.alienDirX *= -1
          for (const a of s.aliens) {
            if (!a.alive || a.isBoss) continue
            a.y += 14
          }
        }
      }

      if (s.bossActive) {
        const boss = s.aliens.find(a => a.isBoss && a.alive)
        if (boss) {
          boss.x += Math.sin(s.frame * 0.04) * 4
          boss.x = Math.max(10, Math.min(CANVAS_W - 170, boss.x))
          boss.y += Math.cos(s.frame * 0.03) * 1.2
          boss.y = Math.max(25, Math.min(90, boss.y))
          s.bossShotTimer++
          if (s.bossShotTimer > 28) {
            s.bossShotTimer = 0
            const cx = boss.x + 80
            const cy = boss.y + 40
            s.bullets.push({ x: cx, y: cy, vx: 0, vy: 10, fromPlayer: false, damage: 1 })
            s.bullets.push({ x: cx, y: cy, vx: -3, vy: 9, fromPlayer: false, damage: 1 })
            s.bullets.push({ x: cx, y: cy, vx: 3, vy: 9, fromPlayer: false, damage: 1 })
            s.bullets.push({ x: cx, y: cy, vx: -1.5, vy: 9.5, fromPlayer: false, damage: 1 })
            s.bullets.push({ x: cx, y: cy, vx: 1.5, vy: 9.5, fromPlayer: false, damage: 1 })
          }
        }
      }

      if (!s.bossActive && s.frame % 32 === 0) {
        const alive = s.aliens.filter(a => a.alive && !a.isBoss)
        if (alive.length > 0) {
          const shooters = alive.slice().sort((a,b) => b.y - a.y).slice(0, Math.min(3, alive.length))
          for (const sh of shooters) {
            if (Math.random() < 0.6) {
              s.bullets.push({ x: sh.x + 14, y: sh.y + 18, vx: (Math.random() - 0.5) * 1.5, vy: 9, fromPlayer: false, damage: 1 })
            }
          }
        }
      }

      s.powerups = s.powerups.filter(p => {
        p.y += p.vy
        p.life--
        if (p.life <= 0) return false
        if (p.x < s.player.x + PLAYER_W && p.x + 14 > s.player.x && p.y < s.player.y + PLAYER_H && p.y + 14 > s.player.y) {
          s.weapon = p.type
          s.weaponTimer = 800
          return false
        }
        return p.y < CANVAS_H
      })

      s.bullets = s.bullets.filter(b => {
        b.x += b.vx
        b.y += b.vy
        return b.y > -30 && b.y < CANVAS_H + 30 && b.x > -30 && b.x < CANVAS_W + 30
      })

      for (const b of s.bullets) {
        if (!b.fromPlayer) continue
        for (const a of s.aliens) {
          if (!a.alive) continue
          const aw = a.isBoss ? 160 : 28
          const ah = a.isBoss ? 48 : 18
          if (b.x < a.x + aw && b.x + BULLET_W > a.x && b.y < a.y + ah && b.y + BULLET_H > a.y) {
            a.hp -= b.damage
            b.y = -400
            if (a.hp <= 0) {
              a.alive = false
              s.score += a.isBoss ? 2000 + s.level * 200 : [22, 38, 58][a.kind] * s.level
              if (Math.random() < 0.22 && !a.isBoss) {
                const types: WeaponType[] = ['spread', 'laser']
                s.powerups.push({ x: a.x, y: a.y, vy: 2.4, type: types[Math.floor(Math.random() * types.length)], life: 1000 })
              }
              if (a.isBoss) {
                s.bossActive = false
                setTimeout(() => {
                  s.level++
                  if (s.level > 12) s.won = true
                  else initLevel(s.level)
                }, 1000)
              }
            }
            break
          }
        }
      }

      for (const b of s.bullets) {
        if (b.fromPlayer) continue
        if (b.x < s.player.x + PLAYER_W && b.x + BULLET_W > s.player.x && b.y < s.player.y + PLAYER_H && b.y + BULLET_H > s.player.y) {
          s.lives--
          b.y = CANVAS_H + 200
          if (s.lives <= 0) s.gameOver = true
        }
      }

      for (const a of s.aliens) {
        if (a.alive && !a.isBoss && a.y + 18 >= s.player.y) {
          s.gameOver = true
        }
      }

      if (!s.bossActive && s.aliens.every(a => !a.alive)) {
        s.level++
        if (s.level > 12) s.won = true
        else {
          s.paused = true
          setTimeout(() => {
            initLevel(s.level)
            s.paused = false
          }, 650)
        }
      }
    }

    const draw = () => {
      const s = stateRef.current
      const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      g.addColorStop(0, '#000a02')
      g.addColorStop(1, '#000502')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // starfield
      ctx.fillStyle = '#33ff66'
      for (let i = 0; i < 40; i++) {
        const x = (i * 137 + s.frame * 0.3) % CANVAS_W
        const y = (i * 73 + s.frame * 0.2) % CANVAS_H
        ctx.globalAlpha = 0.15 + (i % 3) * 0.1
        ctx.fillRect(x, y, 1, 1)
      }
      ctx.globalAlpha = 1

      // Aliens
      for (const a of s.aliens) {
        if (!a.alive) continue
        if (a.isBoss) {
          ctx.fillStyle = '#ff2222'
          ctx.beginPath()
          ctx.moveTo(a.x + 80, a.y)
          ctx.lineTo(a.x + 160, a.y + 18)
          ctx.lineTo(a.x + 150, a.y + 48)
          ctx.lineTo(a.x + 10, a.y + 48)
          ctx.lineTo(a.x, a.y + 18)
          ctx.closePath()
          ctx.fill()
          ctx.fillStyle = '#ff6666'
          ctx.fillRect(a.x + 10, a.y + 20, 140, 6)
          ctx.fillStyle = '#ffaa66'
          ctx.fillRect(a.x + 30, a.y + 28, 100, 10)
          ctx.fillStyle = '#111'
          ctx.beginPath()
          ctx.arc(a.x + 60, a.y + 33, 4, 0, Math.PI * 2)
          ctx.arc(a.x + 100, a.y + 33, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#000'
          ctx.fillRect(a.x + 8, a.y - 10, 144, 6)
          ctx.fillStyle = '#ff4444'
          ctx.fillRect(a.x + 8, a.y - 10, 144 * Math.max(0, a.hp / a.maxHp), 6)
        } else {
          ctx.fillStyle = ALIEN_COLORS[a.kind]
          if (a.kind === 0) {
            ctx.fillRect(a.x + 12, a.y, 4, 4)
            ctx.fillRect(a.x + 6, a.y + 4, 16, 4)
            ctx.fillRect(a.x + 2, a.y + 8, 24, 4)
            ctx.fillRect(a.x + 2, a.y + 12, 8, 6)
            ctx.fillRect(a.x + 18, a.y + 12, 8, 6)
            ctx.fillStyle = '#000'
            ctx.fillRect(a.x + 10, a.y + 9, 3, 2)
            ctx.fillRect(a.x + 15, a.y + 9, 3, 2)
            ctx.fillStyle = ALIEN_COLORS[a.kind]
          } else if (a.kind === 1) {
            ctx.fillRect(a.x + 4, a.y, 20, 4)
            ctx.fillRect(a.x, a.y + 4, 28, 6)
            ctx.fillRect(a.x + 2, a.y + 10, 24, 6)
            ctx.fillRect(a.x + 6, a.y + 16, 6, 4)
            ctx.fillRect(a.x + 16, a.y + 16, 6, 4)
            ctx.fillStyle = '#000'
            ctx.fillRect(a.x + 9, a.y + 6, 3, 3)
            ctx.fillRect(a.x + 16, a.y + 6, 3, 3)
            ctx.fillStyle = ALIEN_COLORS[a.kind]
          } else {
            ctx.beginPath()
            ctx.moveTo(a.x + 14, a.y)
            ctx.lineTo(a.x + 26, a.y + 8)
            ctx.lineTo(a.x + 22, a.y + 18)
            ctx.lineTo(a.x + 6, a.y + 18)
            ctx.lineTo(a.x + 2, a.y + 8)
            ctx.closePath()
            ctx.fill()
            ctx.fillStyle = '#000'
            ctx.fillRect(a.x + 10, a.y + 10, 4, 4)
            ctx.fillRect(a.x + 16, a.y + 10, 4, 4)
            ctx.fillStyle = ALIEN_COLORS[a.kind]
          }
        }
      }

      for (const p of s.powerups) {
        ctx.fillStyle = p.type === 'laser' ? '#ff33ff' : '#33ffff'
        ctx.fillRect(p.x, p.y, 14, 14)
        ctx.fillStyle = '#000'
        ctx.font = '9px "Share Tech Mono", monospace'
        ctx.fillText(p.type === 'laser' ? 'L' : 'D', p.x + 4, p.y + 10)
      }

      // Player - sleek ship
      ctx.fillStyle = '#33ff66'
      const px = s.player.x, py = s.player.y
      ctx.beginPath()
      ctx.moveTo(px + PLAYER_W / 2, py)
      ctx.lineTo(px + PLAYER_W - 4, py + PLAYER_H - 6)
      ctx.lineTo(px + PLAYER_W - 12, py + PLAYER_H)
      ctx.lineTo(px + 12, py + PLAYER_H)
      ctx.lineTo(px + 4, py + PLAYER_H - 6)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#88ffcc'
      ctx.beginPath()
      ctx.arc(px + PLAYER_W / 2, py + PLAYER_H - 10, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#66ff88'
      ctx.fillRect(px + PLAYER_W / 2 - 2, py + 6, 4, 10)

      for (const b of s.bullets) {
        ctx.fillStyle = b.fromPlayer ? (s.weapon === 'laser' ? '#ff88ff' : '#88ff88') : '#ff5555'
        ctx.fillRect(b.x, b.y, b.vx !== 0 ? BULLET_W + 1 : BULLET_W, BULLET_H)
      }

      ctx.fillStyle = '#33ff66'
      ctx.font = '12px "Share Tech Mono", monospace'
      ctx.fillText('SCORE:' + s.score, 12, 20)
      ctx.fillText('LIVES:' + '♥'.repeat(s.lives), 12, 38)
      ctx.fillText('LEVEL:' + s.level, CANVAS_W - 82, 20)
      ctx.fillText('WPN:' + s.weapon.toUpperCase(), CANVAS_W - 102, 38)

      if (s.paused && !s.gameOver && !s.won) {
        ctx.fillStyle = 'rgba(0,10,2,0.8)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.fillStyle = '#33ff66'
        ctx.font = '28px "Share Tech Mono", monospace'
        const msg = s.level === 1 ? 'READY' : 'LEVEL ' + s.level
        ctx.fillText(msg, CANVAS_W / 2 - ctx.measureText(msg).width / 2, CANVAS_H / 2)
      }

      if (s.gameOver || s.won) {
        ctx.fillStyle = 'rgba(0,10,2,0.92)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.fillStyle = s.won ? '#33ff66' : '#ff3333'
        ctx.font = '32px "Share Tech Mono", monospace'
        const msg = s.won ? 'MISSION COMPLETE' : 'GAME OVER'
        ctx.fillText(msg, CANVAS_W / 2 - ctx.measureText(msg).width / 2, CANVAS_H / 2 - 16)
        ctx.font = '13px "Share Tech Mono", monospace'
        ctx.fillStyle = '#1a8f3d'
        ctx.fillText('PRESS ENTER TO RESTART', CANVAS_W / 2 - ctx.measureText('PRESS ENTER TO RESTART').width / 2, CANVAS_H / 2 + 30)
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
        WASD/ARROWS: move · SPACE/X: shoot · ENTER: pause/restart · ESC/BKSP: back
      </div>
      <TouchControls
        zone={{
          dpad: [],
          actions: [
            { key: ' ', label: 'FIRE', variant: 'a' },
            { key: 'Enter', label: 'START', variant: 'start' },
          ],
          joystick: true,
        }}
      />
      <div className="back-link" onClick={onBack}>{'< cd /back  [BKSP]'}</div>
    </div>
  )
}
