'use client'

import { useEffect, useRef, useCallback } from 'react'

interface PacManProps { onBack: () => void }

const T = 16
const C = 28
const R = 31
const W = 640
const H = 480
const OX = Math.floor((W - C * T) / 2)
const OY = Math.floor((H - R * T) / 2) + 10
const SPD = 2
const HALF = T / 2

const DX = [0, 1, 0, -1]
const DY = [-1, 0, 1, 0]
const OPP = [2, 3, 0, 1]

const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,2,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,2,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
  [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,0,1,1,1,1,1,4,1,1,4,1,1,1,1,1,0,1,1,1,1,1,1],
  [0,0,0,0,0,1,0,1,1,1,1,1,4,1,1,4,1,1,1,1,1,0,1,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,1,4,4,4,4,4,4,4,4,4,4,1,1,0,1,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,1,4,1,1,1,4,4,1,1,1,4,1,1,0,1,0,0,0,0,0],
  [1,1,1,1,1,1,0,1,1,4,1,4,4,4,4,4,4,1,4,1,1,0,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,4,4,4,1,4,4,4,4,4,4,1,4,4,4,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,0,1,1,4,1,4,4,4,4,4,4,1,4,1,1,0,1,1,1,1,1,1],
  [0,0,0,0,0,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,1,4,4,4,4,4,4,4,4,4,4,1,1,0,1,0,0,0,0,0],
  [0,0,0,0,0,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,0,0,0,0,0],
  [1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,2,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,2,1],
  [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
  [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]

function canWalk(tx: number, ty: number): boolean {
  if (ty < 0 || ty >= R) return false
  const x = ((tx % C) + C) % C
  return MAP[ty][x] !== 1
}

function isGhostHouse(tx: number, ty: number): boolean {
  return ty >= 11 && ty <= 19 && tx >= 9 && tx <= 18 && MAP[ty][tx] === 4
}

function tileX(px: number): number { return Math.floor((px - OX) / T) }
function tileY(py: number): number { return Math.floor((py - OY) / T) }

function renderPx(tx: number, ox: number): number { return OX + tx * T + HALF + ox }
function renderPy(ty: number, oy: number): number { return OY + ty * T + HALF + oy }

interface Ent {
  tx: number; ty: number
  ox: number; oy: number
  dir: number
}

interface Ghost extends Ent {
  mode: number // 0=scatter 1=chase 2=fright 3=eaten
  stx: number; sty: number
  homeX: number; homeY: number
  waitTimer: number
}

interface G {
  pac: Ent
  ndir: number
  grid: number[][]
  dots: number
  score: number; lives: number
  ghosts: Ghost[]
  fright: number
  mTimer: number; scatter: boolean
  frame: number
  over: boolean; won: boolean
  keys: Record<string, boolean>
}

function mkGhost(tx: number, ty: number, dir: number, stx: number, homeX: number, homeY: number): Ghost {
  return { tx, ty, ox: 0, oy: 0, dir, mode: 0, stx, sty: 0, homeX, homeY, waitTimer: 0 }
}

function moveEnt(e: Ent, spd: number): boolean {
  const nx = e.ox + DX[e.dir] * spd
  const ny = e.oy + DY[e.dir] * spd

  if (Math.abs(nx) > HALF || Math.abs(ny) > HALF) {
    const ntx = e.tx + DX[e.dir]
    const nty = e.ty + DY[e.dir]
    if (canWalk(ntx, nty)) {
      e.tx = ntx; e.ty = nty
      e.ox = nx - DX[e.dir] * T
      e.oy = ny - DY[e.dir] * T
      return true
    } else {
      e.ox = 0; e.oy = 0
      return false
    }
  }
  e.ox = nx; e.oy = ny
  return true
}

export default function PacMan({ onBack }: PacManProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const gRef = useRef<G | null>(null)

  const initGame = useCallback(() => {
    const s: G = {
      pac: { tx: 14, ty: 23, ox: 0, oy: 0, dir: 3 },
      ndir: 3,
      grid: MAP.map(r => [...r]),
      dots: 0, score: 0, lives: 3,
      ghosts: [], fright: 0, mTimer: 0, scatter: true,
      frame: 0, over: false, won: false, keys: {},
    }
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (MAP[r][c] === 0 || MAP[r][c] === 2) s.dots++
    s.ghosts = [
      mkGhost(14, 11, 0, 27, 14, 14),
      mkGhost(12, 14, 3, 0, 14, 14),
      mkGhost(14, 14, 0, 27, 14, 14),
      mkGhost(16, 14, 1, 0, 14, 14),
    ]
    gRef.current = s
    return s
  }, [])

  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')!
    const s = initGame()

    const kd = (e: KeyboardEvent) => { s.keys[e.key] = true }
    const ku = (e: KeyboardEvent) => { s.keys[e.key] = false }
    const prevent = (e: KeyboardEvent) => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keydown', prevent)
    window.addEventListener('keyup', ku)

    let raf = 0, last = 0

    const atCenter = (e: Ent) => e.ox === 0 && e.oy === 0

    const update = () => {
      if (s.over || s.won) return
      s.frame++

      const k = s.keys
      if (k['ArrowLeft'] || k['a']) s.ndir = 3
      else if (k['ArrowRight'] || k['d']) s.ndir = 1
      else if (k['ArrowUp'] || k['w']) s.ndir = 0
      else if (k['ArrowDown'] || k['s']) s.ndir = 2

      updatePac(s)
      for (const gh of s.ghosts) updateGhost(gh, s)
      checkHit(s)
      tickTimers(s)
    }

    function updatePac(s: G) {
      const p = s.pac

      if (atCenter(p)) {
        if (s.ndir !== p.dir) {
          if (canWalk(p.tx + DX[s.ndir], p.ty + DY[s.ndir])) {
            p.dir = s.ndir
          }
        }
      }

      if (!canWalk(p.tx + DX[p.dir], p.ty + DY[p.dir]) && atCenter(p)) {
        return
      }

      moveEnt(p, SPD)

      if (p.tx < -1) { p.tx += C }
      if (p.tx >= C) { p.tx -= C }

      const v = s.grid[p.ty]?.[p.tx]
      if (v === 0) { s.grid[p.ty][p.tx] = 3; s.score += 10; s.dots-- }
      else if (v === 2) {
        s.grid[p.ty][p.tx] = 3; s.score += 50; s.dots--
        s.fright = 300
        for (const gh of s.ghosts) if (gh.mode !== 3) { gh.mode = 2; gh.dir = OPP[gh.dir] }
      }
      if (s.dots <= 0) s.won = true
    }

    function updateGhost(gh: Ghost, s: G) {
      if (gh.mode === 3) {
        if (gh.tx === gh.homeX && gh.ty === 11 && atCenter(gh)) {
          gh.mode = s.scatter ? 0 : 1
          gh.dir = 0
          return
        }
        if (gh.ty === 14 && (gh.tx === 13 || gh.tx === 14) && atCenter(gh) && gh.oy <= 0) {
          gh.oy = -HALF
          gh.dir = 0
          moveEnt(gh, 4)
          return
        }
      }

      if (atCenter(gh)) {
        const opts: number[] = []
        for (let d = 0; d < 4; d++) {
          if (d === OPP[gh.dir]) continue
          if (canWalk(gh.tx + DX[d], gh.ty + DY[d])) opts.push(d)
        }
        if (opts.length === 0) {
          gh.dir = OPP[gh.dir]
        } else if (gh.mode === 2) {
          gh.dir = opts[Math.floor(Math.random() * opts.length)]
        } else {
          let ttx: number, tty: number
          if (gh.mode === 3) {
            ttx = gh.homeX; tty = 14
          } else if (gh.mode === 0) {
            ttx = gh.stx; tty = gh.sty
          } else {
            const gi = s.ghosts.indexOf(gh)
            const ptx = s.pac.tx, pty = s.pac.ty
            if (gi === 0) { ttx = ptx; tty = pty }
            else if (gi === 1) { ttx = ptx + DX[s.pac.dir] * 4; tty = pty + DY[s.pac.dir] * 4 }
            else if (gi === 2) {
              const ax = ptx + DX[s.pac.dir] * 4, ay = pty + DY[s.pac.dir] * 4
              ttx = ax + (ax - s.ghosts[0].tx)
              tty = ay + (ay - s.ghosts[0].ty)
            } else {
              const d = Math.abs(gh.tx - s.pac.tx) + Math.abs(gh.ty - s.pac.ty)
              if (d > 8) { ttx = ptx; tty = pty }
              else { ttx = gh.stx; tty = gh.sty }
            }
          }
          let best = Infinity, bestD = opts[0]
          for (const d of opts) {
            const dist = Math.abs(gh.tx + DX[d] - ttx) + Math.abs(gh.ty + DY[d] - tty)
            if (dist < best) { best = dist; bestD = d }
          }
          gh.dir = bestD
        }
      }

      const spd = gh.mode === 3 ? 4 : gh.mode === 2 ? 1 : SPD
      if (!moveEnt(gh, spd) && atCenter(gh)) {
        gh.dir = OPP[gh.dir]
      }

      if (gh.tx < -1) gh.tx += C
      if (gh.tx >= C) gh.tx -= C
    }

    function checkHit(s: G) {
      const px = renderPx(s.pac.tx, s.pac.ox), py = renderPy(s.pac.ty, s.pac.oy)
      for (const gh of s.ghosts) {
        const gx = renderPx(gh.tx, gh.ox), gy = renderPy(gh.ty, gh.oy)
        if (Math.abs(px - gx) + Math.abs(py - gy) > T * 0.8) continue
        if (gh.mode === 2) { gh.mode = 3; s.score += 200 }
        else if (gh.mode !== 3) {
          s.lives--
          if (s.lives <= 0) { s.over = true; return }
          resetPos(s)
          return
        }
      }
    }

    function resetPos(s: G) {
      s.pac = { tx: 14, ty: 23, ox: 0, oy: 0, dir: 3 }
      s.ndir = 3; s.fright = 0
      s.ghosts = [
        mkGhost(14, 11, 0, 27, 14, 14),
        mkGhost(12, 14, 3, 0, 14, 14),
        mkGhost(14, 14, 0, 27, 14, 14),
        mkGhost(16, 14, 1, 0, 14, 14),
      ]
    }

    function tickTimers(s: G) {
      if (s.fright > 0) {
        s.fright--
        if (s.fright <= 0) {
          for (const gh of s.ghosts) if (gh.mode === 2) gh.mode = s.scatter ? 0 : 1
        }
      }
      s.mTimer++
      const cyc = [420, 1200, 420, 1200, 300, 1200, 300, 999999]
      let acc = 0, ns = true
      for (let i = 0; i < cyc.length; i++) { acc += cyc[i]; if (s.mTimer < acc) { ns = i % 2 === 0; break } }
      if (ns !== s.scatter) {
        s.scatter = ns
        for (const gh of s.ghosts) if (gh.mode === 0 || gh.mode === 1) { gh.mode = ns ? 0 : 1; gh.dir = OPP[gh.dir] }
      }
    }

    const draw = () => {
      ctx.fillStyle = '#000a02'
      ctx.fillRect(0, 0, W, H)

      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const x = OX + c * T, y = OY + r * T
        if (MAP[r][c] === 1) { ctx.fillStyle = '#1a3a20'; ctx.fillRect(x, y, T, T) }
      }

      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const cx = OX + c * T + HALF, cy = OY + r * T + HALF
        if (s.grid[r][c] === 0) { ctx.fillStyle = '#33ff66'; ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill() }
        if (s.grid[r][c] === 2) {
          const p = 3 + Math.sin(s.frame * 0.15) * 1.5
          ctx.fillStyle = '#aaffaa'; ctx.beginPath(); ctx.arc(cx, cy, p, 0, Math.PI * 2); ctx.fill()
        }
      }

      const px = renderPx(s.pac.tx, s.pac.ox), py = renderPy(s.pac.ty, s.pac.oy)
      s.pac.dir // keep for drawing
      const mouth = (s.frame % 8) < 4 ? 0.25 : 0.05
      const bA = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI][s.pac.dir]
      ctx.fillStyle = '#33ff66'
      ctx.beginPath(); ctx.arc(px, py, HALF - 1, bA + mouth, bA + Math.PI * 2 - mouth); ctx.lineTo(px, py); ctx.fill()

      const gc = ['#ff3333', '#ffb3ff', '#33ffff', '#ffb347']
      for (let i = 0; i < s.ghosts.length; i++) {
        const gh = s.ghosts[i]
        const gx = renderPx(gh.tx, gh.ox), gy = renderPy(gh.ty, gh.oy)
        const r = HALF - 1
        if (gh.mode === 3) ctx.fillStyle = '#888'
        else if (gh.mode === 2) ctx.fillStyle = (s.fright < 90 && s.fright % 15 < 8) ? '#fff' : '#3366ff'
        else ctx.fillStyle = gc[i]

        ctx.beginPath()
        ctx.arc(gx, gy - 2, r, Math.PI, 0)
        ctx.lineTo(gx + r, gy + r - 2)
        for (let j = 3; j >= -3; j--) ctx.lineTo(gx + (j / 3) * r, gy + r - 2 + (j % 2 === 0 ? 3 : 0))
        ctx.closePath(); ctx.fill()

        if (gh.mode !== 3) {
          ctx.fillStyle = '#fff'
          ctx.beginPath(); ctx.arc(gx - 3, gy - 3, 2.5, 0, Math.PI * 2); ctx.arc(gx + 3, gy - 3, 2.5, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = gh.mode === 2 ? '#fff' : '#003'
          ctx.beginPath(); ctx.arc(gx - 3 + DX[gh.dir], gy - 3 + DY[gh.dir], 1.2, 0, Math.PI * 2); ctx.arc(gx + 3 + DX[gh.dir], gy - 3 + DY[gh.dir], 1.2, 0, Math.PI * 2); ctx.fill()
        } else {
          ctx.fillStyle = '#fff'
          ctx.beginPath(); ctx.arc(gx - 3, gy - 2, 2, 0, Math.PI * 2); ctx.arc(gx + 3, gy - 2, 2, 0, Math.PI * 2); ctx.fill()
        }
      }

      ctx.fillStyle = '#33ff66'; ctx.font = '14px "Share Tech Mono", monospace'
      ctx.fillText(`SCORE: ${s.score}`, 10, 24)
      for (let i = 0; i < s.lives; i++) { ctx.beginPath(); ctx.arc(W - 30 - i * 25, 20, 8, 0.25, Math.PI * 2 - 0.25); ctx.lineTo(W - 30 - i * 25, 20); ctx.fill() }

      if (s.over || s.won) {
        ctx.fillStyle = 'rgba(0,10,2,0.85)'; ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = s.won ? '#33ff66' : '#ff3333'; ctx.font = '28px "Share Tech Mono", monospace'
        const m = s.won ? 'YOU WIN!' : 'GAME OVER'
        ctx.fillText(m, W / 2 - ctx.measureText(m).width / 2, H / 2 - 20)
        ctx.font = '14px "Share Tech Mono", monospace'; ctx.fillStyle = '#1a8f3d'
        ctx.fillText('ENTER TO RESTART', W / 2 - 80, H / 2 + 20)
      }
    }

    const loop = (now: number) => {
      if (now - last >= 1000 / 30) { last = now; update(); draw() }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (s.over || s.won)) { s.over = false; s.won = false; initGame() }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keydown', prevent)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('keydown', onKey)
    }
  }, [initGame])

  return (
    <div className="space-invaders">
      <canvas ref={ref} width={W} height={H} className="space-invaders-canvas" />
      <div className="space-invaders-controls">ARROW KEYS / WASD to move — ENTER to restart</div>
      <div className="back-link" onClick={onBack}>{'< cd /back'}</div>
    </div>
  )
}
