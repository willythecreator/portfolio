'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

export type Dir = 'up' | 'down' | 'left' | 'right'
export type DpadKey = { dir: Dir; key: string }
export type ActionKey = { key: string; label: string; variant?: 'a' | 'b' | 'c' | 'start' }
export type JoystickVector = { x: number; y: number }

declare global {
  interface WindowEventMap {
    'arcbyte:joystick': CustomEvent<JoystickVector>
  }
}

export interface ControllerZone {
  dpad?: DpadKey[]
  actions?: ActionKey[]
  joystick?: boolean
}

interface TouchControlsProps {
  zone: ControllerZone
}

const KEY_CODE: Record<string, number> = {
  Backspace: 8,
  Enter: 13,
  Shift: 16,
  Control: 17,
  Escape: 27,
  ' ': 32,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  a: 65,
  c: 67,
  d: 68,
  s: 83,
  w: 87,
  A: 65,
  C: 67,
  D: 68,
  S: 83,
  W: 87,
  '1': 49,
  '2': 50,
  '3': 51,
  '4': 52,
  '5': 53,
  '6': 54,
  '7': 55,
  '8': 56,
  '9': 57,
  y: 89,
  n: 78,
  Y: 89,
  N: 78,
}

function dispatch(type: 'keydown' | 'keyup', key: string) {
  const event = new KeyboardEvent(type, {
    key,
    code: key === ' ' ? 'Space' : key,
    bubbles: true,
    cancelable: true,
  })
  const code = KEY_CODE[key]
  if (code !== undefined) {
    try {
      Object.defineProperty(event, 'keyCode', { get: () => code })
      Object.defineProperty(event, 'which', { get: () => code })
    } catch {
      /* ignore */
    }
  }
  window.dispatchEvent(event)
}

const MIN_HOLD_MS = 80

/* ── Pixel sprites ───────────────────────────────────────────────────────────
   Each sprite is a grid of chars. '#' = lit block, '.' = empty. They are
   rendered as square <rect> pixels with crispEdges so the edges never blur. */

type Sprite = string[]

/* Chunky 8-bit arrows (7x7) — one triangle-with-tail, rotated per direction
   so all four read exactly the same. */
const ARROW_UP: Sprite = [
  '..#..',
  '.###.',
  '#####',
]

const ARROW_DOWN: Sprite = [
  '#####',
  '.###.',
  '..#..',
]

const ARROW_LEFT: Sprite = [
  '..#',
  '.##',
  '###',
  '.##',
  '..#',
]

const ARROW_RIGHT: Sprite = [
  '#..',
  '##.',
  '###',
  '##.',
  '#..',
]

const ARROWS: Record<Dir, Sprite> = {
  up: ARROW_UP,
  down: ARROW_DOWN,
  left: ARROW_LEFT,
  right: ARROW_RIGHT,
}

/* Round action button (14x14) — an 8-bit "circle": a stepped disc of pixels
   with a chunky rim. '#' = rim, '.' = empty. */
const BTN_RING: Sprite = [
  '....######....',
  '..##########..',
  '.############.',
  '.############.',
  '##############',
  '##############',
  '##############',
  '##############',
  '##############',
  '##############',
  '.############.',
  '.############.',
  '..##########..',
  '....######....',
]

const BTN_FACE: Sprite = [
  '..............',
  '..............',
  '....######....',
  '...########...',
  '..##########..',
  '..##########..',
  '..##########..',
  '..##########..',
  '..##########..',
  '..##########..',
  '...########...',
  '....######....',
  '..............',
  '..............',
]

/* Cross-shaped d-pad plate (15x15) — solid green rim. Arm width 5, centred
   on columns 5..9 so every edge is a clean pixel step. Outer corners are
   beveled by one pixel for the classic 8-bit "cross" silhouette. */
const DPAD_PLATE: Sprite = [
  '.....#####.....',
  '.....#####.....',
  '.....#####.....',
  '.....#####.....',
  '.....#####.....',
  '###############',
  '###############',
  '###############',
  '###############',
  '###############',
  '.....#####.....',
  '.....#####.....',
  '.....#####.....',
  '.....#####.....',
  '.....#####.....',
]

/* Cross inset by one pixel — the raised face (same cross silhouette as the
   plate but 1px smaller). Rendered with a bevel so it reads as a solid,
   sculpted button instead of a hollow cut-out. */
const DPAD_FACE: Sprite = [
  '...............',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '.#############.',
  '.#############.',
  '.#############.',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '......###......',
  '...............',
]

/* Renders a sprite as SVG squares. scale = pixel size in the viewBox. */
function PixelSprite({
  sprite,
  className,
  width,
  on,
}: {
  sprite: Sprite
  className?: string
  width: number
  on?: string
}) {
  const rows = sprite.length
  const cols = sprite[0].length
  const blocks: Array<[number, number, string]> = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = sprite[y][x]
      if (c !== '.') blocks.push([x, y, c])
    }
  }
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      width={width}
      height={(width * rows) / cols}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {blocks.map(([x, y, c], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={1.02}
          height={1.02}
          fill={c === 'o' ? '#0a2c12' : on && c === '#' ? on : undefined}
          className={c === '#' ? 'px-lit' : undefined}
        />
      ))}
    </svg>
  )
}

/* A single tap/hold action button (A / B / C / START). */
function ActionButton({
  keyName,
  className,
  variant,
  children,
  onPress,
  onRelease,
}: {
  keyName: string
  className: string
  variant?: 'a' | 'b' | 'c' | 'start'
  children: ReactNode
  onPress: (key: string) => void
  onRelease: (key: string) => void
}) {
  const active = useRef(false)
  const pressedAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const down = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (active.current) return
      clearTimer()
      active.current = true
      pressedAt.current = Date.now()
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
      onPress(keyName)
    },
    [keyName, onPress]
  )

  const up = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!active.current) return
      active.current = false
      const elapsed = Date.now() - pressedAt.current
      const release = () => {
        onRelease(keyName)
        timer.current = null
      }
      if (elapsed < MIN_HOLD_MS) {
        timer.current = setTimeout(release, MIN_HOLD_MS - elapsed)
      } else {
        release()
      }
    },
    [keyName, onRelease]
  )

  return (
    <button
      type="button"
      className={className}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={keyName}
    >
      {variant !== 'start' && (
        <span className="pixel-btn-art" aria-hidden="true">
          <PixelSprite sprite={BTN_RING} className="btn-ring" width={72} />
          <PixelSprite sprite={BTN_FACE} className="btn-face" width={72} />
        </span>
      )}
      <span className="pixel-btn-label">{children}</span>
    </button>
  )
}

/* Sliding d-pad: tracks the finger and switches direction without lifting. */
function PixelDpad({ dirs }: { dirs: DpadKey[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<Dir | null>(null)
  const activeRef = useRef<Dir | null>(null)
  const pointerId = useRef<number | null>(null)
  const pressedAt = useRef(0)
  const releaseTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const map = useMemo(() => {
    const m: Partial<Record<Dir, string>> = {}
    for (const d of dirs) m[d.dir] = d.key
    return m
  }, [dirs])

  const clearTimer = (key: string) => {
    const t = releaseTimers.current[key]
    if (t) {
      clearTimeout(t)
      delete releaseTimers.current[key]
    }
  }

  const press = useCallback(
    (dir: Dir) => {
      const key = map[dir]
      if (!key) return
      clearTimer(key)
      activeRef.current = dir
      setActive(dir)
      pressedAt.current = Date.now()
      dispatch('keydown', key)
    },
    [map]
  )

  const release = useCallback(
    (immediate: boolean) => {
      const dir = activeRef.current
      if (!dir) return
      const key = map[dir]
      activeRef.current = null
      setActive(null)
      if (!key) return
      if (immediate) {
        clearTimer(key)
        dispatch('keyup', key)
        return
      }
      const elapsed = Date.now() - pressedAt.current
      if (elapsed < MIN_HOLD_MS) {
        clearTimer(key)
        releaseTimers.current[key] = setTimeout(() => {
          dispatch('keyup', key)
          delete releaseTimers.current[key]
        }, MIN_HOLD_MS - elapsed)
      } else {
        dispatch('keyup', key)
      }
    },
    [map]
  )

  const pick = useCallback(
    (clientX: number, clientY: number): Dir | null => {
      const el = ref.current
      if (!el) return null
      const r = el.getBoundingClientRect()
      const dx = clientX - (r.left + r.width / 2)
      const dy = clientY - (r.top + r.height / 2)
      const dead = r.width * 0.12
      const options: Array<[Dir, number]> = []
      if (map.left && dx < -dead) options.push(['left', -dx])
      if (map.right && dx > dead) options.push(['right', dx])
      if (map.up && dy < -dead) options.push(['up', -dy])
      if (map.down && dy > dead) options.push(['down', dy])
      if (options.length === 0) return null
      options.sort((a, b) => b[1] - a[1])
      return options[0][0]
    },
    [map]
  )

  const onDown = (e: ReactPointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (pointerId.current !== null) return
    pointerId.current = e.pointerId
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    const dir = pick(e.clientX, e.clientY)
    if (dir) press(dir)
  }

  const onMove = (e: ReactPointerEvent) => {
    if (pointerId.current !== e.pointerId) return
    e.preventDefault()
    const dir = pick(e.clientX, e.clientY)
    if (dir === activeRef.current) return
    if (activeRef.current) {
      const oldKey = map[activeRef.current]
      if (oldKey) {
        const t = releaseTimers.current[oldKey]
        if (t) {
          clearTimeout(t)
          delete releaseTimers.current[oldKey]
        }
        dispatch('keyup', oldKey)
      }
    }
    if (dir) {
      press(dir)
    } else {
      activeRef.current = null
      setActive(null)
    }
  }

  const onUp = (e: ReactPointerEvent) => {
    if (pointerId.current !== e.pointerId) return
    e.preventDefault()
    e.stopPropagation()
    pointerId.current = null
    release(false)
  }

  return (
    <div
      ref={ref}
      className="pixel-dpad"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onContextMenu={(e) => e.preventDefault()}
      aria-hidden="true"
    >
      <PixelSprite sprite={DPAD_PLATE} className="dpad-plate" width={180} />
      <PixelSprite sprite={DPAD_FACE} className="dpad-face" width={180} />
      {(Object.keys(ARROWS) as Dir[]).map((dir) =>
        map[dir] ? (
          <PixelSprite
            key={dir}
            sprite={ARROWS[dir]}
            className={`dpad-arrow dpad-${dir} ${active === dir ? 'on' : ''}`}
            width={52}
          />
        ) : null
      )}
    </div>
  )
}

/* ── Analog joystick ─────────────────────────────────────────────────────────
   Pixel-styled thumbstick. Emits a normalized vector on `arcbyte:joystick`
   (dead zone + radial clamp) so games can drive movement with a real axis. */
const JOY_DEAD_ZONE = 0.18

function PixelJoystick() {
  const ref = useRef<HTMLDivElement>(null)
  const pointerId = useRef<number | null>(null)
  const [vector, setVector] = useState<JoystickVector>({ x: 0, y: 0 })

  const emit = useCallback((x: number, y: number) => {
    const next = { x, y }
    setVector(next)
    window.dispatchEvent(
      new CustomEvent<JoystickVector>('arcbyte:joystick', { detail: next })
    )
  }, [])

  const update = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const radius = rect.width * 0.3
      if (radius <= 0) return
      const dx = (clientX - (rect.left + rect.width / 2)) / radius
      const dy = (clientY - (rect.top + rect.height / 2)) / radius
      const distance = Math.hypot(dx, dy)
      if (distance < JOY_DEAD_ZONE) {
        emit(0, 0)
        return
      }
      const strength = Math.min(1, (distance - JOY_DEAD_ZONE) / (1 - JOY_DEAD_ZONE))
      emit((dx / distance) * strength, (dy / distance) * strength)
    },
    [emit]
  )

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (pointerId.current !== null) return
    pointerId.current = e.pointerId
    e.currentTarget.setPointerCapture?.(e.pointerId)
    update(e.clientX, e.clientY)
  }

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return
    e.preventDefault()
    update(e.clientX, e.clientY)
  }

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return
    e.preventDefault()
    e.stopPropagation()
    pointerId.current = null
    emit(0, 0)
  }

  useEffect(() => {
    const reset = () => {
      pointerId.current = null
      emit(0, 0)
    }
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('blur', reset)
      emit(0, 0)
    }
  }, [emit])

  const active = Math.hypot(vector.x, vector.y) > 0.01

  return (
    <div
      ref={ref}
      className={`pixel-joystick${active ? ' active' : ''}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      onContextMenu={(e) => e.preventDefault()}
      role="presentation"
    >
      <PixelSprite sprite={BTN_RING} className="joy-ring" width={180} />
      <PixelSprite sprite={BTN_FACE} className="joy-face" width={180} />
      <span className="joy-guides" aria-hidden="true">
        <span className="joy-guide joy-guide-h" />
        <span className="joy-guide joy-guide-v" />
      </span>
      <span
        className="joy-knob"
        style={{ left: `${50 + vector.x * 30}%`, top: `${50 + vector.y * 30}%` }}
        aria-hidden="true"
      >
        <PixelSprite sprite={BTN_RING} className="joy-knob-ring" width={72} />
        <PixelSprite sprite={BTN_FACE} className="joy-knob-face" width={72} />
      </span>
      <span className="joy-label" aria-hidden="true">MOVE</span>
    </div>
  )
}

export default function TouchControls({ zone }: TouchControlsProps) {
  const onPress = useCallback((key: string) => dispatch('keydown', key), [])
  const onRelease = useCallback((key: string) => dispatch('keyup', key), [])
  const dpad = useMemo(() => zone.dpad ?? [], [zone.dpad])

  return (
    <div className={`touch-controls${zone.joystick ? ' touch-controls-joystick' : ''}`} aria-hidden="true">
      {zone.joystick ? <PixelJoystick /> : dpad.length > 0 ? <PixelDpad dirs={dpad} /> : null}
      <div className="pixel-actions">
        {zone.actions?.map((a) => (
          <ActionButton
            key={`${a.variant ?? 'a'}-${a.key}`}
            keyName={a.key}
            variant={a.variant ?? 'a'}
            className={`pixel-btn pixel-${a.variant ?? 'a'}`}
            onPress={onPress}
            onRelease={onRelease}
          >
            {a.label}
          </ActionButton>
        ))}
      </div>
    </div>
  )
}
