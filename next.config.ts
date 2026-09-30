import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'shrug-person-78902957.figma.site' },
      { hostname: 'motionsites.ai' },
      { hostname: 'images.higgs.ai' },
      { hostname: 'd8j0ntlcm91z4.cloudfront.net' },
    ],
  },
}

export default nextConfig
