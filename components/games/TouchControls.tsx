'use client'

import { useCallback, useRef } from 'react'

export type TouchKey = {
  key: string
  label: string
  className?: string
}

type Zone = {
  dirs?: TouchKey[]
  actions?: TouchKey[]
}

interface TouchControlsProps {
  zone: Zone
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

function TouchButton({
  k,
  onPress,
  onRelease,
}: {
  k: TouchKey
  onPress: (key: string) => void
  onRelease: (key: string) => void
}) {
  const active = useRef(false)
  const pressedAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const down = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (active.current) return
      active.current = true
      pressedAt.current = Date.now()
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
      onPress(k.key)
    },
    [k.key, onPress]
  )

  const up = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!active.current) return
      active.current = false
      const elapsed = Date.now() - pressedAt.current
      const release = () => {
        onRelease(k.key)
        timer.current = null
      }
      if (elapsed < MIN_HOLD_MS) {
        timer.current = setTimeout(release, MIN_HOLD_MS - elapsed)
      } else {
        release()
      }
    },
    [k.key, onRelease]
  )

  return (
    <button
      type="button"
      className={`touch-btn ${k.className ?? ''}`}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={k.label}
    >
      {k.label}
    </button>
  )
}

export default function TouchControls({ zone }: TouchControlsProps) {
  const onPress = useCallback((key: string) => dispatch('keydown', key), [])
  const onRelease = useCallback((key: string) => dispatch('keyup', key), [])

  return (
    <div className="touch-controls" aria-hidden="true">
      <div className="touch-pad">
        {zone.dirs?.map((k) => (
          <TouchButton key={k.key} k={k} onPress={onPress} onRelease={onRelease} />
        ))}
      </div>
      <div className="touch-actions">
        {zone.actions?.map((k) => (
          <TouchButton key={k.key} k={k} onPress={onPress} onRelease={onRelease} />
        ))}
      </div>
    </div>
  )
}
