import { Keypair, PublicKey, Connection } from '@solana/web3.js';

// ============================================
// Pump.fun Modes
// ============================================

export enum PumpMode {
  CLASSIC = 'classic',
  MAYHEM = 'mayhem'
}

export interface ModeConfig {
  bondingCurveSpeed: number;
  graduationThreshold: number; // SOL amount to graduate to Raydium
  feeStructure: FeeConfig;
  maxBuyPercent: number;
  expectedGraduationTime: number; // seconds
}

export interface FeeConfig {
  platformFee: number; // in basis points
  creationFee: number; // in SOL
}

// ============================================
// RPC Management
// ============================================

export interface RPCEndpoint {
  id: string;
  name: string;
  url: string;
  wsUrl?: string;
  priority: number; // 1 = primary, 2 = secondary, etc.
  isCustom: boolean;
  maxRetries: number;
  timeout: number; // milliseconds
  healthCheckInterval: number; // milliseconds
}

export interface RPCHealthStatus {
  endpointId: string;
  isHealthy: boolean;
  latency: number; // milliseconds
  lastChecked: Date;
  errorCount: number;
  successRate: number; // 0-1
}

export interface RPCManagerConfig {
  endpoints: RPCEndpoint[];
  autoFailover: boolean;
  healthCheckEnabled: boolean;
  maxFailoverAttempts: number;
}

// ============================================
// Wallet & Bundle Configuration
// ============================================

export interface WalletConfig {
  mainWallet: Keypair;
  bundlerWallets: Keypair[];
  count: number;
}

export interface BundleStrategy {
  walletCount: number;
  distribution: DistributionType;
  customDistribution?: number[]; // percentages
  timing: TimingConfig;
  antiDetection: AntiDetectionConfig;
  slippageProtection: number; // in basis points
  priorityFee: number; // microLamports
}

export enum DistributionType {
  EVEN = 'even',
  RANDOM = 'random',
  FIBONACCI = 'fibonacci',
  WHALE = 'whale', // few wallets with large amounts
  CUSTOM = 'custom'
}

export interface TimingConfig {
  simultaneousBuys: boolean;
  delayRange?: [number, number]; // milliseconds [min, max]
  staggered: boolean;
  randomize: boolean;
}

export enum StealthMode {
  NONE = 'none',           // Atomic Jito (fastest, detectable)
  LIGHT = 'light',         // 2-block spread (fast, harder to detect)
  MEDIUM = 'medium',       // 3-block spread + randomization (balanced)
  AGGRESSIVE = 'aggressive' // 4-5 block spread + full stealth (slowest, undetectable)
}

export interface StealthConfig {
  mode: StealthMode;
  spreadBlocks: number;           // Number of blocks to spread across
  shuffleWallets: boolean;        // Randomize wallet order
  mixedExecution: boolean;        // Mix Jito + RPC transactions
  varyDelays: boolean;           // Random 50-500ms delays
  aggressiveVariance: boolean;   // 15-25% amount variance (vs 5-10%)
  simulatePostLaunch: boolean;   // Random activity after launch
  useAgedWallets: boolean;       // Prefer wallets with history
  multiRpcRouting: boolean;      // Different RPC per wallet
}

export interface AntiDetectionConfig {
  randomizeAmounts: boolean;
  amountVariance: number; // percentage 0-100
  randomizeTimings: boolean;
  timingVariance: number; // milliseconds
  varyComputeBudget: boolean;
  useMultipleRPCs: boolean;
  stealthConfig?: StealthConfig; // Advanced stealth options
}

// ============================================
// Token Creation
// ============================================

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string; // URL or file path
  twitter?: string;
  telegram?: string;
  website?: string;
  showName?: string;
}

export interface TokenCreationConfig {
  metadata: TokenMetadata;
  mode: PumpMode;
  initialBuy: number; // SOL amount
  bundleStrategy: BundleStrategy;
  devWallet: Keypair;
}

// ============================================
// Sniper Bot
// ============================================

export interface SnipeConfig {
  enabled: boolean;
  mode: PumpMode;
  filters: SnipeFilters;
  autoBuy: AutoBuyConfig;
  monitoring: MonitoringConfig;
}

export interface SnipeFilters {
  minLiquidity?: number;
  maxLiquidity?: number;
  devWalletWhitelist?: string[];
  devWalletBlacklist?: string[];
  keywords?: string[];
  excludeKeywords?: string[];
  minNameLength?: number;
  requireSocials?: boolean;
  requireWebsite?: boolean;
}

export interface AutoBuyConfig {
  enabled: boolean;
  amountPerWallet: number; // SOL
  maxWallets: number;
  bundleStrategy: BundleStrategy;
  maxSlippage: number;
}

export interface MonitoringConfig {
  checkInterval: number; // milliseconds
  useWebSocket: boolean;
  alertOnNewToken: boolean;
  telegramAlerts?: boolean;
  discordWebhook?: string;
}

// ============================================
// Volume Generator
// ============================================

export interface VolumeConfig {
  enabled: boolean;
  targetVolume: number; // SOL
  duration: number; // minutes
  pattern: VolumePattern;
  wallets: Keypair[];
  randomization: VolumeRandomization;
}

export enum VolumePattern {
  CONSTANT = 'constant',
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  WAVE = 'wave',
  RANDOM = 'random'
}

export interface VolumeRandomization {
  amountVariance: number; // percentage
  timingVariance: number; // percentage
  priceImpact: number; // target price impact percentage
}

// ============================================
// Sell Strategies & Modes
// ============================================

export enum SellMode {
  REGULAR = 'regular',  // Sequential 1-by-1 through RPC
  BUNDLE = 'bundle',    // Groups of 4 through RPC
  JITO = 'jito'         // Groups of 20+ through Jito
}

export interface SellConfig {
  mode: SellMode;
  sellPercentage?: number; // 0-100, undefined = sell all
  slippage: number; // basis points
  priorityFee: number; // microLamports
  jitoTipLamports?: number; // tip amount for Jito bundles
  jitoBundleSize?: number; // default 20
  delayBetweenSells?: number; // milliseconds
}

export interface SellStrategy {
  type: SellStrategyType;
  config: GradualSellConfig | TriggerSellConfig | ScheduledSellConfig;
}

export enum SellStrategyType {
  GRADUAL = 'gradual',
  TRIGGER = 'trigger',
  SCHEDULED = 'scheduled',
  IMMEDIATE = 'immediate'
}

export interface GradualSellConfig {
  duration: number; // minutes
  intervals: number; // number of sells
  percentagePerInterval: number;
  randomizeTimings: boolean;
}

export interface TriggerSellConfig {
  triggers: PriceTrigger[];
  stopLoss?: number; // percentage drop
  takeProfit?: number; // percentage gain
}

export interface PriceTrigger {
  priceTarget: number; // SOL or market cap
  sellPercentage: number; // percentage of holdings
}

export interface ScheduledSellConfig {
  schedules: SellSchedule[];
}

export interface SellSchedule {
  time: Date;
  percentage: number;
  wallets?: number[]; // indices of wallets to sell from
}

// ============================================
// Risk Management
// ============================================

export interface RiskConfig {
  maxSolPerBundle: number;
  maxSolPerWallet: number;
  requireSimulation: boolean;
  slippageProtection: number;
  rugPullDetection: boolean;
  honeypotCheck: boolean;
  maxPriceImpact: number; // percentage
}

// ============================================
// Transaction & Execution
// ============================================

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  timestamp: Date;
  confirmationTime?: number; // milliseconds
}

export interface BundleResult {
  tokenAddress: string;
  transactions: TransactionResult[];
  totalCost: number; // SOL
  successRate: number; // 0-1
  averageConfirmationTime: number; // milliseconds
}

// ============================================
// Analytics & Tracking
// ============================================

export interface TokenStats {
  address: string;
  name: string;
  symbol: string;
  mode: PumpMode;
  currentPrice: number; // SOL
  marketCap: number;
  volume24h: number;
  holders: number;
  bondingCurveProgress: number; // percentage
  graduated: boolean;
}

export interface PortfolioStats {
  totalInvested: number; // SOL
  currentValue: number; // SOL
  unrealizedPnL: number; // SOL
  realizedPnL: number; // SOL
  tokens: TokenHolding[];
  successfulTrades: number;
  failedTrades: number;
}

export interface TokenHolding {
  tokenAddress: string;
  tokenStats: TokenStats;
  wallets: WalletHolding[];
  totalAmount: number;
  averagePrice: number; // SOL per token
  currentValue: number; // SOL
  unrealizedPnL: number; // SOL
}

export interface WalletHolding {
  walletAddress: string;
  amount: number;
  buyPrice: number; // SOL per token
  buyTimestamp: Date;
}

// ============================================
// Configuration
// ============================================

export interface AppConfig {
  rpc: RPCManagerConfig;
  wallet: {
    mainWalletPrivateKey: string;
    bundlerWalletCount: number;
  };
  defaultMode: PumpMode;
  bundleStrategy: BundleStrategy;
  sniper: SnipeConfig;
  volume: VolumeConfig;
  sellStrategy: SellStrategy;
  risk: RiskConfig;
  jito: {
    enabled: boolean;
    tipAmount: number; // SOL
    endpoints: string[];
  };
}

// ============================================
// CLI/UI States
// ============================================

export interface AppState {
  mode: PumpMode;
  connected: boolean;
  activeRPC: string;
  rpcHealth: RPCHealthStatus[];
  wallet: {
    address: string;
    balance: number; // SOL
    bundlerWallets: number;
  };
  portfolio: PortfolioStats;
  activeTasks: ActiveTask[];
}

export interface ActiveTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  progress: number; // 0-100
  message: string;
  startTime: Date;
  estimatedCompletion?: Date;
}

export enum TaskType {
  TOKEN_CREATION = 'token_creation',
  BUNDLING = 'bundling',
  SNIPING = 'sniping',
  VOLUME_GEN = 'volume_generation',
  SELLING = 'selling',
  SIMULATION = 'simulation'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// ============================================
// Pump.fun Specific Types
// ============================================

export interface PumpFunToken {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  creator: string;
  bondingCurve: string;
  associatedBondingCurve: string;
  mode: PumpMode;
  createdTimestamp: number;
  twitter?: string;
  telegram?: string;
  website?: string;
}

export interface BondingCurveState {
  virtualTokenReserves: bigint;
  virtualSolReserves: bigint;
  realTokenReserves: bigint;
  realSolReserves: bigint;
  tokenTotalSupply: bigint;
  complete: boolean;
}

export interface PumpFunBuyParams {
  mint: PublicKey;
  amount: number; // SOL
  slippage: number; // basis points
  buyer: Keypair;
}

export interface PumpFunSellParams {
  mint: PublicKey;
  amount: number; // tokens or percentage
  slippage: number;
  seller: Keypair;
}
