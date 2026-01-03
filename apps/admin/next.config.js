/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mobigen/ui', '@mobigen/api', '@mobigen/db'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3334'],
    },
  },
};

module.exports = nextConfig;
