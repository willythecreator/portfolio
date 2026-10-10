'use client'

import { useEffect, useMemo, useState } from 'react'
import { useFrame } from '@/lib/FrameTicker'

type EyePos = { row: number; col: number }

type ScanSequenceProps = {
  art: string[]
  artFrames?: string[][]
  onComplete: () => void
  welcomeText?: string
  subText?: string
  eyeL?: EyePos
  eyeR?: EyePos
}

function randomNoise(length: number) {
  const chars = '.:*+'
  let s = ''
  for (let i = 0; i < length; i++) {
    s += Math.random() < 0.08 ? chars[Math.floor(Math.random() * chars.length)] : ' '
  }
  return s
}

export default function ScanSequence({
  art,
  artFrames,
  onComplete,
  welcomeText = 'WELCOME',
  subText = 'ACCESS GRANTED',
  eyeL,
  eyeR,
}: ScanSequenceProps) {
  const frame = useFrame()
  const currentArt = artFrames
    ? artFrames[frame % artFrames.length]
    : art
  const ROWS = currentArt.length
  const COLS = currentArt[0]?.length ?? 0

  const [phase, setPhase] = useState<'scan' | 'holdEyes' | 'glitch'>('scan')
  const [scanRow, setScanRow] = useState(0)
  const [noiseRows, setNoiseRows] = useState<string[]>(() =>
    Array.from({ length: ROWS }, () => randomNoise(COLS))
  )
  const [eyePulse, setEyePulse] = useState(false)
  const [revealCount, setRevealCount] = useState(0)
  const [glitchTick, setGlitchTick] = useState(0)

  useEffect(() => {
    if (phase !== 'scan') return
    const id = setInterval(() => {
      setScanRow((r) => {
        const next = r + 1
        if (next >= ROWS) {
          clearInterval(id)
          setPhase('holdEyes')
        }
        return next
      })
      setNoiseRows((rows) => rows.map(() => randomNoise(COLS)))
    }, 45)
    return () => clearInterval(id)
  }, [phase, ROWS, COLS])

  useEffect(() => {
    if (phase !== 'holdEyes') return
    let count = 0
    const id = setInterval(() => {
      setEyePulse((p) => !p)
      count++
      if (count >= 5) {
        clearInterval(id)
        setPhase('glitch')
      }
    }, 150)
    return () => clearInterval(id)
  }, [phase])

  const fullText = welcomeText
  useEffect(() => {
    if (phase !== 'glitch') return
    const id = setInterval(() => {
      setGlitchTick((t) => t + 1)
      setRevealCount((c) => (c >= fullText.length ? c : c + 1))
    }, 45)
    return () => clearInterval(id)
  }, [phase, fullText.length])

  useEffect(() => {
    if (phase !== 'glitch') return
    if (revealCount >= fullText.length) {
      const t = setTimeout(onComplete, 700)
      return () => clearTimeout(t)
    }
  }, [phase, revealCount, fullText.length, onComplete])

  const glitchChars = '!<>-_\\/[]{}=+*^?#'
  const displayText = useMemo(() => {
    if (phase !== 'glitch') return ''
    let out = ''
    for (let i = 0; i < fullText.length; i++) {
      if (i < revealCount) {
        out +=
          Math.random() < 0.04
            ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
            : fullText[i]
      } else {
        out += fullText[i] === ' ' ? ' ' : glitchChars[Math.floor(Math.random() * glitchChars.length)]
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, revealCount, glitchTick, fullText])

  if (phase === 'glitch') {
    return (
      <div className="scan-outer">
        <div className="scan-glitch-wrap">
          <div className="scan-glitch-sub">{subText}</div>
          <div className="scan-glitch-text">{displayText}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="scan-outer">
      <div className="scan-grid">
        {currentArt.map((rowStr, i) => {
          if (i < scanRow) {
            return (
              <div key={i} className="scan-row scan-row-lit">
                {rowStr}
              </div>
            )
          }
          if (i === scanRow) {
            return (
              <div key={i} className="scan-row scan-row-beam">
                {'_'.repeat(COLS)}
              </div>
            )
          }
          return (
            <div key={i} className="scan-row scan-row-dim">
              {noiseRows[i]}
            </div>
          )
        })}
        {phase === 'holdEyes' && eyeL && (
          <span
            className={`scan-eye ${eyePulse ? 'scan-eye-on' : ''}`}
            style={{ top: `${eyeL.row * 11}px`, left: `${eyeL.col}ch` }}
          >
            ●
          </span>
        )}
        {phase === 'holdEyes' && eyeR && (
          <span
            className={`scan-eye ${eyePulse ? 'scan-eye-on' : ''}`}
            style={{ top: `${eyeR.row * 11}px`, left: `${eyeR.col}ch` }}
          >
            ●
          </span>
        )}
      </div>
    </div>
  )
}
