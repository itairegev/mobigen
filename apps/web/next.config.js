/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mobigen/ui', '@mobigen/api', '@mobigen/db'],
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
