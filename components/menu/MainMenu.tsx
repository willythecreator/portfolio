'use client'

import { useEffect, useCallback } from 'react'
import { useNav } from '@/lib/NavigationProvider'
import { useSpin } from '@/lib/FrameTicker'

interface MenuItemData {
  icon: string
  title: string
  description: string
}

interface MainMenuProps {
  onNavigate: (view: string, data?: unknown) => void
}

const ITEMS: MenuItemData[] = [
  { icon: '>_ ', title: 'TERMINAL', description: 'Full interactive shell — type commands, explore the filesystem' },
  { icon: '// ', title: 'PROJECTS', description: '28 projects across 5 categories — physics, emulation, graphics' },
  { icon: '>> ', title: 'GAMES', description: 'Play minigames rendered in the CRT terminal' },
  { icon: '[] ', title: 'ABOUT', description: 'Who is behind ArcByte OS — skills, focus, philosophy' },
  { icon: ':: ', title: 'SYSTEM', description: 'Neofetch — system information and ASCII banner' },
]

const COLS = 3

const VIEW_MAP: Record<string, string> = {
  TERMINAL: 'terminal',
  PROJECTS: 'projects',
  GAMES: 'games',
  ABOUT: 'about',
  SYSTEM: 'neofetch',
}

  const BANNER = `█████╗ ██████╗  ██████╗██████╗ ██╗   ██╗████████╗███████╗
██╔══██╗██╔══██╗██╔════╝██╔══██╗╚██╗ ██╔╝╚══██╔══╝██╔════╝
███████║██████╔╝██║     ██████╔╝ ╚████╔╝    ██║   █████╗
██╔══██║██╔══██╗██║     ██╔══██╗  ╚██╔╝     ██║   ██╔══╝
██║  ██║██║  ██║╚██████╗██████╔╝   ██║      ██║   ███████╗
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═════╝    ╚═╝      ╚═╝   ╚══════╝`

export default function MainMenu({ onNavigate }: MainMenuProps) {
  const nav = useNav()
  const total = ITEMS.length
  const spinChar = useSpin(10)

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); nav.move(-1, 0, COLS, total) }
    else if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); nav.move(1, 0, COLS, total) }
    else if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); nav.move(0, -1, COLS, total) }
    else if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); nav.move(0, 1, COLS, total) }
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      const item = ITEMS[nav.focused]
      if (item) onNavigate(VIEW_MAP[item.title])
    }
  }, [nav, total, onNavigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div className="menu">
      <pre className="menu-banner pulse-glow">{BANNER}</pre>

      <div className="menu-header">
        <span style={{ color: 'var(--arcbyte-green-dim)' }}>{'╔' + '═'.repeat(50) + '╗'}</span>
        <br />
        <span>{'║ '}</span>
        <span style={{ color: 'var(--arcbyte-green-dim)' }}>{spinChar}</span>
        <span>{' ArcByte OS v0.97 '}</span>
        <span style={{ color: 'var(--arcbyte-green-dim)' }}>{spinChar}</span>
        <span>{' — ←↑↓→/WASD | SPACE/ENTER | TAP'}</span>
        <span style={{ color: 'var(--arcbyte-green-dim)' }}>{' ║'}</span>
        <br />
        <span style={{ color: 'var(--arcbyte-green-dim)' }}>{'╚' + '═'.repeat(50) + '╝'}</span>
      </div>

      <div className="menu-grid">
        {ITEMS.map((item, i) => {
          const focused = nav.focused === i
          return (
            <div
              key={item.title}
              className={`menu-item ${focused ? 'focused' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onNavigate(VIEW_MAP[item.title])}
              onMouseEnter={() => nav.setFocused(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onNavigate(VIEW_MAP[item.title])
                }
              }}
            >
              <div className="menu-item-top">
                {focused ? '┌' : '├'}{'─'.repeat(20)}{focused ? '┐' : '┤'}
              </div>
              <div className="menu-item-icon">
                {focused ? spinChar : ' '} {item.icon}
              </div>
              <div className="menu-item-title">{item.title}</div>
              <div className="menu-item-desc">{item.description}</div>
              <div className="menu-item-bottom">
                {focused ? '└' : '└'}{'─'.repeat(20)}{focused ? '┘' : '┘'}
              </div>
            </div>
          )
        })}
      </div>

      <div className="menu-hint">
        {'─'.repeat(52)}<br />
        {' '}[{nav.focused + 1}/{total}] {ITEMS[nav.focused]?.title} — SPACE to open<br />
        {'─'.repeat(52)}
      </div>
    </div>
  )
}
