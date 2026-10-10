'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PROJECTS, CATEGORIES, type ProjectCategory } from '@/lib/data/projects'
import { useNav } from '@/lib/NavigationProvider'

interface ProjectsSectionProps {
  onBack: () => void
  onSelectProject: (slug: string) => void
}

const ALL_TABS: (ProjectCategory | 'All')[] = ['All', ...CATEGORIES]

export default function ProjectsSection({ onBack, onSelectProject }: ProjectsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | 'All'>('All')
  const nav = useNav()

  const filtered = useMemo(
    () => activeCategory === 'All' ? PROJECTS : PROJECTS.filter(p => p.category === activeCategory),
    [activeCategory]
  )

  const totalItems = filtered.length

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); nav.move(-1, 0, 3, totalItems) }
    else if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); nav.move(1, 0, 3, totalItems) }
    else if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); nav.move(0, -1, 3, totalItems) }
    else if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); nav.move(0, 1, 3, totalItems) }
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      const project = filtered[nav.focused]
      if (project) onSelectProject(project.slug)
    }
    else if (e.key === 'Escape' || e.key === 'Backspace') {
      e.preventDefault()
      onBack()
    }
    else if (e.key === 'Tab') {
      e.preventDefault()
      const currentIdx = ALL_TABS.indexOf(activeCategory)
      const nextIdx = e.shiftKey
        ? (currentIdx - 1 + ALL_TABS.length) % ALL_TABS.length
        : (currentIdx + 1) % ALL_TABS.length
      setActiveCategory(ALL_TABS[nextIdx])
      nav.setFocused(0)
    }
  }, [nav, totalItems, filtered, onSelectProject, onBack, activeCategory])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">╔══ PROJECTS ══╗</div>
        <div className="section-divider">╚{'═'.repeat(46)}╝</div>
      </div>

      <div className="projects-tabs">
        {ALL_TABS.map(cat => {
          const count = cat === 'All' ? PROJECTS.length : PROJECTS.filter(p => p.category === cat).length
          const isActive = activeCategory === cat
          return (
            <div
              key={cat}
              className={`projects-tab ${isActive ? 'active' : ''}`}
              onClick={() => { setActiveCategory(cat); nav.setFocused(0) }}
            >
              {cat} ({count})
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 11, color: 'var(--arcbyte-green-dim)', marginBottom: 8 }}>
        TAB: switch category &middot; ←→↑↓: navigate &middot; SPACE: open &middot; ESC: back
      </div>

      <div className="projects-grid">
        {filtered.map((project, i) => (
          <div
            key={project.slug}
            className={`project-card ${nav.focused === i ? 'focused' : ''}`}
            onClick={() => onSelectProject(project.slug)}
            onMouseEnter={() => nav.setFocused(i)}
          >
            <div className="project-card-name">{'> '}{project.name}</div>
            <div className="project-card-desc">{project.description}</div>
            <div className="project-card-tech">{project.tech.join(' / ')}</div>
            {!project.github && (
              <div className="project-lock">
                <pre className="project-lock-icon">{`        '.. 'c@$$$$$$$$$n' ' ...
      .'"@@@@L{)1111111{Q@@@B^'
       ^YUYXXzQwwwqwqwqqwQXYXYUY\`.
       ^%%1{jnJZZZZZZZZZOUnj{)B8^.
     ^%%{}d@x'        'u@p}(B8\` ...\`
]$%111}dBr''..    ' c@p[){1@$].'
]$%)($@{.. .'.       .1$@)(B@?
?$%))$@{'..'..       .1$@)(B$?
]$%))$@{.'...'       .)$@))B@?
.  ]$%)($@{...'..       .1$@)(%$?
...'.']@%1{@$\`.'...''.'.'.'1$B{)%$]..' .
. QB$$@$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$@BC'
..QBC??_+~~~~~~~~~~~~~+~~~~~+~+~~~~~+UBC
.LBL]?______________________++>iii~+CBL ..
. L@C]]+_++_+_+_++_+_+_+_+_+__+~~>i++CBC .'
.LBL]?__________-}}}}{}-__+_+_++>i++JBL ..
..LBL][[[_-______j@@@@@@f__+____+>i+~JBC .'
. L@C][[[________j@@@@@$f____+_++_+++JBL ..
. LBC][][+_______j@$@$B$f________+__+JBL .'
.LBL][][?]____+_-{{BB}{?_____+_+_+++JBC ..
. L@C][][]]____+___?%8______+___+__++JBL .'
.LBC][][]-____+__?%%_+__+____+_+_++JBC ..
..LBL]][[][[]-_+_+_?%8__________+_+_+JBL .'
. L@C][][][][-__+___++___+__+__+__+_~JBC ..
..LBL][][][[][]?_____________________JBL .'
''LBWbbbbkbkbkbbdbddbdddbdbdbdbbbbbbdMBC'..
..Xkhkhhhhahhhhahhhhhahhhhhhhhhhhhhhkahv .'`}</pre>
                <div className="project-lock-msg">
                  <strong>[LOCKED]</strong> in construction
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="back-link" onClick={onBack}>{'< cd /back  [ESC]'}</div>
    </div>
  )
}
