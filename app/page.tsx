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
  | { view: 'terminal' }
  | { view: 'neofetch' }

function AppContent() {
  const [state, setState] = useState<ViewState>({ view: 'boot' })
  const nav = useNav()

  const navigate = (view: string, data?: unknown) => {
    nav.setFocused(0)
    if (view === 'project-detail' && typeof data === 'string') {
      setState({ view: 'project-detail', slug: data })
    } else {
      setState({ view: view as Exclude<ViewState, { view: 'project-detail' }>['view'] })
    }
  }

  const goBack = () => {
    nav.setFocused(0)
    setState({ view: 'menu' })
  }

  useEffect(() => {
    if (state.view === 'terminal') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [state.view])

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
        {state.view === 'terminal' && (
          <Terminal onBack={goBack} />
        )}
        {state.view === 'neofetch' && (
          <>
            <Neofetch />
            <div className="back-link" onClick={goBack}>{'< cd /back  [ESC]'}</div>
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
