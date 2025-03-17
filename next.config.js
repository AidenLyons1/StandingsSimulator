/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Only apply GitHub Pages settings when not on Vercel
  ...(isProduction && !isVercel && {
    output: 'export',
    basePath: '/StandingsSimulator',
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
  }),
  // For Vercel deployment, don't use basePath
  ...(isProduction && isVercel && {
    images: {
      domains: ['www.sofascore.com'],
    },
  }),
  // Rewrites don't work with static export, but we'll keep this
  // for development mode
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/sofascore/:path*',
          destination: 'https://www.sofascore.com/:path*',
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig 