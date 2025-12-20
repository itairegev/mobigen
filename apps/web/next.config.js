/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mobigen/ui', '@mobigen/api', '@mobigen/db'],
  // Only use standalone in production builds
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Add logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

console.log('[next.config.js] NODE_ENV:', process.env.NODE_ENV);
console.log('[next.config.js] CWD:', process.cwd());

module.exports = nextConfig;
