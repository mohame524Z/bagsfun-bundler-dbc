/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
  transpilePackages: ['@pump-bundler/types', '@pump-bundler/constants', '@pump-bundler/utils', '@pump-bundler/core'],
};

module.exports = nextConfig;
