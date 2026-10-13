'use client'

import { useEffect, useCallback } from 'react'
import { ABOUT } from '@/lib/data/about'
import { useSpin } from '@/lib/FrameTicker'

interface AboutSectionProps {
  onBack: () => void
}

export default function AboutSection({ onBack }: AboutSectionProps) {
  const spinChar = useSpin(10)

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'ArrowLeft') {
      e.preventDefault()
      onBack()
    }
  }, [onBack])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const Prompt = ({ cmd }: { cmd: string }) => (
    <div>
      <span className="about-prompt">willy@arcbyte-os:~$ </span>
      <span className="about-cmd">{cmd}</span>
      <span style={{ color: 'var(--arcbyte-green)' }}>{spinChar}</span>
    </div>
  )

  return (
    <div className="section about">
      <div className="section-header">
        <div className="section-title">╔══ ABOUT ══╗</div>
        <div className="section-divider">╚{'═'.repeat(46)}╝</div>
      </div>

      <div className="about-block">
        <Prompt cmd="cat about.txt" />
        <br />
        <div><span className="about-label">Name:</span> <span className="about-value">{ABOUT.name}</span></div>
        <div><span className="about-label">Handle:</span> <span className="about-value">@{ABOUT.handle}</span></div>
        <div><span className="about-label">Location:</span> <span className="about-value">{ABOUT.location}</span></div>
        <div><span className="about-label">Focus:</span> <span className="about-value">{ABOUT.tagline}</span></div>
      </div>

      <div className="about-block">
        <Prompt cmd="cat skills.txt" />
        <br />
        <div><span className="about-label">Stack:</span> <span className="about-value">{ABOUT.stack.join(', ')}</span></div>
        <div><span className="about-label">Focus:</span></div>
        {ABOUT.focus.map((f, i) => (
          <div key={i}>  <span className="about-value">{'>'} {f}</span></div>
        ))}
        <div><span className="about-label">Learning:</span> <span className="about-value">{ABOUT.learning.join(', ')}</span></div>
      </div>

      <div className="about-block">
        <Prompt cmd="cat bio.txt" />
        <br />
        {ABOUT.bio.map((line, i) => (
          <div key={i}><span className="about-value">{line}</span></div>
        ))}
      </div>

      <div className="about-block">
        <Prompt cmd="cat stats.txt" />
        <br />
        <div><span className="about-label">Repos:</span> <span className="about-value">{ABOUT.stats.repos}</span></div>
        <div><span className="about-label">Stars:</span> <span className="about-value">{ABOUT.stats.stars}</span></div>
        <div><span className="about-label">Followers:</span> <span className="about-value">{ABOUT.stats.followers}</span></div>
      </div>

      <div className="about-philosophy">
        <span style={{ color: 'var(--arcbyte-green-dim)' }}>{'// '}</span>
        {ABOUT.philosophy}
      </div>

      <div className="back-link" role="button" tabIndex={0} onClick={onBack} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBack() } }}>{'< cd /back  [ESC]'}</div>
    </div>
  )
}
