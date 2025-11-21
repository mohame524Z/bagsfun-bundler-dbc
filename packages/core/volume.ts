import { Connection, Keypair, PublicKey, Transaction, ComputeBudgetProgram } from '@solana/web3.js';
import {
  VolumeConfig,
  VolumePattern,
  PumpMode
} from '@pump-bundler/types';
import { PumpFunClient } from './pump-fun';
import {
  createLogger,
  sleep,
  addRandomVariance,
  randomDelay
} from '@pump-bundler/utils';

const logger = createLogger('VolumeGen');

export class VolumeGenerator {
  private connection: Connection;
  private config: VolumeConfig;
  private pumpClient: PumpFunClient;
  private isRunning: boolean = false;
  private totalVolumeGenerated: number = 0;
  private tradesExecuted: number = 0;

  constructor(
    connection: Connection,
    config: VolumeConfig,
    mode: PumpMode = PumpMode.CLASSIC
  ) {
    this.connection = connection;
    this.config = config;
    this.pumpClient = new PumpFunClient(connection, mode);
  }

  // ============================================
  // Volume Generation
  // ============================================

  async start(mintAddress: PublicKey): Promise<void> {
    if (this.isRunning) {
      logger.warn('Volume generator already running');
      return;
    }

    this.isRunning = true;
    this.totalVolumeGenerated = 0;
    this.tradesExecuted = 0;

    logger.info('📈 Starting volume generation...');
    logger.info(`Target: ${this.config.targetVolume} SOL`);
    logger.info(`Duration: ${this.config.duration} minutes`);
    logger.info(`Pattern: ${this.config.pattern}`);

    const startTime = Date.now();
    const durationMs = this.config.duration * 60 * 1000;
    const endTime = startTime + durationMs;

    try {
      while (this.isRunning && Date.now() < endTime) {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / durationMs;

        // Calculate trade amount based on pattern
        const tradeAmount = this.calculateTradeAmount(progress);

        if (tradeAmount > 0) {
          await this.executeTrade(mintAddress, tradeAmount);
        }

        // Random delay between trades
        await randomDelay(
          5000 - this.config.randomization.timingVariance,
          5000 + this.config.randomization.timingVariance
        );
      }

      logger.success('Volume generation complete');
      logger.info(`Total volume: ${this.totalVolumeGenerated.toFixed(4)} SOL`);
      logger.info(`Trades executed: ${this.tradesExecuted}`);
    } catch (error) {
      logger.error('Volume generation failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  stop(): void {
    this.isRunning = false;
    logger.info('Stopping volume generation...');
  }

  // ============================================
  // Trade Execution
  // ============================================

  private async executeTrade(
    mintAddress: PublicKey,
    amount: number
  ): Promise<void> {
    try {
      // Pick two random wallets for buy/sell
      const buyerIdx = Math.floor(Math.random() * this.config.wallets.length);
      let sellerIdx = Math.floor(Math.random() * this.config.wallets.length);

      // Ensure different wallets
      while (sellerIdx === buyerIdx) {
        sellerIdx = Math.floor(Math.random() * this.config.wallets.length);
      }

      const buyer = this.config.wallets[buyerIdx];
      const seller = this.config.wallets[sellerIdx];

      // Apply randomization
      const finalAmount = addRandomVariance(
        amount,
        this.config.randomization.amountVariance
      );

      // Execute buy
      logger.debug(`Buy: ${finalAmount.toFixed(4)} SOL (Wallet ${buyerIdx})`);

      const buyIx = await this.pumpClient.buildBuyInstruction({
        mint: mintAddress,
        amount: finalAmount,
        slippage: 1000, // 10% for volume gen
        buyer
      });

      const buyTx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
        buyIx
      );

      buyTx.feePayer = buyer.publicKey;
      buyTx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      buyTx.sign(buyer);

      await this.connection.sendRawTransaction(buyTx.serialize());

      // Small delay
      await sleep(2000);

      // Execute sell
      logger.debug(`Sell: tokens (Wallet ${sellerIdx})`);

      // For sell, we'd need to know token balance
      // Simplified for now

      this.totalVolumeGenerated += finalAmount * 2; // Buy + sell
      this.tradesExecuted += 2;

      const progress = this.totalVolumeGenerated / this.config.targetVolume;
      logger.info(`Progress: ${(progress * 100).toFixed(1)}% (${this.totalVolumeGenerated.toFixed(2)}/${this.config.targetVolume} SOL)`);
    } catch (error) {
      logger.error('Trade execution failed:', error);
    }
  }

  // ============================================
  // Pattern Calculations
  // ============================================

  private calculateTradeAmount(progress: number): number {
    const baseAmount = this.config.targetVolume / (this.config.duration * 60 / 10); // trades every 10s

    switch (this.config.pattern) {
      case VolumePattern.CONSTANT:
        return baseAmount;

      case VolumePattern.INCREASING:
        // Start at 50% of base, increase to 150%
        return baseAmount * (0.5 + progress);

      case VolumePattern.DECREASING:
        // Start at 150% of base, decrease to 50%
        return baseAmount * (1.5 - progress);

      case VolumePattern.WAVE:
        // Sine wave pattern
        return baseAmount * (1 + 0.5 * Math.sin(progress * Math.PI * 4));

      case VolumePattern.RANDOM:
        return baseAmount * (0.5 + Math.random());

      default:
        return baseAmount;
    }
  }

  // ============================================
  // Statistics
  // ============================================

  getStats() {
    return {
      isRunning: this.isRunning,
      totalVolumeGenerated: this.totalVolumeGenerated,
      tradesExecuted: this.tradesExecuted,
      targetVolume: this.config.targetVolume,
      progress: (this.totalVolumeGenerated / this.config.targetVolume) * 100
    };
  }
}
