'use client'

import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

export type DpadKey = { dir: 'up' | 'down' | 'left' | 'right'; key: string }
export type ActionKey = { key: string; label: string; variant?: 'a' | 'b' | 'c' | 'start' }

export interface ControllerZone {
  dpad?: DpadKey[]
  actions?: ActionKey[]
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

const MIN_HOLD_MS = 90

function HoldButton({
  keyName,
  className,
  children,
  onPress,
  onRelease,
}: {
  keyName: string
  className: string
  children: ReactNode
  onPress: (key: string) => void
  onRelease: (key: string) => void
}) {
  const active = useRef(false)
  const pressedAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const down = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (active.current) return
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
      {children}
    </button>
  )
}

const ARROWS: Record<DpadKey['dir'], string> = {
  up: '\u25b2',
  down: '\u25bc',
  left: '\u25c0',
  right: '\u25b6',
}

export default function TouchControls({ zone }: TouchControlsProps) {
  const onPress = useCallback((key: string) => dispatch('keydown', key), [])
  const onRelease = useCallback((key: string) => dispatch('keyup', key), [])

  return (
    <div className="touch-controls" aria-hidden="true">
      <div className="nes-dpad">
        {(['up', 'left', 'right', 'down'] as const).map((dir) => {
          const entry = zone.dpad?.find((d) => d.dir === dir)
          return (
            <div key={dir} className={`dpad-slot dpad-${dir}`}>
              {entry ? (
                <HoldButton
                  keyName={entry.key}
                  className="dpad-btn"
                  onPress={onPress}
                  onRelease={onRelease}
                >
                  <span className="dpad-arrow">{ARROWS[dir]}</span>
                </HoldButton>
              ) : null}
            </div>
          )
        })}
        <div className="dpad-center" />
      </div>

      <div className="nes-actions">
        {zone.actions?.map((a) => (
          <HoldButton
            key={`${a.variant ?? 'a'}-${a.key}`}
            keyName={a.key}
            className={`nes-btn nes-${a.variant ?? 'a'} ${
              a.variant === 'start' ? 'nes-start' : ''
            }`}
            onPress={onPress}
            onRelease={onRelease}
          >
            {a.label}
          </HoldButton>
        ))}
      </div>
    </div>
  )
}
