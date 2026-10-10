'use client'

import { useEffect, useState } from 'react'

type Phase = 'noise' | 'bios' | 'pause' | 'hook' | 'done'

const BIOS_LINES = [
    { text: 'ARCBYTE OS BIOS v1.04', delay: 0 },
    { text: 'COPYRIGHT (C) ARCBYTE SYSTEMS, ALL RIGHTS RESERVED', delay: 120 },
    { text: '----------------------------------------------', delay: 160 },
    { text: 'CPU: [REDACTED]               SPEED: [CLASSIFIED]', delay: 220},
    { text: 'MEMORY TEST: 640k             STATUS: OK', delay: 340 },
    { text: 'NETWORK: UNKNOWN              SIGNAL: DETECTED', delay: 620 },
    { text: '----------------------------------------------', delay: 760 },
    { text: 'INITIALIZING ARCBYTE OS...', delay: 900 },
]

const NOISE_CHARS = '!@#$%^&*░▒▓█▄▀■□▪▫◆◇○●'

function randomNoise(length: number): string {
    return Array.from({ length }, () =>
        NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)]
    ).join('')
}

type Props = {
    onComplete: () => void
}

export default function BootSequence({ onComplete }: Props) {
    const [phase, setPhase] = useState<Phase>('noise')
    const [noiseText, setNoiseText] = useState('')
    const [visibleLines, setVisibleLines] = useState<number>(0)
    const [showHook, setShowHook] = useState(false)
    const [showHook2, setShowHook2] = useState(false)

    useEffect(() => {
        if (phase === 'noise') {
            const interval = setInterval(() => {
                setNoiseText(randomNoise(80))
            }, 60)
            const timeout = setTimeout(() => {
                clearInterval(interval)
                setPhase('bios')
            }, 800)
            return () => {
                clearInterval(interval)
                clearTimeout(timeout)
            }
        }
    }, [phase])

    useEffect(() => {
        if (phase === 'bios') {
            BIOS_LINES.forEach((line, i) => {
                setTimeout(() => {
                    setVisibleLines(i + 1)
                    if (i === BIOS_LINES.length - 1) {
                        setTimeout(() => setPhase('pause'), 600)
                    }
                }, line.delay)
            })
        }
    }, [phase])

    useEffect(() => {
        if (phase === 'pause') {
            const timeout = setTimeout(() => setPhase('hook'), 1000)
            return () => clearTimeout(timeout)
        }
    }, [phase])

    useEffect(() => {
        if (phase === 'hook') {
            setTimeout(() => setShowHook(true), 200)
            setTimeout(() => setShowHook2(true), 1200)
            setTimeout(() => onComplete(), 2800)
        }
    }, [phase, onComplete])

    return (
        <div className="boot">
            {phase === 'noise' && (
                <div className="boot-noise">{noiseText}</div>
            )}

            {(phase === 'bios' || phase === 'pause' || phase === 'hook') && (
                <div className="boot-bios">
                    {BIOS_LINES.slice(0, visibleLines).map((line, i) => (
                        <div key={i} className="boot-line">{line.text}</div>
                    ))}
                </div>
            )}

            {phase === 'hook' && (
                <div className="boot-hook">
                    {showHook && (
                        <div className="boot-warning">
                            UNREGISTERED ACCESS DETECTED.
                        </div>
                    )}
                    {showHook2 && (
                        <div className="boot-warning2">
                            LOGGING SESSION.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}