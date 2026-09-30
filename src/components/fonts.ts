import { Space_Grotesk, Unbounded } from 'next/font/google'

// Type pairing borrowed from dungyov.com for the floating typography in the skills and achievements scenes
export const display = Unbounded({ subsets: ['latin'], weight: ['400', '700', '900'] })
export const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400'] })
