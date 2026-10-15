'use client'
import { useState, useEffect } from 'react'
import CRTShell from '@/components/CRTShell'
import BootSequence from '@/components/BootSequence'
import ScanSequence from '@/components/ScanSequence'
import Neofetch from '@/components/neofetch/Neofetch'
import MainMenu from '@/components/menu/MainMenu'
import AboutSection from '@/components/sections/AboutSection'
import ProjectsSection from '@/components/sections/ProjectsSection'
import ProjectDetail from '@/components/sections/ProjectDetail'
import GamesSection from '@/components/sections/GamesSection'
import SpaceInvaders from '@/components/games/SpaceInvaders'
import Tetris from '@/components/games/Tetris'
import PacMan from '@/components/games/PacMan'
import Doom from '@/components/games/Doom'
import Terminal from '@/components/terminal/Terminal'
import { skullArt } from '@/lib/ascii-art/skull'
import { rotateSkullArt } from '@/lib/ascii-art/rotate-skull'
import { FrameTicker } from '@/lib/FrameTicker'
import { NavigationProvider, useNav } from '@/lib/NavigationProvider'

type ViewState =
  | { view: 'boot' }
  | { view: 'scan' }
  | { view: 'menu' }
  | { view: 'about' }
  | { view: 'projects' }
  | { view: 'project-detail'; slug: string }
  | { view: 'games' }
  | { view: 'space-invaders' }
  | { view: 'tetris' }
  | { view: 'pac-man' }
  | { view: 'doom' }
  | { view: 'terminal' }
  | { view: 'neofetch' }

function AppContent() {
  const [state, setState] = useState<ViewState>({ view: 'boot' })
  const nav = useNav()

  const navigate = (
    view: string,
    data?: unknown
  ) => {
    nav.setFocused(0)
    if (view === 'project-detail' && typeof data === 'string') {
      try {
        history.pushState({ view: 'project-detail', slug: data }, '', '#projects')
      } catch {}
      setState({ view: 'project-detail', slug: data })
    } else {
      const allowedViews: Array<ViewState['view']> = ['boot','scan','menu','about','projects','games','space-invaders','tetris','pac-man','doom','terminal','neofetch']
      if (allowedViews.includes(view as ViewState['view'])) {
        const target = view as Exclude<ViewState, { view: 'project-detail' }>['view']
        if (target === 'menu') {
          try { history.pushState({ view: 'menu' }, '', '#menu') } catch {}
        } else if (target !== 'boot' && target !== 'scan') {
          try { history.pushState({ view: target }, '', `#${target}`) } catch {}
        }
        setState({ view: target })
      }
    }
  }

  const goBack = () => {
    nav.setFocused(0)
    try { history.back() } catch {}
    setState({ view: 'menu' })
  }

  useEffect(() => {
    if (state.view === 'terminal') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [state.view])

  useEffect(() => {
    const onPopState = () => {
      nav.setFocused(0)
      setState({ view: 'menu' })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [nav])

  return (
    <main>
      <CRTShell>
        {state.view === 'boot' && (
          <BootSequence onComplete={() => setState({ view: 'scan' })} />
        )}
        {state.view === 'scan' && (
          <ScanSequence art={skullArt} artFrames={rotateSkullArt} onComplete={() => setState({ view: 'menu' })} />
        )}
        {state.view === 'menu' && (
          <MainMenu onNavigate={navigate} />
        )}
        {state.view === 'about' && (
          <AboutSection onBack={goBack} />
        )}
        {state.view === 'projects' && (
          <ProjectsSection
            onBack={goBack}
            onSelectProject={(slug) => navigate('project-detail', slug)}
          />
        )}
        {state.view === 'project-detail' && (
          <ProjectDetail slug={state.slug} onBack={() => navigate('projects')} />
        )}
        {state.view === 'games' && (
          <GamesSection
            onBack={goBack}
            onPlayGame={(id) => navigate(id)}
          />
        )}
        {state.view === 'space-invaders' && (
          <SpaceInvaders onBack={() => navigate('games')} />
        )}
        {state.view === 'tetris' && (
          <Tetris onBack={() => navigate('games')} />
        )}
        {state.view === 'pac-man' && (
          <PacMan onBack={() => navigate('games')} />
        )}
        {state.view === 'doom' && (
          <Doom onBack={() => navigate('games')} />
        )}
        {state.view === 'terminal' && (
          <Terminal onBack={goBack} />
        )}
        {state.view === 'neofetch' && (
          <>
            <Neofetch />
            <div className="back-link" role="button" tabIndex={0} onClick={goBack} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goBack() } }}>{'< cd /back  [ESC]'}</div>
          </>
        )}
      </CRTShell>
    </main>
  )
}

export default function Home() {
  return (
    <FrameTicker>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </FrameTicker>
  )
}
