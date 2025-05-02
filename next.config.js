/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  output: 'standalone',
  // Temporarily disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
