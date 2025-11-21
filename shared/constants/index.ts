import { PublicKey } from '@solana/web3.js';
import { PumpMode, ModeConfig } from '@pump-bundler/types';

// ============================================
// Pump.fun Program IDs
// ============================================

export const PUMP_FUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
export const PUMP_FUN_GLOBAL = new PublicKey('4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf');
export const PUMP_FUN_EVENT_AUTHORITY = new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1');
export const PUMP_FUN_FEE_RECIPIENT = new PublicKey('CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM');

// ============================================
// Mode Configurations
// ============================================

export const MODE_CONFIGS: Record<PumpMode, ModeConfig> = {
  [PumpMode.CLASSIC]: {
    bondingCurveSpeed: 1.0,
    graduationThreshold: 85, // 85 SOL
    feeStructure: {
      platformFee: 100, // 1%
      creationFee: 0.02 // 0.02 SOL
    },
    maxBuyPercent: 2.0, // max 2% per transaction
    expectedGraduationTime: 3600 // ~1 hour typical
  },
  [PumpMode.MAYHEM]: {
    bondingCurveSpeed: 1.5, // 50% faster
    graduationThreshold: 85, // same threshold but reaches faster
    feeStructure: {
      platformFee: 150, // 1.5%
      creationFee: 0.03 // 0.03 SOL
    },
    maxBuyPercent: 2.5, // slightly higher max
    expectedGraduationTime: 2400 // ~40 minutes typical
  }
};

// ============================================
// Default RPC Endpoints
// ============================================

export const DEFAULT_RPC_ENDPOINTS = [
  {
    id: 'helius-1',
    name: 'Helius (Primary)',
    url: 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
    wsUrl: 'wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
    priority: 1,
    isCustom: false,
    maxRetries: 3,
    timeout: 30000,
    healthCheckInterval: 60000
  },
  {
    id: 'helius-2',
    name: 'Helius (Backup)',
    url: 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_2',
    wsUrl: 'wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY_2',
    priority: 2,
    isCustom: false,
    maxRetries: 3,
    timeout: 30000,
    healthCheckInterval: 60000
  },
  {
    id: 'quicknode',
    name: 'QuickNode',
    url: 'https://YOUR_ENDPOINT.solana-mainnet.quiknode.pro/YOUR_KEY/',
    wsUrl: 'wss://YOUR_ENDPOINT.solana-mainnet.quiknode.pro/YOUR_KEY/',
    priority: 3,
    isCustom: false,
    maxRetries: 3,
    timeout: 30000,
    healthCheckInterval: 60000
  }
];

// ============================================
// Jito Configuration
// ============================================

export const JITO_ENDPOINTS = [
  'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
  'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
  'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
  'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
  'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles'
];

export const JITO_TIP_ACCOUNTS = [
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT'
];

// ============================================
// Token Metadata Defaults
// ============================================

export const DEFAULT_TOKEN_METADATA = {
  showName: '',
  twitter: '',
  telegram: '',
  website: ''
};

// ============================================
// Bundle Strategy Defaults
// ============================================

export const DEFAULT_BUNDLE_STRATEGY = {
  walletCount: 12,
  distribution: 'random' as const,
  timing: {
    simultaneousBuys: true,
    staggered: false,
    randomize: true
  },
  antiDetection: {
    randomizeAmounts: true,
    amountVariance: 15, // 15% variance
    randomizeTimings: true,
    timingVariance: 500, // 500ms variance
    varyComputeBudget: true,
    useMultipleRPCs: false
  },
  slippageProtection: 500, // 5%
  priorityFee: 100000 // 0.0001 SOL
};

// ============================================
// Risk Management Defaults
// ============================================

export const DEFAULT_RISK_CONFIG = {
  maxSolPerBundle: 10,
  maxSolPerWallet: 1,
  requireSimulation: true,
  slippageProtection: 500, // 5%
  rugPullDetection: true,
  honeypotCheck: true,
  maxPriceImpact: 10 // 10%
};

// ============================================
// Bonding Curve Constants
// ============================================

export const BONDING_CURVE_CONSTANTS = {
  INITIAL_VIRTUAL_TOKEN_RESERVES: BigInt('1073000000000000'), // 1.073B tokens
  INITIAL_VIRTUAL_SOL_RESERVES: BigInt('30000000000'), // 30 SOL
  INITIAL_REAL_TOKEN_RESERVES: BigInt('793100000000000'), // 793.1M tokens
  TOKEN_TOTAL_SUPPLY: BigInt('1000000000000000'), // 1B tokens (with decimals)
  TOKEN_DECIMALS: 6
};

// ============================================
// Transaction Constants
// ============================================

export const TRANSACTION_CONSTANTS = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // ms
  CONFIRMATION_TIMEOUT: 60000, // ms
  COMPUTE_UNIT_LIMIT: 200000,
  COMPUTE_UNIT_PRICE: 100000, // microLamports
  MAX_TRANSACTION_SIZE: 1232 // bytes
};

// ============================================
// Monitoring Constants
// ============================================

export const MONITORING_CONSTANTS = {
  DEFAULT_CHECK_INTERVAL: 1000, // ms
  RPC_HEALTH_CHECK_INTERVAL: 60000, // ms
  PORTFOLIO_UPDATE_INTERVAL: 10000, // ms
  PRICE_UPDATE_INTERVAL: 5000 // ms
};

// ============================================
// API Endpoints
// ============================================

export const API_ENDPOINTS = {
  PUMP_FUN_API: 'https://frontend-api.pump.fun',
  PUMP_FUN_IPFS: 'https://ipfs.io/ipfs',
  PUMP_FUN_UPLOAD: 'https://pump.fun/api/ipfs'
};

// ============================================
// Distribution Patterns
// ============================================

export const DISTRIBUTION_PATTERNS = {
  fibonacci: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144],
  whale: [50, 20, 10, 5, 5, 3, 2, 2, 1, 1, 0.5, 0.5], // percentages
  pyramid: [25, 20, 15, 12, 10, 8, 5, 3, 1, 0.5, 0.3, 0.2]
};

// ============================================
// Color Schemes (for CLI)
// ============================================

export const COLOR_SCHEME = {
  primary: '#00ff88',
  secondary: '#00aaff',
  success: '#00ff00',
  error: '#ff0000',
  warning: '#ffaa00',
  info: '#00aaff',
  muted: '#666666',
  classic: '#4a9eff',
  mayhem: '#ff4a4a'
};
