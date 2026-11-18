'use client'

import { useTouchGuard } from '@/lib/touchGuard'

type CRTShellProps = {
  children: React.ReactNode
  view?: string
}

const GAME_VIEWS = new Set(['space-invaders', 'tetris', 'pac-man', 'doom'])

export default function CRTShell({ children, view }: CRTShellProps) {
  const guardRef = useTouchGuard<HTMLDivElement>(view ? GAME_VIEWS.has(view) : false)

  return (
    <div className="bezel">
      <div className="screen-outer">
        <div className="screen-inner crt-flicker">
          <div className="scanlines" />
          <div className="vignette" />
          <div ref={guardRef} className="content" data-view={view}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
