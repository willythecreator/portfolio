'use client'

import { useFrame } from '@/lib/FrameTicker'

type CRTShellProps = {
  children: React.ReactNode
  view?: string
}

export default function CRTShell({ children, view }: CRTShellProps) {
  const frame = useFrame()
  const ledOpacity = 0.4 + 0.6 * Math.abs(Math.sin(frame * Math.PI / 45))

  return (
    <div className="bezel">
      <div className="power-led" style={{ opacity: ledOpacity }} />
      <div className="screen-outer">
        <div className="screen-inner crt-flicker">
          <div className="scanlines" />
          <div className="vignette" />
          <div className="content" data-view={view}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
