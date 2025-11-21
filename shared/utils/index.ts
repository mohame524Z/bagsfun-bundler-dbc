import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import * as fs from 'fs';
import * as path from 'path';
import { DistributionType } from '@pump-bundler/types';

// ============================================
// Wallet Utilities
// ============================================

export function generateKeypairs(count: number): Keypair[] {
  return Array.from({ length: count }, () => Keypair.generate());
}

export function loadKeypairFromString(privateKey: string): Keypair {
  try {
    const decoded = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decoded);
  } catch (error) {
    throw new Error('Invalid private key format. Expected base58 encoded string.');
  }
}

export function saveKeypairs(keypairs: Keypair[], filePath: string): void {
  const data = keypairs.map(kp => bs58.encode(kp.secretKey));
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function loadKeypairs(filePath: string): Keypair[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return data.map((key: string) => loadKeypairFromString(key));
}

// ============================================
// Distribution Calculations
// ============================================

export function calculateDistribution(
  totalAmount: number,
  walletCount: number,
  type: DistributionType,
  customDistribution?: number[]
): number[] {
  switch (type) {
    case DistributionType.EVEN:
      return Array(walletCount).fill(totalAmount / walletCount);

    case DistributionType.RANDOM:
      return generateRandomDistribution(totalAmount, walletCount);

    case DistributionType.FIBONACCI:
      return generateFibonacciDistribution(totalAmount, walletCount);

    case DistributionType.WHALE:
      return generateWhaleDistribution(totalAmount, walletCount);

    case DistributionType.CUSTOM:
      if (!customDistribution || customDistribution.length !== walletCount) {
        throw new Error('Custom distribution must match wallet count');
      }
      return normalizeDistribution(customDistribution, totalAmount);

    default:
      return Array(walletCount).fill(totalAmount / walletCount);
  }
}

function generateRandomDistribution(total: number, count: number): number[] {
  // Generate random weights
  const weights = Array.from({ length: count }, () => Math.random());
  const sum = weights.reduce((a, b) => a + b, 0);

  // Normalize to total amount
  return weights.map(w => (w / sum) * total);
}

function generateFibonacciDistribution(total: number, count: number): number[] {
  const fib = [1, 1];
  for (let i = 2; i < count; i++) {
    fib.push(fib[i - 1] + fib[i - 2]);
  }

  const sum = fib.reduce((a, b) => a + b, 0);
  return fib.map(f => (f / sum) * total);
}

function generateWhaleDistribution(total: number, count: number): number[] {
  // First wallet gets 40%, second gets 20%, rest distributed
  const distribution = [0.4, 0.2];
  const remaining = 0.4;
  const remainingWallets = count - 2;

  for (let i = 0; i < remainingWallets; i++) {
    distribution.push(remaining / remainingWallets);
  }

  return distribution.map(d => d * total);
}

function normalizeDistribution(distribution: number[], total: number): number[] {
  const sum = distribution.reduce((a, b) => a + b, 0);
  return distribution.map(d => (d / sum) * total);
}

// ============================================
// Randomization Utilities
// ============================================

export function addRandomVariance(
  value: number,
  variancePercent: number
): number {
  const variance = value * (variancePercent / 100);
  const min = value - variance;
  const max = value + variance;
  return Math.random() * (max - min) + min;
}

export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  return sleep(delay);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// Formatting Utilities
// ============================================

export function formatSOL(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatAddress(address: string, length: number = 4): string {
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString();
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// ============================================
// Validation Utilities
// ============================================

export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function isValidPrivateKey(key: string): boolean {
  try {
    const decoded = bs58.decode(key);
    return decoded.length === 64;
  } catch {
    return false;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// File System Utilities
// ============================================

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function saveJson(filePath: string, data: any): void {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function loadJson<T>(filePath: string, defaultValue: T): T {
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

// ============================================
// Math Utilities
// ============================================

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

export function calculatePriceImpact(
  amountIn: number,
  reserveIn: number,
  reserveOut: number
): number {
  // Constant product AMM formula
  const amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
  const priceImpact = (amountOut / reserveOut) * 100;
  return priceImpact;
}

// ============================================
// Retry Utilities
// ============================================

export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  backoff: boolean = true
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = backoff ? delayMs * Math.pow(2, i) : delayMs;
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

// ============================================
// Logging Utilities
// ============================================

export function createLogger(prefix: string) {
  return {
    info: (message: string, ...args: any[]) => {
      console.log(`[${prefix}] ℹ️  ${message}`, ...args);
    },
    success: (message: string, ...args: any[]) => {
      console.log(`[${prefix}] ✅ ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
      console.error(`[${prefix}] ❌ ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`[${prefix}] ⚠️  ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
      if (process.env.DEBUG === 'true') {
        console.log(`[${prefix}] 🐛 ${message}`, ...args);
      }
    }
  };
}

// ============================================
// Time Utilities
// ============================================

export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

// ============================================
// Error Handling Utilities
// ============================================

export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}
