'use client'

import { useEffect, useState } from 'react'
import { arcbyteArt } from '@/lib/ascii-art/text-arcbyte'

const STATS = [
  { label: 'OS',     value: 'ArcByte OS v0.97'      },
  { label: 'HOST',   value: 'Sector 7 — Grid 4491' },
  { label: 'SHELL',  value: 'arcbyte-sh'            },
  { label: 'UPTIME', value: '[REDACTED]'           },
  { label: 'USER',   value: '[UNKNOWN]'            },
  { label: 'STATUS', value: 'OPERATIONAL'          },
]

export default function Neofetch() {
  const [visibleStats, setVisibleStats] = useState(0)

  useEffect(() => {
    STATS.forEach((_, i) => {
      setTimeout(() => {
        setVisibleStats(i + 1)
      }, i * 150)
    })
  }, [])

  return (
    <div className="neofetch">
      <div className="neofetch-ascii">
        <pre className="ascii-art">{arcbyteArt.join('\n')}</pre>
        <div className="ascii-sub">-- ArcByte OS v0.97 --</div>
      </div>

      <div className="neofetch-right">
        <div className="neofetch-title">unknown@arcbyte-os</div>
        <div className="neofetch-divider">{'─'.repeat(24)}</div>
        {STATS.slice(0, visibleStats).map((stat, i) => (
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
