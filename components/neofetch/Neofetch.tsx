'use client'

import { useEffect, useState } from 'react'
import { arcbyteArt } from '@/lib/ascii-art/text-arcbyte'

function formatUptime(start: number) {
  const totalSec = Math.floor((Date.now() - start) / 1000)
  const days = Math.floor(totalSec / (60 * 60 * 24))
  const hours = Math.floor((totalSec % (60 * 60 * 24)) / (60 * 60))
  const mins = Math.floor((totalSec % (60 * 60)) / 60)
  const secs = totalSec % 60
  if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

export default function Neofetch() {
  const [visibleStats, setVisibleStats] = useState(0)
  const [start] = useState(() => Date.now())
  const [uptime, setUptime] = useState('0s')

  useEffect(() => {
    const interval = setInterval(() => setUptime(formatUptime(start)), 1000)
    const timers: ReturnType<typeof setTimeout>[] = []
    const labels = ['OS', 'HOST', 'SHELL', 'UPTIME', 'USER', 'STATUS']
    labels.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleStats(i + 1)
        }, i * 150)
      )
    })
    return () => {
      clearInterval(interval)
      timers.forEach(t => clearTimeout(t))
    }
  }, [start])

  const stats = [
    { label: 'OS', value: 'ArcByte OS v0.97' },
    { label: 'HOST', value: 'Sector 7 — Grid 4491' },
    { label: 'SHELL', value: 'arcbyte-sh' },
    { label: 'UPTIME', value: uptime },
    { label: 'USER', value: 'willy' },
    { label: 'STATUS', value: 'OPERATIONAL' },
  ]

  return (
    <div className="neofetch">
      <div className="neofetch-ascii">
        <pre className="ascii-art">{arcbyteArt.join('\n')}</pre>
        <div className="ascii-sub pulse-glow">-- ArcByte OS v0.97 --</div>
      </div>

      <div className="neofetch-right">
        <div className="neofetch-title">willy@arcbyte-os</div>
        <div className="neofetch-divider">{'─'.repeat(24)}</div>
        {stats.slice(0, visibleStats).map((stat, i) => (
          <div key={i} className="neofetch-stat">
            <span className="neofetch-label">{stat.label}</span>
            <span className="neofetch-sep">: </span>
            <span className="neofetch-value">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
