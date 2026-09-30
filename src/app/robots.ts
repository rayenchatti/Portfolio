import type { MetadataRoute } from 'next'
import { SITE_URL } from './site'

// Served as /robots.txt — everything is public, and it points crawlers at the sitemap
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
