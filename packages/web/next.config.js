/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize package imports
  modularizeImports: {
    '@solana/web3.js': {
      transform: '@solana/web3.js/lib/index.esm.js',
    },
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@solana/web3.js', 'recharts'],
    turbo: {
      loaders: {},
    },
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

    // Reduce bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };

    return config;
  },

  transpilePackages: ['@pump-bundler/types', '@pump-bundler/constants', '@pump-bundler/utils', '@pump-bundler/core'],
};

module.exports = nextConfig;
