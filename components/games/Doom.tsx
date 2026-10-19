'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Script from 'next/script'
import TouchControls from './TouchControls'

interface DoomProps {
  onBack: () => void
}

interface DosProps {
  stop: () => Promise<void>
}

type DosFn = (element: HTMLElement, options: Record<string, unknown>) => DosProps

declare global {
  interface Window {
    Dos?: DosFn
  }
}

type Status = 'loading' | 'ready' | 'error'

const COLS = 320
const ROWS = 108
const RAMP = ' .,:;-=+*oxXO#%&@'
const GAMMA = 0.85

const LUT = new Uint8Array(256)
for (let i = 0; i < 256; i++) {
  LUT[i] = Math.round(Math.pow(i / 255, GAMMA) * (RAMP.length - 1))
}

export default function Doom({ onBack }: DoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const asciiRef = useRef<HTMLPreElement>(null)
  const fieldRef = useRef<HTMLCanvasElement>(null)
  const dosRef = useRef<DosProps | null>(null)
  const startedRef = useRef(false)
  const [status, setStatus] = useState<Status>('loading')
  const [isMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches
  )

  const startDos = useCallback(() => {
    if (startedRef.current) return
    const el = containerRef.current
    if (!window.Dos || !el) return
    startedRef.current = true
    dosRef.current = window.Dos(el, {
      url: '/doom.jsdos',
      pathPrefix: '/jados/',
      theme: 'black',
      backend: 'dosbox',
      autoStart: true,
      countDownStart: 0,
      kiosk: true,
      thinSidebar: true,
      noCloud: true,
      mouseCapture: false,
      noCursor: true,
      renderBackend: 'canvas',
      renderAspect: '16/10',
      fsChanges: { local: false },
      clickToStart: true,
      mobileControls: true,
    })
    setStatus('ready')
  }, [])

  const startAscii = useCallback(() => {
    const el = containerRef.current
    const pre = asciiRef.current
    const field = fieldRef.current
    if (!el || !pre || !field) return

    field.width = COLS
    field.height = ROWS
    const fctx = field.getContext('2d')
    if (!fctx) return
    const image = fctx.createImageData(COLS, ROWS)
    const fd = image.data

    const off = document.createElement('canvas')
    off.width = COLS
    off.height = ROWS
    const octx = off.getContext('2d', { willReadFrequently: true })
    if (!octx) return

    let raf = 0
    let last = 0
    let canvas: HTMLCanvasElement | null = null

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (now - last < 33) return
      last = now

      if (!canvas || !canvas.isConnected) {
        canvas = el.querySelector('canvas')
      }
      if (!canvas || canvas.width === 0 || canvas.height === 0) return

      try {
        octx.drawImage(canvas, 0, 0, COLS, ROWS)
        const { data } = octx.getImageData(0, 0, COLS, ROWS)
        const rows = new Array<string>(ROWS)
        for (let y = 0; y < ROWS; y++) {
          const chars = new Array<string>(COLS)
          for (let x = 0; x < COLS; x++) {
            const i = (y * COLS + x) * 4
            const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
            const lev = LUT[lum | 0]
            chars[x] = RAMP[lev]
            const f = lev / (RAMP.length - 1)
            fd[i] = 10 + 41 * f
            fd[i + 1] = 60 + 195 * f
            fd[i + 2] = 25 + 77 * f
            fd[i + 3] = 255
          }
          rows[y] = chars.join('')
        }
        pre.textContent = rows.join('\n')
        fctx.putImageData(image, 0, 0)
      } catch {
        canvas = null
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/jados/js-dos.css'
    document.head.appendChild(link)
    return () => { link.remove() }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (window.Dos) { window.clearInterval(id); startDos() }
    }, 100)
    return () => window.clearInterval(id)
  }, [startDos])

  useEffect(() => {
    if (status !== 'ready' || isMobile) return
    return startAscii()
  }, [status, startAscii, isMobile])

  useEffect(() => {
    return () => {
      dosRef.current?.stop().catch(() => {})
      dosRef.current = null
      startedRef.current = false
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault()
        onBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack])

  return (
    <div className={`doom ${isMobile ? 'doom--mobile' : ''}`}>
      <Script
        src="/jados/js-dos.js"
        strategy="afterInteractive"
        onLoad={startDos}
        onError={() => setStatus('error')}
      />
      <div className="doom-screen">
        <div ref={containerRef} className="doom-player" />
        <pre ref={asciiRef} className="doom-ascii" aria-hidden="true" />
        <canvas ref={fieldRef} className="doom-field" aria-hidden="true" />
      </div>
      {status !== 'ready' && (
        <div className="doom-status">
          {status === 'loading'
            ? 'LOADING JS-DOS... espera unos segundos'
            : 'ERROR: no se pudo cargar js-dos local (/jados/). Revisa public/jados.'}
        </div>
      )}
      <div className="doom-controls">
        ARROWS: move &middot; CTRL: fire &middot; SPACE: open/use &middot; SHIFT: run
      </div>
      <TouchControls
        zone={{
          dirs: [
            { key: 'ArrowUp', label: '\u25b2', className: 'touch-up' },
            { key: 'ArrowLeft', label: '\u25c0', className: 'touch-left' },
            { key: 'ArrowDown', label: '\u25bc', className: 'touch-down' },
            { key: 'ArrowRight', label: '\u25b6', className: 'touch-right' },
          ],
          actions: [
            { key: 'Control', label: 'FIRE', className: 'touch-primary' },
            { key: ' ', label: 'USE', className: 'touch-secondary' },
            { key: 'Shift', label: 'RUN', className: 'touch-secondary' },
          ],
        }}
      />
      <div className="back-link" role="button" tabIndex={0} onClick={onBack} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBack() } }}>{'< cd /back  [BKSP]'}</div>
    </div>
  )
}
