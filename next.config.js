/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Only apply these settings in production/build mode
  ...(isProduction && {
    output: 'export',
    basePath: '/StandingsSimulator',
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
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