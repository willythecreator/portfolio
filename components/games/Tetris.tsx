'use client'

import { useEffect, useRef, useCallback } from 'react'
import TouchControls from './TouchControls'

interface TetrisProps {
  onBack: () => void
}

const COLS = 10
const ROWS = 20
const HIDDEN = 2
const TOTAL_ROWS = ROWS + HIDDEN
const CELL = 20
const FIELD_X = 20
const FIELD_Y = 10
const CANVAS_W = 640
const CANVAS_H = 480

const BG = '#000a02'
const PRIMARY = '#33ff66'
const GRID_COLOR = '#0a2a10'
const BORDER_COLOR = '#1a8f3d'
const GHOST_ALPHA = 0.25

type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

interface Piece {
  type: PieceType
  shape: number[][]
  x: number
  y: number
}

interface GameState {
  grid: (PieceType | null)[][]
  current: Piece | null
  nextPieces: PieceType[]
  holdType: PieceType | null
  canHold: boolean
  score: number
  level: number
  lines: number
  gameOver: boolean
  dropTimer: number
  lastTime: number
  lockDelay: number
  lockDelayMax: number
  locking: boolean
  keys: Record<string, boolean>
  keyTimers: Record<string, number>
  bag: PieceType[]
  softDropping: boolean
}

const PIECE_COLORS: Record<PieceType, string> = {
  I: '#33ff66',
  O: '#aaffaa',
  T: '#66ff88',
  S: '#44dd66',
  Z: '#22cc44',
  J: '#11bb33',
  L: '#88ffaa',
}

const SHAPES: Record<PieceType, number[][][]> = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ],
}

// SRS wall kick data
const WALL_KICKS: Record<string, [number, number][]> = {
  '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
}

const WALL_KICKS_I: Record<string, [number, number][]> = {
  '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
}

const BAG: PieceType[] = ['I','O','T','S','Z','J','L']

const LINE_SCORES = [0, 100, 300, 500, 800]

function shuffleBag(): PieceType[] {
  const bag = [...BAG]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return bag
}

function getSpeed(level: number): number {
  const speeds = [800,720,630,550,470,380,300,220,140,100,80,80,80,70,70,70,50,50,50,50]
  return speeds[Math.min(level, speeds.length - 1)] || 50
}

export default function Tetris({ onBack }: TetrisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    grid: [] as (PieceType | null)[][],
    current: null as Piece | null,
    nextPieces: [] as PieceType[],
    holdType: null as PieceType | null,
    canHold: true,
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    dropTimer: 0,
    lastTime: 0,
    lockDelay: 0,
    lockDelayMax: 500,
    locking: false,
    keys: {} as Record<string, boolean>,
    keyTimers: {} as Record<string, number>,
    bag: [] as PieceType[],
    softDropping: false,
  })

  const initGrid = useCallback((): (PieceType | null)[][] => {
    const grid: (PieceType | null)[][] = []
    for (let r = 0; r < TOTAL_ROWS; r++) {
      grid.push(new Array(COLS).fill(null))
    }
    return grid
  }, [])

  const nextFromBag = useCallback((s: GameState): PieceType => {
    if (s.bag.length === 0) {
      s.bag = shuffleBag()
    }
    return s.bag.pop()!
  }, [])

  const spawnPiece = useCallback((s: GameState, type?: PieceType): Piece | null => {
    const pieceType = type ?? s.nextPieces.shift()!
    while (s.nextPieces.length < 4) {
      s.nextPieces.push(nextFromBag(s))
    }
    const shape = SHAPES[pieceType][0]
    const x = Math.floor((COLS - shape[0].length) / 2)
    const y = 0
    const piece: Piece = { type: pieceType, shape, x, y }
    if (!isValidPosition(s.grid, piece.shape, piece.x, piece.y)) {
      s.gameOver = true
      return null
    }
    s.current = piece
    s.canHold = true
    s.locking = false
    s.lockDelay = 0
    return piece
  }, [nextFromBag])

  const isValidPosition = useCallback((grid: (PieceType | null)[][], shape: number[][], px: number, py: number): boolean => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue
        const nx = px + c
        const ny = py + r
        if (nx < 0 || nx >= COLS || ny >= TOTAL_ROWS) return false
        if (ny >= 0 && grid[ny][nx] !== null) return false
      }
    }
    return true
  }, [])

  const rotatePiece = useCallback((s: GameState, dir: 1 | -1): boolean => {
    const p = s.current
    if (!p || p.type === 'O') return false
    const fromRot = SHAPES[p.type].indexOf(p.shape)
    const toRot = ((fromRot + dir) % 4 + 4) % 4
    const newShape = SHAPES[p.type][toRot]
    const key = `${fromRot}>${toRot}`
    const kicks = p.type === 'I' ? WALL_KICKS_I[key] : WALL_KICKS[key]
    if (!kicks) return false
    for (const [dx, dy] of kicks) {
      if (isValidPosition(s.grid, newShape, p.x + dx, p.y - dy)) {
        p.shape = newShape
        p.x += dx
        p.y -= dy
        s.locking = false
        s.lockDelay = 0
        return true
      }
    }
    return false
  }, [isValidPosition])

  const lockPiece = useCallback((s: GameState) => {
    const p = s.current
    if (!p) return
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (!p.shape[r][c]) continue
        const gy = p.y + r
        const gx = p.x + c
        if (gy >= 0 && gy < TOTAL_ROWS && gx >= 0 && gx < COLS) {
          s.grid[gy][gx] = p.type
        }
      }
    }
    let cleared = 0
    for (let r = TOTAL_ROWS - 1; r >= 0; r--) {
      if (s.grid[r].every(cell => cell !== null)) {
        s.grid.splice(r, 1)
        s.grid.unshift(new Array(COLS).fill(null))
        cleared++
        r++
      }
    }
    if (cleared > 0) {
      s.lines += cleared
      s.score += LINE_SCORES[cleared] * s.level
      s.level = Math.floor(s.lines / 10) + 1
    }
    s.current = null
    spawnPiece(s)
  }, [spawnPiece])

  const getGhostY = useCallback((s: GameState): number => {
    const p = s.current
    if (!p) return 0
    let gy = p.y
    while (isValidPosition(s.grid, p.shape, p.x, gy + 1)) {
      gy++
    }
    return gy
  }, [isValidPosition])

  const initGame = useCallback(() => {
    const s = stateRef.current
    s.grid = initGrid()
    s.bag = shuffleBag()
    s.nextPieces = []
    for (let i = 0; i < 4; i++) {
      s.nextPieces.push(nextFromBag(s))
    }
    s.holdType = null
    s.canHold = true
    s.score = 0
    s.level = 1
    s.lines = 0
    s.gameOver = false
    s.dropTimer = 0
    s.lockDelay = 0
    s.locking = false
    s.keys = {}
    s.keyTimers = {}
    s.softDropping = false
    spawnPiece(s)
  }, [initGrid, nextFromBag, spawnPiece])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    initGame()

    const DAS_DELAY = 170
    const DAS_REPEAT = 50

    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','c','C','Escape','Backspace','Enter'].includes(e.key)) {
        e.preventDefault()
      }
      if (s.keys[e.key]) return
      s.keys[e.key] = true
      s.keyTimers[e.key] = 0

      if (s.gameOver) {
        if (e.key === 'Enter') initGame()
        if (e.key === 'Escape' || e.key === 'Backspace') onBack()
        return
      }

      if (!s.current) return

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (isValidPosition(s.grid, s.current.shape, s.current.x - 1, s.current.y)) {
          s.current.x--
          s.locking = false
          s.lockDelay = 0
        }
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        if (isValidPosition(s.grid, s.current.shape, s.current.x + 1, s.current.y)) {
          s.current.x++
          s.locking = false
          s.lockDelay = 0
        }
      }
      if (e.key === 'ArrowUp' || e.key === 'w') {
        rotatePiece(s, 1)
      }
      if (e.key === 'ArrowDown' || e.key === 's') {
        s.softDropping = true
      }
      if (e.key === ' ') {
        const gy = getGhostY(s)
        s.score += (gy - s.current.y) * 2
        s.current.y = gy
        lockPiece(s)
      }
      if (e.key === 'c' || e.key === 'C') {
        if (s.canHold) {
          const currentType = s.current.type
          if (s.holdType) {
            spawnPiece(s, s.holdType)
          } else {
            s.current = null
            spawnPiece(s)
          }
          s.holdType = currentType
          s.canHold = false
        }
      }
      if (e.key === 'Escape' || e.key === 'Backspace') {
        onBack()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current
      s.keys[e.key] = false
      s.keyTimers[e.key] = 0
      if (e.key === 'ArrowDown' || e.key === 's') {
        s.softDropping = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const update = (dt: number) => {
      const s = stateRef.current
      if (s.gameOver || !s.current) return

      // DAS for left/right
      for (const key of ['ArrowLeft', 'a', 'ArrowRight', 'd']) {
        if (s.keys[key]) {
          s.keyTimers[key] = (s.keyTimers[key] || 0) + dt
          if (s.keyTimers[key] > DAS_DELAY) {
            const repeat = s.keyTimers[key] - DAS_DELAY
            const moves = Math.floor(repeat / DAS_REPEAT)
            const dir = (key === 'ArrowLeft' || key === 'a') ? -1 : 1
            const prevMoves = Math.floor((repeat - dt) / DAS_REPEAT)
            const newMoves = moves - prevMoves
            for (let i = 0; i < newMoves; i++) {
              if (isValidPosition(s.grid, s.current.shape, s.current.x + dir, s.current.y)) {
                s.current.x += dir
              }
            }
            s.keyTimers[key] = DAS_DELAY + (moves * DAS_REPEAT)
          }
        }
      }

      // Gravity
      const speed = getSpeed(s.level)
      s.dropTimer += dt
      const dropInterval = s.softDropping ? Math.max(speed / 20, 30) : speed

      // Lock delay check
      const onGround = !isValidPosition(s.grid, s.current.shape, s.current.x, s.current.y + 1)

      if (onGround) {
        if (!s.locking) {
          s.locking = true
          s.lockDelay = 0
        }
        s.lockDelay += dt
        if (s.lockDelay >= s.lockDelayMax) {
          lockPiece(s)
          return
        }
      } else {
        s.locking = false
        s.lockDelay = 0
      }

      if (s.dropTimer >= dropInterval) {
        s.dropTimer = 0
        if (isValidPosition(s.grid, s.current.shape, s.current.x, s.current.y + 1)) {
          s.current.y++
          if (s.softDropping) s.score += 1
        }
      }
    }

    const draw = () => {
      const s = stateRef.current
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // Play field background
      ctx.fillStyle = '#001205'
      ctx.fillRect(FIELD_X, FIELD_Y, COLS * CELL, ROWS * CELL)

      // Grid lines
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth = 1
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath()
        ctx.moveTo(FIELD_X, FIELD_Y + r * CELL)
        ctx.lineTo(FIELD_X + COLS * CELL, FIELD_Y + r * CELL)
        ctx.stroke()
      }
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath()
        ctx.moveTo(FIELD_X + c * CELL, FIELD_Y)
        ctx.lineTo(FIELD_X + c * CELL, FIELD_Y + ROWS * CELL)
        ctx.stroke()
      }

      // Locked cells
      for (let r = HIDDEN; r < TOTAL_ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (s.grid[r][c]) {
            const color = PIECE_COLORS[s.grid[r][c]!]
            const dy = r - HIDDEN
            drawCell(ctx, FIELD_X + c * CELL, FIELD_Y + dy * CELL, CELL, color)
          }
        }
      }

      // Ghost piece
      if (s.current && !s.gameOver) {
        const gy = getGhostY(s)
        if (gy !== s.current.y) {
          ctx.globalAlpha = GHOST_ALPHA
          for (let r = 0; r < s.current.shape.length; r++) {
            for (let c = 0; c < s.current.shape[r].length; c++) {
              if (!s.current.shape[r][c]) continue
              const dy = gy + r - HIDDEN
              if (dy < 0) continue
              drawCell(ctx, FIELD_X + (s.current.x + c) * CELL, FIELD_Y + dy * CELL, CELL, PIECE_COLORS[s.current.type])
            }
          }
          ctx.globalAlpha = 1
        }
      }

      // Current piece
      if (s.current && !s.gameOver) {
        for (let r = 0; r < s.current.shape.length; r++) {
          for (let c = 0; c < s.current.shape[r].length; c++) {
            if (!s.current.shape[r][c]) continue
            const dy = s.current.y + r - HIDDEN
            if (dy < 0) continue
            drawCell(ctx, FIELD_X + (s.current.x + c) * CELL, FIELD_Y + dy * CELL, CELL, PIECE_COLORS[s.current.type])
          }
        }
      }

      // Border
      ctx.strokeStyle = BORDER_COLOR
      ctx.lineWidth = 2
      ctx.strokeRect(FIELD_X - 1, FIELD_Y - 1, COLS * CELL + 2, ROWS * CELL + 2)

      // HUD panel
      const hudX = FIELD_X + COLS * CELL + 30
      let hudY = FIELD_Y

      ctx.fillStyle = PRIMARY
      ctx.font = '13px "Share Tech Mono", monospace'

      // Hold
      ctx.fillText('HOLD', hudX, hudY + 14)
      ctx.strokeStyle = BORDER_COLOR
      ctx.lineWidth = 1
      ctx.strokeRect(hudX, hudY + 20, 5 * CELL, 4 * CELL)
      if (s.holdType) {
        drawMiniPiece(ctx, hudX + 4, hudY + 24, s.holdType, !s.canHold ? 0.4 : 1)
      }

      // Next
      hudY += 4 * CELL + 40
      ctx.fillStyle = PRIMARY
      ctx.fillText('NEXT', hudX, hudY + 14)
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = BORDER_COLOR
        ctx.strokeRect(hudX, hudY + 20 + i * (3.5 * CELL), 5 * CELL, 3.5 * CELL)
        if (s.nextPieces[i]) {
          drawMiniPiece(ctx, hudX + 4, hudY + 24 + i * (3.5 * CELL), s.nextPieces[i], 1)
        }
      }

      // Score / Level / Lines
      hudY += 4 * 3.5 * CELL + 40
      ctx.fillStyle = PRIMARY
      ctx.font = '13px "Share Tech Mono", monospace'
      ctx.fillText('SCORE', hudX, hudY)
      ctx.font = '18px "Share Tech Mono", monospace'
      ctx.fillText(String(s.score), hudX, hudY + 22)
      hudY += 40
      ctx.font = '13px "Share Tech Mono", monospace'
      ctx.fillText('LEVEL', hudX, hudY)
      ctx.font = '18px "Share Tech Mono", monospace'
      ctx.fillText(String(s.level), hudX, hudY + 22)
      hudY += 40
      ctx.font = '13px "Share Tech Mono", monospace'
      ctx.fillText('LINES', hudX, hudY)
      ctx.font = '18px "Share Tech Mono", monospace'
      ctx.fillText(String(s.lines), hudX, hudY + 22)

      // Game over overlay
      if (s.gameOver) {
        ctx.fillStyle = 'rgba(0, 10, 2, 0.85)'
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
        ctx.fillStyle = '#ff3333'
        ctx.font = '28px "Share Tech Mono", monospace'
        const msg = 'GAME OVER'
        ctx.fillText(msg, CANVAS_W / 2 - ctx.measureText(msg).width / 2, CANVAS_H / 2 - 30)
        ctx.fillStyle = PRIMARY
        ctx.font = '16px "Share Tech Mono", monospace'
        const scoreMsg = `SCORE: ${s.score}`
        ctx.fillText(scoreMsg, CANVAS_W / 2 - ctx.measureText(scoreMsg).width / 2, CANVAS_H / 2 + 5)
        ctx.fillStyle = '#1a8f3d'
        ctx.font = '13px "Share Tech Mono", monospace'
        ctx.fillText('ENTER TO RESTART', CANVAS_W / 2 - 80, CANVAS_H / 2 + 35)
        ctx.fillText('ESC / BACKSPACE TO EXIT', CANVAS_W / 2 - 110, CANVAS_H / 2 + 55)
      }
    }

    let animId: number
    let lastTime = performance.now()
    const FRAME_MS = 1000 / 30

    const loop = (now: number) => {
      if (now - lastTime >= FRAME_MS) {
        const dt = now - lastTime
        lastTime = now
        update(Math.min(dt, 100))
        draw()
      }
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [initGame, onBack, isValidPosition, rotatePiece, lockPiece, getGhostY, spawnPiece, nextFromBag])

  return (
    <div className="tetris" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'fadein 0.2s ease-in' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', imageRendering: 'pixelated', maxWidth: '100%', height: 'auto', border: '1px solid var(--arcbyte-border)' }}
        onTouchStart={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />
      <div className="doom-controls" style={{ fontSize: 10 }}>
        ARROW KEYS / WASD: move &middot; UP: rotate &middot; SPACE: drop &middot; C: hold &middot; ENTER: restart &middot; ESC: back &middot; BKSP: back
      </div>
      <TouchControls
        zone={{
          dpad: [
            { dir: 'left', key: 'ArrowLeft' },
            { dir: 'right', key: 'ArrowRight' },
            { dir: 'down', key: 'ArrowDown' },
          ],
          actions: [
            { key: 'ArrowUp', label: 'A', variant: 'a' },
            { key: ' ', label: 'B', variant: 'b' },
            { key: 'c', label: 'C', variant: 'c' },
            { key: 'Enter', label: 'START', variant: 'start' },
          ],
        }}
      />
      <div className="back-link" onClick={onBack}>{'< cd /back  [BKSP]'}</div>
    </div>
  )
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2)
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(x + 1, y + 1, size - 2, 2)
  ctx.fillRect(x + 1, y + 1, 2, size - 2)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(x + size - 3, y + 1, 2, size - 2)
  ctx.fillRect(x + 1, y + size - 3, size - 2, 2)
}

function drawMiniPiece(ctx: CanvasRenderingContext2D, x: number, y: number, type: PieceType, alpha: number) {
  const shape = SHAPES[type][0]
  const color = PIECE_COLORS[type]
  const miniCell = 18
  ctx.globalAlpha = alpha
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        drawCell(ctx, x + c * miniCell, y + r * miniCell, miniCell, color)
      }
    }
  }
  ctx.globalAlpha = 1
}
