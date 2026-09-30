import type { Metadata } from 'next'
import { Kanit } from 'next/font/google'
import './globals.css'
import ColorBends from '@/components/ColorBends'
import { PERSON_JSON_LD, SITE_URL } from './site'

const kanit = Kanit({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
})

const TITLE = 'Rayen Chatti — Software Engineering Portfolio'
const DESCRIPTION =
  'Portfolio of Rayen Chatti, a Software Engineering student specializing in Web, Mobile, AI, and Cybersecurity. Hackathon winner with 4 shipped projects.'

// The share card itself is app/opengraph-image.jpg — Next.js adds it to both tags below
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: 'Rayen Chatti', url: SITE_URL }],
  keywords: ['Rayen Chatti', 'Mohamed Rayen Chatti', 'portfolio', 'software engineering', 'ISIMa', 'Mahdia', 'web developer', 'AI', 'cybersecurity'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Rayen Chatti',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={kanit.className}>
      <body className="relative bg-[#03010A]">
        {/* Tells search engines who the page is about */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
        />
        {/* Persistent Full-Page ColorBends Background */}
        <div className="fixed inset-0 z-0 opacity-70 pointer-events-none">
          <ColorBends
            colors={['#FF3B3B', '#7A0000', '#3D0000']}
            rotation={90}
            speed={0.2}
            scale={1}
            frequency={1}
            warpStrength={1}
            mouseInfluence={1}
            parallax={0.5}
            noise={0.15}
            iterations={1}
            intensity={1.5}
            bandWidth={6}
            transparent
          />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
