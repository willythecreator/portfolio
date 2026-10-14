'use client'

import { useEffect, useCallback, useState } from 'react'
import { PROJECTS } from '@/lib/data/projects'
import { useFrame } from '@/lib/FrameTicker'

interface ProjectDetailProps {
  slug: string
  onBack: () => void
}

export default function ProjectDetail({ slug, onBack }: ProjectDetailProps) {
  const project = PROJECTS.find(p => p.slug === slug)
  const frame = useFrame()

  const [startFrame] = useState(frame)

  const hasAnimation = project?.asciiArtFrames && project.asciiArtFrames.length > 0
  const currentFrame = (() => {
    if (!hasAnimation) return 0
    const frames = project!.asciiArtFrames!
    const delays = project!.asciiFrameDelays
    const n = frames.length
    if (delays && delays.length === n) {
      const total = delays.reduce((a, b) => a + b, 0)
      if (total === 0) return 0
      const elapsed = (Math.max(0, frame - startFrame) / 30) * 1000
      let t = elapsed % total
      for (let i = 0; i < n; i++) {
        t -= delays[i]
        if (t < 0) return i
      }
      return n - 1
    }
    return frame % n
  })()

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

  if (!project) {
    return (
      <div className="section">
        <div className="section-title">PROJECT NOT FOUND</div>
      <div className="back-link" role="button" tabIndex={0} onClick={onBack} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBack() } }}>{'< cd /back  [ESC]'}</div>
      </div>
    )
  }

  const asciiContent = hasAnimation
    ? project.asciiArtFrames![currentFrame].join('\n')
    : null

  const infoPanel = (
          <div className="project-detail-info frame frame-focused" data-label="[ DETAILS ]">
      <div className="project-detail-name">{project.name}</div>
      <div className="project-detail-meta">
        Category: <span>{project.category}</span>
      </div>
      <div className="project-detail-meta">
        Tech: <span>{project.tech.join(', ')}</span>
      </div>

      <div className="project-detail-desc">
        {project.longDescription}
      </div>

      {project.github ? (
        <div className="project-detail-links">
          <a
            className="project-link"
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            [GitHub]
          </a>
        </div>
      ) : (
        <div className="project-detail-locked">
          [ LOCKED ] Repository in construction — source is private.
        </div>
      )}
    </div>
  )

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">╔══ {project.name.toUpperCase().slice(0, 40)} ══╗</div>
        <div className="section-divider">╚{'═'.repeat(46)}╝</div>
      </div>

      {hasAnimation ? (
        <div className="project-detail">
          <div className="project-detail-ascii frame frame-focused" data-label="[ VISUALIZATION ]">
            <pre className="ascii-art">{asciiContent}</pre>
          </div>
          {infoPanel}
        </div>
      ) : (
        <div className="project-detail-single">
          {infoPanel}
        </div>
      )}

      <div className="back-link" onClick={onBack}>{'< cd /back  [ESC]'}</div>
    </div>
  )
}
