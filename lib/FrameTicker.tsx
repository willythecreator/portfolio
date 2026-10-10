'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'

const FPS = 30
const FRAME_MS = 1000 / FPS

const FrameContext = createContext(0)

export function useFrame() {
  return useContext(FrameContext)
}

export function useSpin(fps: number = 10): string {
  const frame = useFrame()
  const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  return SPIN[Math.floor(frame * FPS / (fps * FPS)) % SPIN.length]
}

export function FrameTicker({ children }: { children: React.ReactNode }) {
  const [frame, setFrame] = useState(0)
  const lastRef = useRef(0)

  useEffect(() => {
    let animId: number
    const loop = (now: number) => {
      if (now - lastRef.current >= FRAME_MS) {
        lastRef.current = now
        setFrame(f => f + 1)
      }
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <FrameContext.Provider value={frame}>
      {children}
    </FrameContext.Provider>
  )
}
