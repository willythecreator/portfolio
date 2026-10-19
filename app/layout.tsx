import type { Metadata, Viewport } from 'next'
import { Share_Tech_Mono } from 'next/font/google'
import './globals.css'

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-share-tech-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ArcByte OS',
  description: 'ArcByte OS — Portfolio de Willy. Sistemas, emulación y cosmos.',
  metadataBase: new URL('https://willythecreator.vercel.app'),
  openGraph: {
    title: 'ArcByte OS',
    description: 'ArcByte OS — Portfolio de Willy. Sistemas, emulación y cosmos.',
    type: 'website',
    url: 'https://willythecreator.vercel.app',
    siteName: 'ArcByte OS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArcByte OS',
    description: 'ArcByte OS — Portfolio de Willy. Sistemas, emulación y cosmos.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000a02',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={shareTechMono.variable}>
      <body className={shareTechMono.className}>{children}</body>
    </html>
  )
}