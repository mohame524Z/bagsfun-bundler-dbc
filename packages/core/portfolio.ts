import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import {
  TokenHolding,
  WalletHolding,
  PortfolioStats,
  TokenStats,
  PumpMode
} from '@pump-bundler/types';
import { PumpFunClient } from './pump-fun';
import { createLogger, formatSOL } from '@pump-bundler/utils';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const logger = createLogger('Portfolio');

export interface BuyRecord {
  walletAddress: string;
  tokenAddress: string;
  amount: number; // tokens
  solSpent: number;
  pricePerToken: number;
  timestamp: Date;
  signature: string;
}

export interface SellRecord {
  walletAddress: string;
  tokenAddress: string;
  amount: number; // tokens
  solReceived: number;
  pricePerToken: number;
  timestamp: Date;
  signature: string;
  profitLoss: number;
}

export class PortfolioTracker {
  private connection: Connection;
  private pumpClient: PumpFunClient;
  private buyRecords: Map<string, BuyRecord[]> = new Map(); // tokenAddress -> records
  private sellRecords: Map<string, SellRecord[]> = new Map();
  private wallets: Keypair[] = [];

  constructor(connection: Connection, mode: PumpMode) {
    this.connection = connection;
    this.pumpClient = new PumpFunClient(connection, mode);
  }

  // ============================================
  // Wallet Management
  // ============================================

  addWallets(wallets: Keypair[]): void {
    this.wallets.push(...wallets);
    logger.info(`Added ${wallets.length} wallets to tracker`);
  }

  // ============================================
  // Buy Tracking
  // ============================================

  recordBuy(record: BuyRecord): void {
    const tokenRecords = this.buyRecords.get(record.tokenAddress) || [];
    tokenRecords.push(record);
    this.buyRecords.set(record.tokenAddress, tokenRecords);

    logger.info(`Recorded buy: ${formatSOL(record.solSpent * LAMPORTS_PER_SOL)} SOL for ${record.amount} tokens`);
  }

  // ============================================
  // Sell Tracking
  // ============================================

  recordSell(record: SellRecord): void {
    const tokenRecords = this.sellRecords.get(record.tokenAddress) || [];
    tokenRecords.push(record);
    this.sellRecords.set(record.tokenAddress, tokenRecords);

    const pnlEmoji = record.profitLoss >= 0 ? '📈' : '📉';
    logger.info(`${pnlEmoji} Recorded sell: ${formatSOL(record.solReceived * LAMPORTS_PER_SOL)} SOL, PnL: ${formatSOL(record.profitLoss * LAMPORTS_PER_SOL)} SOL`);
  }

  // ============================================
  // Portfolio Analysis
  // ============================================

  async getPortfolio(): Promise<PortfolioStats> {
    logger.info('Calculating portfolio stats...');

    const holdings: TokenHolding[] = [];
    let totalInvested = 0;
    let currentValue = 0;
    let realizedPnL = 0;

    // Get all unique tokens
    const tokenAddresses = new Set([
      ...Array.from(this.buyRecords.keys()),
      ...Array.from(this.sellRecords.keys())
    ]);

    for (const tokenAddress of tokenAddresses) {
      const holding = await this.getTokenHolding(tokenAddress);
      if (holding) {
        holdings.push(holding);
        totalInvested += holding.totalAmount * holding.averagePrice;
        currentValue += holding.currentValue;
      }
    }

    // Calculate realized PnL from sells
    for (const [_, sells] of this.sellRecords) {
      realizedPnL += sells.reduce((sum, sell) => sum + sell.profitLoss, 0);
    }

    const unrealizedPnL = currentValue - totalInvested;

    return {
      totalInvested,
      currentValue,
      unrealizedPnL,
      realizedPnL,
      tokens: holdings,
      successfulTrades: this.buyRecords.size,
      failedTrades: 0
    };
  }

  private async getTokenHolding(tokenAddress: string): Promise<TokenHolding | null> {
    try {
      const mintPubkey = new PublicKey(tokenAddress);

      // Get wallet holdings
      const walletHoldings: WalletHolding[] = [];
      let totalAmount = 0;

      for (const wallet of this.wallets) {
        try {
          const ata = await getAssociatedTokenAddress(mintPubkey, wallet.publicKey);
          const account = await getAccount(this.connection, ata);

          if (Number(account.amount) > 0) {
            // Find buy records for this wallet
            const buys = (this.buyRecords.get(tokenAddress) || [])
              .filter(b => b.walletAddress === wallet.publicKey.toBase58());

            const avgBuyPrice = buys.length > 0
              ? buys.reduce((sum, b) => sum + b.pricePerToken, 0) / buys.length
              : 0;

            const firstBuy = buys.length > 0 ? buys[0] : null;

            walletHoldings.push({
              walletAddress: wallet.publicKey.toBase58(),
              amount: Number(account.amount),
              buyPrice: avgBuyPrice,
              buyTimestamp: firstBuy?.timestamp || new Date()
            });

            totalAmount += Number(account.amount);
          }
        } catch (error) {
          // Wallet doesn't have this token, skip
        }
      }

      if (totalAmount === 0) return null;

      // Get token stats
      const tokenStats = await this.getTokenStats(tokenAddress);
      if (!tokenStats) return null;

      // Calculate average price from buys
      const allBuys = this.buyRecords.get(tokenAddress) || [];
      const totalSolSpent = allBuys.reduce((sum, b) => sum + b.solSpent, 0);
      const totalTokensBought = allBuys.reduce((sum, b) => sum + b.amount, 0);
      const averagePrice = totalTokensBought > 0 ? totalSolSpent / totalTokensBought : 0;

      // Current value
      const currentValue = totalAmount * tokenStats.currentPrice;

      // Unrealized PnL
      const costBasis = totalAmount * averagePrice;
      const unrealizedPnL = currentValue - costBasis;

      return {
        tokenAddress,
        tokenStats,
        wallets: walletHoldings,
        totalAmount,
        averagePrice,
        currentValue,
        unrealizedPnL
      };
    } catch (error) {
      logger.error(`Failed to get holdings for ${tokenAddress}:`, error);
      return null;
    }
  }

  private async getTokenStats(tokenAddress: string): Promise<TokenStats | null> {
    try {
      const token = await this.pumpClient.getTokenInfo(new PublicKey(tokenAddress));
      if (!token) return null;

      // Calculate current price and stats
      // This would come from pump.fun API or bonding curve calculation
      return {
        address: tokenAddress,
        name: token.name,
        symbol: token.symbol,
        mode: token.mode,
        currentPrice: 0.0001, // Would get from bonding curve
        marketCap: 0,
        volume24h: 0,
        holders: 0,
        bondingCurveProgress: 0,
        graduated: false
      };
    } catch (error) {
      return null;
    }
  }

  // ============================================
  // Real-time Monitoring
  // ============================================

  async getNewBuysPercentage(tokenAddress: string, timeframeMinutes: number = 5): Promise<number> {
    try {
      const token = await this.pumpClient.getTokenInfo(new PublicKey(tokenAddress));
      if (!token) return 0;

      // This would track new buys from pump.fun events
      // For now, return mock data
      return Math.random() * 10; // 0-10% new buys
    } catch (error) {
      return 0;
    }
  }

  async getCurrentPnL(tokenAddress: string): Promise<{
    totalInvested: number;
    currentValue: number;
    unrealizedPnL: number;
    realizedPnL: number;
    pnlPercentage: number;
  }> {
    const holding = await this.getTokenHolding(tokenAddress);

    if (!holding) {
      return {
        totalInvested: 0,
        currentValue: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        pnlPercentage: 0
      };
    }

    const totalInvested = holding.totalAmount * holding.averagePrice;
    const currentValue = holding.currentValue;
    const unrealizedPnL = holding.unrealizedPnL;

    // Get realized PnL from sells
    const sells = this.sellRecords.get(tokenAddress) || [];
    const realizedPnL = sells.reduce((sum, sell) => sum + sell.profitLoss, 0);

    const pnlPercentage = totalInvested > 0
      ? ((unrealizedPnL + realizedPnL) / totalInvested) * 100
      : 0;

    return {
      totalInvested,
      currentValue,
      unrealizedPnL,
      realizedPnL,
      pnlPercentage
    };
  }

  // ============================================
  // Holdings Summary
  // ============================================

  async getHoldingsSummary(): Promise<{
    totalWallets: number;
    walletsWithTokens: number;
    totalTokens: number;
    totalValueSOL: number;
    averageHoldingPerWallet: number;
  }> {
    const portfolio = await this.getPortfolio();

    const totalWallets = this.wallets.length;
    const walletsWithTokens = new Set(
      portfolio.tokens.flatMap(t => t.wallets.map(w => w.walletAddress))
    ).size;

    const totalTokens = portfolio.tokens.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalValueSOL = portfolio.currentValue;
    const averageHoldingPerWallet = walletsWithTokens > 0
      ? totalValueSOL / walletsWithTokens
      : 0;

    return {
      totalWallets,
      walletsWithTokens,
      totalTokens,
      totalValueSOL,
      averageHoldingPerWallet
    };
  }

  // ============================================
  // Statistics
  // ============================================

  getStats() {
    return {
      totalBuys: Array.from(this.buyRecords.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalSells: Array.from(this.sellRecords.values()).reduce((sum, arr) => sum + arr.length, 0),
      uniqueTokens: new Set([
        ...this.buyRecords.keys(),
        ...this.sellRecords.keys()
      ]).size,
      walletsTracked: this.wallets.length
    };
  }
}
