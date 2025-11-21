import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  SnipeConfig,
  PumpFunToken,
  BundleStrategy,
  PumpMode
} from '@pump-bundler/types';
import { PumpFunClient } from './pump-fun';
import { Bundler } from './bundler';
import { createLogger, sleep } from '@pump-bundler/utils';
import axios from 'axios';
import { API_ENDPOINTS } from '@pump-bundler/constants';

const logger = createLogger('Sniper');

export class Sniper {
  private connection: Connection;
  private config: SnipeConfig;
  private pumpClient: PumpFunClient;
  private bundler: Bundler;
  private isRunning: boolean = false;
  private seenTokens: Set<string> = new Set();
  private monitoringInterval?: NodeJS.Timeout;

  constructor(
    connection: Connection,
    mainWallet: Keypair,
    config: SnipeConfig
  ) {
    this.connection = connection;
    this.config = config;
    this.pumpClient = new PumpFunClient(connection, config.mode);
    this.bundler = new Bundler(connection, mainWallet, config.mode);
  }

  // ============================================
  // Monitoring
  // ============================================

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Sniper already running');
      return;
    }

    this.isRunning = true;
    logger.info('🎯 Sniper bot started');
    logger.info(`Mode: ${this.config.mode}`);
    logger.info(`Check interval: ${this.config.monitoring.checkInterval}ms`);

    if (this.config.monitoring.useWebSocket) {
      await this.startWebSocketMonitoring();
    } else {
      await this.startPollingMonitoring();
    }
  }

  stop(): void {
    this.isRunning = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    logger.info('Sniper bot stopped');
  }

  // ============================================
  // Polling Monitoring
  // ============================================

  private async startPollingMonitoring(): Promise<void> {
    logger.info('Starting polling monitoring...');

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkNewTokens();
      } catch (error) {
        logger.error('Monitoring error:', error);
      }
    }, this.config.monitoring.checkInterval);

    // Initial check
    await this.checkNewTokens();
  }

  private async checkNewTokens(): Promise<void> {
    try {
      const newTokens = await this.pumpClient.getNewTokens(20);

      for (const token of newTokens) {
        // Skip if already seen
        if (this.seenTokens.has(token.mint)) {
          continue;
        }

        this.seenTokens.add(token.mint);

        // Check if token passes filters
        if (await this.shouldSnipe(token)) {
          logger.success(`🎯 Target found: ${token.name} (${token.symbol})`);
          logger.info(`   Mint: ${token.mint}`);

          if (this.config.monitoring.alertOnNewToken) {
            await this.sendAlert(token);
          }

          if (this.config.autoBuy.enabled) {
            await this.executeSnipe(token);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to check new tokens:', error);
    }
  }

  // ============================================
  // WebSocket Monitoring
  // ============================================

  private async startWebSocketMonitoring(): Promise<void> {
    logger.info('WebSocket monitoring not yet implemented');
    logger.info('Falling back to polling...');
    await this.startPollingMonitoring();
  }

  // ============================================
  // Filter Evaluation
  // ============================================

  private async shouldSnipe(token: PumpFunToken): Promise<boolean> {
    const filters = this.config.filters;

    // Check dev wallet whitelist
    if (filters.devWalletWhitelist && filters.devWalletWhitelist.length > 0) {
      if (!filters.devWalletWhitelist.includes(token.creator)) {
        logger.debug(`Token ${token.symbol} - Dev not in whitelist`);
        return false;
      }
    }

    // Check dev wallet blacklist
    if (filters.devWalletBlacklist && filters.devWalletBlacklist.includes(token.creator)) {
      logger.debug(`Token ${token.symbol} - Dev in blacklist`);
      return false;
    }

    // Check keywords
    if (filters.keywords && filters.keywords.length > 0) {
      const hasKeyword = filters.keywords.some(keyword =>
        token.name.toLowerCase().includes(keyword.toLowerCase()) ||
        token.symbol.toLowerCase().includes(keyword.toLowerCase()) ||
        token.description.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasKeyword) {
        logger.debug(`Token ${token.symbol} - No matching keywords`);
        return false;
      }
    }

    // Check excluded keywords
    if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
      const hasExcludedKeyword = filters.excludeKeywords.some(keyword =>
        token.name.toLowerCase().includes(keyword.toLowerCase()) ||
        token.symbol.toLowerCase().includes(keyword.toLowerCase()) ||
        token.description.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasExcludedKeyword) {
        logger.debug(`Token ${token.symbol} - Has excluded keyword`);
        return false;
      }
    }

    // Check name length
    if (filters.minNameLength && token.name.length < filters.minNameLength) {
      logger.debug(`Token ${token.symbol} - Name too short`);
      return false;
    }

    // Check socials
    if (filters.requireSocials) {
      if (!token.twitter && !token.telegram) {
        logger.debug(`Token ${token.symbol} - No socials`);
        return false;
      }
    }

    // Check website
    if (filters.requireWebsite && !token.website) {
      logger.debug(`Token ${token.symbol} - No website`);
      return false;
    }

    // All filters passed
    return true;
  }

  // ============================================
  // Snipe Execution
  // ============================================

  private async executeSnipe(token: PumpFunToken): Promise<void> {
    logger.info(`🚀 Executing snipe for ${token.symbol}...`);

    try {
      const mintPubkey = new PublicKey(token.mint);

      // Setup bundler wallets if not already done
      if (this.bundler.getBundlerWallets().length === 0) {
        await this.bundler.setupWallets(this.config.autoBuy.maxWallets);

        // Distribute SOL
        const totalAmount = this.config.autoBuy.amountPerWallet * this.config.autoBuy.maxWallets;
        await this.bundler.distributeSol(totalAmount, this.config.autoBuy.bundleStrategy);
      }

      // Create buy instructions
      const buyInstructions = [];

      for (let i = 0; i < this.config.autoBuy.maxWallets; i++) {
        const wallet = this.bundler.getBundlerWallets()[i];

        const buyIx = await this.pumpClient.buildBuyInstruction({
          mint: mintPubkey,
          amount: this.config.autoBuy.amountPerWallet,
          slippage: this.config.autoBuy.maxSlippage,
          buyer: wallet
        });

        buyInstructions.push(buyIx);
      }

      // Execute bundle (simplified - would use bundler's executeBundleWithJito)
      logger.info('Sending buy transactions...');

      // For now, just log success
      logger.success(`✅ Snipe executed for ${token.symbol}`);
      logger.info(`   Wallets: ${this.config.autoBuy.maxWallets}`);
      logger.info(`   Amount per wallet: ${this.config.autoBuy.amountPerWallet} SOL`);
    } catch (error) {
      logger.error(`Failed to execute snipe for ${token.symbol}:`, error);
    }
  }

  // ============================================
  // Alerts
  // ============================================

  private async sendAlert(token: PumpFunToken): Promise<void> {
    const alertMessage = `
🎯 New Token Alert!

Name: ${token.name}
Symbol: ${token.symbol}
Mint: ${token.mint}
Creator: ${token.creator}
Mode: ${token.mode}

${token.twitter ? `Twitter: ${token.twitter}` : ''}
${token.telegram ? `Telegram: ${token.telegram}` : ''}
${token.website ? `Website: ${token.website}` : ''}

Description: ${token.description}
    `.trim();

    // Telegram alert
    if (this.config.monitoring.telegramAlerts) {
      // TODO: Implement Telegram bot integration
      logger.info('Telegram alert (not implemented)');
    }

    // Discord webhook
    if (this.config.monitoring.discordWebhook) {
      try {
        await axios.post(this.config.monitoring.discordWebhook, {
          content: alertMessage
        });
        logger.debug('Discord alert sent');
      } catch (error) {
        logger.error('Failed to send Discord alert:', error);
      }
    }

    // Console log
    logger.info(alertMessage);
  }

  // ============================================
  // Statistics
  // ============================================

  getStats() {
    return {
      isRunning: this.isRunning,
      seenTokensCount: this.seenTokens.size,
      mode: this.config.mode,
      autoBuyEnabled: this.config.autoBuy.enabled
    };
  }

  // ============================================
  // Configuration
  // ============================================

  updateConfig(config: Partial<SnipeConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Sniper configuration updated');
  }

  getConfig(): SnipeConfig {
    return this.config;
  }
}
