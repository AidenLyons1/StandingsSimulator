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
  // For Vercel deployment
  ...(isProduction && isVercel && {
    // Keep any Vercel-specific configuration here if needed
  }),
  // Note: We've removed the SofaScore API rewrites as they're no longer used
}

module.exports = nextConfig 