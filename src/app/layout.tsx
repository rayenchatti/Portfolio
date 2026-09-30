import type { Metadata } from 'next'
import { Kanit } from 'next/font/google'
import './globals.css'
import ColorBends from '@/components/ColorBends'

const kanit = Kanit({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Rayen Chatti — Software Engineering Portfolio',
  description:
    'Portfolio of Rayen Chatti, a Software Engineering student specializing in Web, Mobile, AI, and Cybersecurity. Hackathon winner with 4 shipped projects.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={kanit.className}>
      <body className="relative bg-[#03010A]">
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
