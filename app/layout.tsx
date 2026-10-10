import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ArcByte OS',
  description: 'ArcByte OS — Portfolio of Willy. Systems, emulation, and cosmos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}