import type { MetadataRoute } from 'next'
import { SITE_URL } from './site'

// Served as /sitemap.xml — the site is one page, plus the two CVs so they can be found too
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/cv/Rayen-Chatti-CV-EN.pdf`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/cv/Rayen-Chatti-CV-FR.pdf`, changeFrequency: 'yearly', priority: 0.5 },
  ]
}
