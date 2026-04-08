import type { Metadata, Viewport } from 'next'
import { Noto_Serif_SC, Lato, DM_Mono, Libre_Baskerville } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import '@/styles/globals.css'

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
})

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-lato',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-baskerville',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: '岸信 Shore Letter',
    template: '%s · 岸信',
  },
  description: '写给陌生人，让潮水决定。Write to a stranger. Let the tide decide.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '岸信',
  },
  openGraph: {
    type: 'website',
    siteName: '岸信 Shore Letter',
    title: '岸信 Shore Letter',
    description: '写给陌生人，让潮水决定。',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a2e3b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()

  return (
    <html
      lang="zh"
      className={`${notoSerifSC.variable} ${lato.variable} ${dmMono.variable} ${libreBaskerville.variable}`}
    >
      <body className="bg-sand-100 text-deep-700 antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
