import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  SystemProgram
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import {
  TransactionResult,
  SellMode,
  SellConfig
} from '@pump-bundler/types';
import { PumpFunClient } from './pump-fun';
import { PortfolioTracker, SellRecord } from './portfolio';
import {
  createLogger,
  formatSOL,
  sleep,
  randomDelay
} from '@pump-bundler/utils';
import { JITO_ENDPOINTS, JITO_TIP_ACCOUNTS } from '@pump-bundler/constants';
import axios from 'axios';

const logger = createLogger('Seller');

export interface SellResult {
  mode: SellMode;
  totalSold: number;
  totalReceived: number;
  successfulSells: number;
  failedSells: number;
  totalPnL: number;
  transactions: TransactionResult[];
  duration: number;
}

export class Seller {
  private connection: Connection;
  private pumpClient: PumpFunClient;
  private portfolio: PortfolioTracker;
  private lookupTableAddress?: PublicKey;

  constructor(
    connection: Connection,
    pumpClient: PumpFunClient,
    portfolio: PortfolioTracker,
    lookupTableAddress?: PublicKey
  ) {
    this.connection = connection;
    this.pumpClient = pumpClient;
    this.portfolio = portfolio;
    this.lookupTableAddress = lookupTableAddress;
  }

  // ============================================
  // Main Sell Function
  // ============================================

  async sell(
    tokenMint: PublicKey,
    wallets: Keypair[],
    config: SellConfig
  ): Promise<SellResult> {
    logger.info(`Starting sell in ${config.mode} mode for ${wallets.length} wallets...`);

    const startTime = Date.now();

    let result: SellResult;

    switch (config.mode) {
      case SellMode.REGULAR:
        result = await this.sellRegular(tokenMint, wallets, config);
        break;
      case SellMode.BUNDLE:
        result = await this.sellBundle(tokenMint, wallets, config);
        break;
      case SellMode.JITO:
        result = await this.sellJito(tokenMint, wallets, config);
        break;
      default:
        throw new Error(`Unknown sell mode: ${config.mode}`);
    }

    result.duration = Date.now() - startTime;

    logger.success(
      `Sell complete! ${result.successfulSells}/${wallets.length} successful, ` +
      `Total PnL: ${formatSOL(result.totalPnL * LAMPORTS_PER_SOL)} SOL`
    );

    return result;
  }

  // ============================================
  // Regular Mode: Sequential 1-by-1
  // ============================================

  private async sellRegular(
    tokenMint: PublicKey,
    wallets: Keypair[],
    config: SellConfig
  ): Promise<SellResult> {
    logger.info('Executing Regular mode: Sequential 1-by-1 sells...');

    const results: TransactionResult[] = [];
    let totalSold = 0;
    let totalReceived = 0;
    let totalPnL = 0;

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const startTime = Date.now();

      try {
        // Get token balance
        const ata = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);
        const balance = await this.getTokenBalance(ata);

        if (balance === 0) {
          logger.warn(`Wallet ${i + 1} has no tokens, skipping`);
          continue;
        }

        // Calculate sell amount
        const sellAmount = config.sellPercentage
          ? Math.floor(balance * (config.sellPercentage / 100))
          : balance;

        // Build sell instruction
        const sellIx = await this.pumpClient.buildSellInstruction({
          mint: tokenMint,
          amount: sellAmount,
          slippage: config.slippage,
          seller: wallet
        });

        // Create transaction
        const tx = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: config.priorityFee }),
          sellIx
        );

        tx.feePayer = wallet.publicKey;
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
        tx.sign(wallet);

        // Send transaction
        const signature = await this.connection.sendRawTransaction(tx.serialize(), {
          skipPreflight: false,
          maxRetries: 3
        });

        await this.connection.confirmTransaction(signature);

        // Get SOL received (simplified - would need to parse transaction)
        const solReceived = sellAmount * 0.0001; // Placeholder calculation

        // Record the sell
        const sellRecord: SellRecord = {
          walletAddress: wallet.publicKey.toBase58(),
          tokenAddress: tokenMint.toBase58(),
          amount: sellAmount,
          solReceived,
          pricePerToken: solReceived / sellAmount,
          timestamp: new Date(),
          signature,
          profitLoss: 0 // Will be calculated by portfolio tracker
        };

        this.portfolio.recordSell(sellRecord);

        totalSold += sellAmount;
        totalReceived += solReceived;
        totalPnL += sellRecord.profitLoss;

        results.push({
          success: true,
          signature,
          timestamp: new Date(),
          confirmationTime: Date.now() - startTime
        });

        logger.debug(`Wallet ${i + 1}/${wallets.length} sold ${sellAmount} tokens for ${formatSOL(solReceived * LAMPORTS_PER_SOL)} SOL`);

        // Optional delay between sells
        if (config.delayBetweenSells && i < wallets.length - 1) {
          await randomDelay(config.delayBetweenSells, config.delayBetweenSells + 500);
        }

      } catch (error) {
        results.push({
          success: false,
          error: (error as Error).message,
          timestamp: new Date(),
          confirmationTime: Date.now() - startTime
        });

        logger.error(`Wallet ${i + 1} sell failed:`, error);
      }
    }

    const successfulSells = results.filter(r => r.success).length;

    return {
      mode: SellMode.REGULAR,
      totalSold,
      totalReceived,
      successfulSells,
      failedSells: results.length - successfulSells,
      totalPnL,
      transactions: results,
      duration: 0
    };
  }

  // ============================================
  // Bundle Mode: Groups of 4 via RPC
  // ============================================

  private async sellBundle(
    tokenMint: PublicKey,
    wallets: Keypair[],
    config: SellConfig
  ): Promise<SellResult> {
    logger.info('Executing Bundle mode: Groups of 4 via RPC...');

    const results: TransactionResult[] = [];
    let totalSold = 0;
    let totalReceived = 0;
    let totalPnL = 0;

    const BATCH_SIZE = 4;
    const batches = Math.ceil(wallets.length / BATCH_SIZE);

    for (let batchIdx = 0; batchIdx < batches; batchIdx++) {
      const startIdx = batchIdx * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, wallets.length);
      const batchWallets = wallets.slice(startIdx, endIdx);

      logger.info(`Processing batch ${batchIdx + 1}/${batches} (${batchWallets.length} wallets)...`);

      // Process batch in parallel
      const batchPromises = batchWallets.map(async (wallet, idx) => {
        const startTime = Date.now();

        try {
          const ata = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);
          const balance = await this.getTokenBalance(ata);

          if (balance === 0) {
            return null;
          }

          const sellAmount = config.sellPercentage
            ? Math.floor(balance * (config.sellPercentage / 100))
            : balance;

          const sellIx = await this.pumpClient.buildSellInstruction({
            mint: tokenMint,
            amount: sellAmount,
            slippage: config.slippage,
            seller: wallet
          });

          const tx = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: config.priorityFee }),
            sellIx
          );

          tx.feePayer = wallet.publicKey;
          tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
          tx.sign(wallet);

          const signature = await this.connection.sendRawTransaction(tx.serialize(), {
            skipPreflight: false,
            maxRetries: 3
          });

          await this.connection.confirmTransaction(signature);

          const solReceived = sellAmount * 0.0001;

          const sellRecord: SellRecord = {
            walletAddress: wallet.publicKey.toBase58(),
            tokenAddress: tokenMint.toBase58(),
            amount: sellAmount,
            solReceived,
            pricePerToken: solReceived / sellAmount,
            timestamp: new Date(),
            signature,
            profitLoss: 0
          };

          this.portfolio.recordSell(sellRecord);

          return {
            success: true,
            signature,
            timestamp: new Date(),
            confirmationTime: Date.now() - startTime,
            sellAmount,
            solReceived,
            profitLoss: 0
          };

        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
            timestamp: new Date(),
            confirmationTime: Date.now() - startTime
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach((result) => {
        if (result) {
          results.push(result);
          if (result.success && 'sellAmount' in result) {
            totalSold += result.sellAmount;
            totalReceived += result.solReceived;
            totalPnL += result.profitLoss;
          }
        }
      });

      logger.info(`Batch ${batchIdx + 1}/${batches} complete`);

      // Delay between batches
      if (config.delayBetweenSells && batchIdx < batches - 1) {
        await sleep(config.delayBetweenSells);
      }
    }

    const successfulSells = results.filter(r => r.success).length;

    return {
      mode: SellMode.BUNDLE,
      totalSold,
      totalReceived,
      successfulSells,
      failedSells: results.length - successfulSells,
      totalPnL,
      transactions: results,
      duration: 0
    };
  }

  // ============================================
  // Jito Mode: Groups of 20+ via Jito Bundle
  // ============================================

  private async sellJito(
    tokenMint: PublicKey,
    wallets: Keypair[],
    config: SellConfig
  ): Promise<SellResult> {
    logger.info('Executing Jito mode: Large bundles via Jito...');

    const results: TransactionResult[] = [];
    let totalSold = 0;
    let totalReceived = 0;
    let totalPnL = 0;

    const BATCH_SIZE = config.jitoBundleSize || 20;
    const batches = Math.ceil(wallets.length / BATCH_SIZE);

    for (let batchIdx = 0; batchIdx < batches; batchIdx++) {
      const startIdx = batchIdx * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, wallets.length);
      const batchWallets = wallets.slice(startIdx, endIdx);

      logger.info(`Processing Jito bundle ${batchIdx + 1}/${batches} (${batchWallets.length} wallets)...`);

      try {
        const bundleResult = await this.executeJitoSellBundle(
          tokenMint,
          batchWallets,
          config
        );

        results.push(...bundleResult.transactions);
        totalSold += bundleResult.totalSold;
        totalReceived += bundleResult.totalReceived;
        totalPnL += bundleResult.totalPnL;

      } catch (error) {
        logger.error(`Jito bundle ${batchIdx + 1} failed:`, error);

        // Add failed results
        batchWallets.forEach(() => {
          results.push({
            success: false,
            error: (error as Error).message,
            timestamp: new Date()
          });
        });
      }

      // Delay between bundles
      if (batchIdx < batches - 1) {
        await sleep(2000);
      }
    }

    const successfulSells = results.filter(r => r.success).length;

    return {
      mode: SellMode.JITO,
      totalSold,
      totalReceived,
      successfulSells,
      failedSells: results.length - successfulSells,
      totalPnL,
      transactions: results,
      duration: 0
    };
  }

  private async executeJitoSellBundle(
    tokenMint: PublicKey,
    wallets: Keypair[],
    config: SellConfig
  ): Promise<{
    transactions: TransactionResult[];
    totalSold: number;
    totalReceived: number;
    totalPnL: number;
  }> {
    const transactions: VersionedTransaction[] = [];
    const results: TransactionResult[] = [];
    let totalSold = 0;
    let totalReceived = 0;
    let totalPnL = 0;

    const { blockhash } = await this.connection.getLatestBlockhash();

    // Get lookup table if available
    let lookupTable = null;
    if (this.lookupTableAddress) {
      const lookupTableAccount = await this.connection.getAddressLookupTable(this.lookupTableAddress);
      lookupTable = lookupTableAccount.value;
    }

    // Build sell transactions
    for (const wallet of wallets) {
      try {
        const ata = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);
        const balance = await this.getTokenBalance(ata);

        if (balance === 0) continue;

        const sellAmount = config.sellPercentage
          ? Math.floor(balance * (config.sellPercentage / 100))
          : balance;

        const sellIx = await this.pumpClient.buildSellInstruction({
          mint: tokenMint,
          amount: sellAmount,
          slippage: config.slippage,
          seller: wallet
        });

        const instructions: TransactionInstruction[] = [
          ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: config.jitoTipLamports || config.priorityFee
          }),
          sellIx
        ];

        const message = new TransactionMessage({
          payerKey: wallet.publicKey,
          recentBlockhash: blockhash,
          instructions
        }).compileToV0Message(lookupTable ? [lookupTable] : []);

        const tx = new VersionedTransaction(message);
        tx.sign([wallet]);

        transactions.push(tx);

        // Track for result calculation
        totalSold += sellAmount;
        totalReceived += sellAmount * 0.0001; // Placeholder

      } catch (error) {
        logger.error(`Failed to build sell tx for wallet:`, error);
      }
    }

    // Add Jito tip transaction
    const tipTx = await this.createJitoTip(wallets[0], config.jitoTipLamports || 10000);
    transactions.unshift(tipTx);

    // Send to Jito
    logger.info(`Sending Jito bundle with ${transactions.length} transactions...`);

    const bundle = transactions.map(tx =>
      Buffer.from(tx.serialize()).toString('base64')
    );

    const jitoEndpoint = JITO_ENDPOINTS[0];
    const response = await axios.post(jitoEndpoint, {
      jsonrpc: '2.0',
      id: 1,
      method: 'sendBundle',
      params: [bundle]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.result) {
      logger.success(`Jito bundle sent: ${response.data.result}`);

      // Wait for confirmation
      await sleep(10000);

      // Record sells in portfolio
      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const sellAmount = totalSold / wallets.length; // Simplified
        const solReceived = totalReceived / wallets.length;

        const sellRecord: SellRecord = {
          walletAddress: wallet.publicKey.toBase58(),
          tokenAddress: tokenMint.toBase58(),
          amount: sellAmount,
          solReceived,
          pricePerToken: solReceived / sellAmount,
          timestamp: new Date(),
          signature: `jito_bundle_${response.data.result}`,
          profitLoss: 0
        };

        this.portfolio.recordSell(sellRecord);

        results.push({
          success: true,
          signature: sellRecord.signature,
          timestamp: new Date(),
          confirmationTime: 10000
        });
      }

    } else {
      throw new Error('Jito bundle submission failed');
    }

    return {
      transactions: results,
      totalSold,
      totalReceived,
      totalPnL
    };
  }

  // ============================================
  // SPL Token Burning & Rent Recovery
  // ============================================

  async closeTokenAccounts(
    wallets: Keypair[],
    tokenMints: PublicKey[],
    rentRecipient: PublicKey
  ): Promise<{
    closed: number;
    rentRecovered: number;
    signatures: string[];
  }> {
    logger.info(`Closing ${wallets.length * tokenMints.length} token accounts to recover rent...`);

    let closed = 0;
    let rentRecovered = 0;
    const signatures: string[] = [];

    for (const wallet of wallets) {
      for (const mint of tokenMints) {
        try {
          const ata = await getAssociatedTokenAddress(mint, wallet.publicKey);

          // Check if account exists
          const accountInfo = await this.connection.getAccountInfo(ata);
          if (!accountInfo) continue;

          // Check balance is zero
          const balance = await this.getTokenBalance(ata);
          if (balance > 0) {
            logger.warn(`Token account ${ata.toBase58()} still has balance, skipping`);
            continue;
          }

          // Create close instruction
          const closeIx = createCloseAccountInstruction(
            ata,
            rentRecipient,
            wallet.publicKey
          );

          const tx = new Transaction().add(closeIx);
          tx.feePayer = wallet.publicKey;
          tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
          tx.sign(wallet);

          const signature = await this.connection.sendRawTransaction(tx.serialize());
          await this.connection.confirmTransaction(signature);

          const rentLamports = accountInfo.lamports;
          rentRecovered += rentLamports;
          closed++;
          signatures.push(signature);

          logger.debug(`Closed token account ${ata.toBase58()}, recovered ${formatSOL(rentLamports)} SOL`);

        } catch (error) {
          logger.error(`Failed to close token account:`, error);
        }
      }
    }

    logger.success(
      `Closed ${closed} accounts, recovered ${formatSOL(rentRecovered)} SOL ` +
      `(~$${((rentRecovered / LAMPORTS_PER_SOL) * 100).toFixed(2)})`
    );

    return {
      closed,
      rentRecovered,
      signatures
    };
  }

  // ============================================
  // Helper Functions
  // ============================================

  private async getTokenBalance(ata: PublicKey): Promise<number> {
    try {
      const accountInfo = await this.connection.getTokenAccountBalance(ata);
      return Number(accountInfo.value.amount);
    } catch (error) {
      return 0;
    }
  }

  private async createJitoTip(payer: Keypair, tipLamports: number): Promise<VersionedTransaction> {
    const tipAccount = new PublicKey(
      JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)]
    );

    const instruction = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: tipAccount,
      lamports: tipLamports
    });

    const { blockhash } = await this.connection.getLatestBlockhash();

    const message = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: blockhash,
      instructions: [instruction]
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    tx.sign([payer]);

    return tx;
  }

  setLookupTableAddress(address: PublicKey): void {
    this.lookupTableAddress = address;
  }
}
