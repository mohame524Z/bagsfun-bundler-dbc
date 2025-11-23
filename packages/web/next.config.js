/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features for better performance (stable ones only)
  experimental: {
    optimizePackageImports: ['@solana/web3.js', 'recharts'],
  },

  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Optimize webpack for faster builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  transpilePackages: ['@pump-bundler/types', '@pump-bundler/constants', '@pump-bundler/utils', '@pump-bundler/core'],
};

module.exports = nextConfig;
