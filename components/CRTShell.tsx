'use client'

type CRTShellProps = {
  children: React.ReactNode
  view?: string
}

export default function CRTShell({ children, view }: CRTShellProps) {
  return (
    <div className="bezel">
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
