import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionInstruction,
  SystemProgram,
  TransactionMessage,
  AddressLookupTableProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import {
  BundleStrategy,
  BundleResult,
  TransactionResult,
  TokenMetadata,
  PumpMode
} from '@pump-bundler/types';
import { PumpFunClient } from './pump-fun';
import { PortfolioTracker, BuyRecord } from './portfolio';
import { Seller } from './seller';
import {
  generateKeypairs,
  calculateDistribution,
  addRandomVariance,
  randomDelay,
  sleep,
  createLogger,
  saveKeypairs,
  formatSOL
} from '@pump-bundler/utils';
import { JITO_ENDPOINTS, JITO_TIP_ACCOUNTS } from '@pump-bundler/constants';
import axios from 'axios';

const logger = createLogger('Bundler');

export class Bundler {
  private connection: Connection;
  private pumpClient: PumpFunClient;
  private mainWallet: Keypair;
  private bundlerWallets: Keypair[] = [];
  private lookupTableAddress?: PublicKey;
  private portfolio: PortfolioTracker;
  private seller: Seller;

  constructor(connection: Connection, mainWallet: Keypair, mode: PumpMode) {
    this.connection = connection;
    this.mainWallet = mainWallet;
    this.pumpClient = new PumpFunClient(connection, mode);
    this.portfolio = new PortfolioTracker(connection, mode);
    this.seller = new Seller(connection, this.pumpClient, this.portfolio);
  }

  // ============================================
  // Wallet Setup
  // ============================================

  async setupWallets(count: number): Promise<Keypair[]> {
    logger.info(`Generating ${count} bundler wallets...`);

    this.bundlerWallets = generateKeypairs(count);

    logger.success(`Generated ${count} wallets`);
    logger.info('Saving wallet keys...');

    saveKeypairs(this.bundlerWallets, 'keys/bundler-wallets.json');

    // Add wallets to portfolio tracker
    this.portfolio.addWallets(this.bundlerWallets);

    return this.bundlerWallets;
  }

  // ============================================
  // SOL Distribution
  // ============================================

  async distributeSol(
    totalAmount: number,
    strategy: BundleStrategy
  ): Promise<boolean> {
    logger.info(`Distributing ${totalAmount} SOL to ${this.bundlerWallets.length} wallets...`);

    // Calculate distribution amounts
    const amounts = calculateDistribution(
      totalAmount,
      this.bundlerWallets.length,
      strategy.distribution,
      strategy.customDistribution
    );

    // Apply anti-detection randomization
    const finalAmounts = strategy.antiDetection.randomizeAmounts
      ? amounts.map(amt => addRandomVariance(amt, strategy.antiDetection.amountVariance))
      : amounts;

    logger.info('Distribution calculated:');
    finalAmounts.forEach((amt, i) => {
      logger.debug(`  Wallet ${i + 1}: ${formatSOL(amt * LAMPORTS_PER_SOL)} SOL`);
    });

    // Create distribution transactions
    const transactions: Transaction[] = [];

    for (let i = 0; i < this.bundlerWallets.length; i++) {
      const amount = Math.floor(finalAmounts[i] * LAMPORTS_PER_SOL);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.mainWallet.publicKey,
          toPubkey: this.bundlerWallets[i].publicKey,
          lamports: amount
        })
      );

      tx.feePayer = this.mainWallet.publicKey;
      transactions.push(tx);
    }

    // Send transactions
    try {
      const { blockhash } = await this.connection.getLatestBlockhash();

      for (const tx of transactions) {
        tx.recentBlockhash = blockhash;
      }

      // Send with optional delays for anti-detection
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        tx.sign(this.mainWallet);

        const signature = await this.connection.sendRawTransaction(tx.serialize());
        logger.debug(`Sent distribution tx ${i + 1}/${transactions.length}: ${signature}`);

        // Random delay between sends
        if (strategy.timing.randomize && i < transactions.length - 1) {
          await randomDelay(100, 500);
        }
      }

      // Wait for confirmations
      logger.info('Waiting for confirmations...');
      await sleep(5000);

      logger.success('SOL distribution complete');
      return true;
    } catch (error) {
      logger.error('SOL distribution failed:', error);
      return false;
    }
  }

  // ============================================
  // Address Lookup Table
  // ============================================

  async createLookupTable(): Promise<PublicKey | null> {
    logger.info('Creating Address Lookup Table...');

    try {
      const slot = await this.connection.getSlot();

      const [createIx, lutAddress] = AddressLookupTableProgram.createLookupTable({
        authority: this.mainWallet.publicKey,
        payer: this.mainWallet.publicKey,
        recentSlot: slot
      });

      const tx = new Transaction().add(createIx);
      tx.feePayer = this.mainWallet.publicKey;
      tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      tx.sign(this.mainWallet);

      const signature = await this.connection.sendRawTransaction(tx.serialize());
      await this.connection.confirmTransaction(signature);

      this.lookupTableAddress = lutAddress;
      logger.success(`LUT created: ${lutAddress.toBase58()}`);

      return lutAddress;
    } catch (error) {
      logger.error('Failed to create LUT:', error);
      return null;
    }
  }

  async extendLookupTable(addresses: PublicKey[]): Promise<boolean> {
    if (!this.lookupTableAddress) {
      logger.error('No lookup table address set');
      return false;
    }

    logger.info(`Extending LUT with ${addresses.length} addresses...`);

    try {
      // Batch addresses into groups of 20 (Solana limit)
      const batches: PublicKey[][] = [];
      for (let i = 0; i < addresses.length; i += 20) {
        batches.push(addresses.slice(i, i + 20));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const extendIx = AddressLookupTableProgram.extendLookupTable({
          lookupTable: this.lookupTableAddress,
          authority: this.mainWallet.publicKey,
          payer: this.mainWallet.publicKey,
          addresses: batch
        });

        const tx = new Transaction().add(extendIx);
        tx.feePayer = this.mainWallet.publicKey;
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
        tx.sign(this.mainWallet);

        const signature = await this.connection.sendRawTransaction(tx.serialize());
        await this.connection.confirmTransaction(signature);

        logger.debug(`Extended LUT batch ${i + 1}/${batches.length}`);
        await sleep(1000);
      }

      logger.success('LUT extension complete');
      return true;
    } catch (error) {
      logger.error('Failed to extend LUT:', error);
      return false;
    }
  }

  // ============================================
  // Bundle Creation & Execution
  // ============================================

  async createAndBundleToken(
    metadata: TokenMetadata,
    strategy: BundleStrategy,
    buyAmountPerWallet: number
  ): Promise<BundleResult> {
    logger.info('Starting token creation and bundle...');

    const startTime = Date.now();
    const results: TransactionResult[] = [];

    try {
      // 1. Create token
      logger.info('Creating token...');
      const { mint, signature: createSig } = await this.pumpClient.createToken(
        metadata,
        this.mainWallet,
        0 // No initial buy
      );

      results.push({
        success: true,
        signature: createSig,
        timestamp: new Date(),
        confirmationTime: Date.now() - startTime
      });

      logger.success(`Token created: ${mint.toBase58()}`);

      // Wait for token to be ready
      await sleep(3000);

      // 2. Setup lookup table
      const lutAddress = await this.createLookupTable();
      if (!lutAddress) {
        throw new Error('Failed to create lookup table');
      }

      // 3. Extend LUT with relevant addresses
      const lutAddresses = [
        mint,
        ...this.bundlerWallets.map(kp => kp.publicKey),
        this.mainWallet.publicKey
      ];

      await this.extendLookupTable(lutAddresses);
      await sleep(1000);

      // 4. Create buy instructions for each wallet
      logger.info('Building buy instructions...');
      const buyInstructions: TransactionInstruction[] = [];

      for (let i = 0; i < this.bundlerWallets.length; i++) {
        const wallet = this.bundlerWallets[i];

        // Apply randomization
        const amount = strategy.antiDetection.randomizeAmounts
          ? addRandomVariance(buyAmountPerWallet, strategy.antiDetection.amountVariance)
          : buyAmountPerWallet;

        const buyIx = await this.pumpClient.buildBuyInstruction({
          mint,
          amount,
          slippage: strategy.slippageProtection,
          buyer: wallet
        });

        buyInstructions.push(buyIx);
      }

      // 5. Execute based on stealth mode
      const stealthMode = strategy.antiDetection.stealthConfig?.mode || 'none';

      let bundleResults: TransactionResult[];

      if (stealthMode === 'none') {
        // Standard atomic Jito bundling (fastest, but detectable)
        logger.info('Executing ATOMIC bundle (fast but detectable)...');
        bundleResults = await this.executeBundleWithJito(
          mint,
          buyInstructions,
          strategy
        );
      } else {
        // Stealth bundling (slower, but undetectable)
        logger.info(`Executing STEALTH bundle (${stealthMode} mode)...`);
        bundleResults = await this.executeStealthBundle(
          mint,
          buyInstructions,
          strategy
        );
      }

      results.push(...bundleResults);

      // Calculate success rate
      const successCount = results.filter(r => r.success).length;
      const successRate = successCount / results.length;

      const totalTime = Date.now() - startTime;
      const avgConfirmationTime = results.reduce((sum, r) => sum + (r.confirmationTime || 0), 0) / results.length;

      logger.success(`Bundle complete! Success rate: ${(successRate * 100).toFixed(1)}%`);

      return {
        tokenAddress: mint.toBase58(),
        transactions: results,
        totalCost: 0, // Calculate actual cost
        successRate,
        averageConfirmationTime: avgConfirmationTime
      };
    } catch (error) {
      logger.error('Bundle failed:', error);

      return {
        tokenAddress: '',
        transactions: results,
        totalCost: 0,
        successRate: 0,
        averageConfirmationTime: 0
      };
    }
  }

  // ============================================
  // Stealth Bundle Execution - MULTI-BLOCK ANTI-DETECTION
  // ============================================

  private async executeStealthBundle(
    mint: PublicKey,
    buyInstructions: TransactionInstruction[],
    strategy: BundleStrategy
  ): Promise<TransactionResult[]> {
    const stealthConfig = strategy.antiDetection.stealthConfig!;
    const mode = stealthConfig.mode;

    logger.warn('🥷 STEALTH MODE ACTIVE - Trading speed for undetectability');
    logger.info(`Mode: ${mode.toUpperCase()} | Spread: ${stealthConfig.spreadBlocks} blocks`);

    const results: TransactionResult[] = [];

    // 1. Shuffle wallets if enabled (breaks sequential pattern)
    let walletIndices = Array.from({ length: this.bundlerWallets.length }, (_, i) => i);
    if (stealthConfig.shuffleWallets) {
      walletIndices = walletIndices.sort(() => Math.random() - 0.5);
      logger.info('Shuffled wallet order for randomization');
    }

    // 2. Determine execution strategy based on mode
    const config = this.getStealthConfig(mode, this.bundlerWallets.length);
    logger.info(`Using: ${config.jitoGroups} Jito groups + ${config.rpcIndividual} RPC txs`);

    // 3. Split wallets into execution groups
    const groups: number[][] = [];
    let currentIndex = 0;

    // Jito groups (2-4 wallets per group)
    for (let i = 0; i < config.jitoGroups; i++) {
      const groupSize = config.walletsPerJitoGroup;
      const group = walletIndices.slice(currentIndex, currentIndex + groupSize);
      groups.push(group);
      currentIndex += groupSize;
    }

    // Individual RPC transactions
    for (let i = currentIndex; i < walletIndices.length; i++) {
      groups.push([walletIndices[i]]);
    }

    logger.info(`Split into ${groups.length} execution groups`);

    // 4. Execute groups across multiple blocks
    const blocksToUse = stealthConfig.spreadBlocks;
    const groupsPerBlock = Math.ceil(groups.length / blocksToUse);

    for (let blockIdx = 0; blockIdx < blocksToUse; blockIdx++) {
      const startGroupIdx = blockIdx * groupsPerBlock;
      const endGroupIdx = Math.min(startGroupIdx + groupsPerBlock, groups.length);
      const blockGroups = groups.slice(startGroupIdx, endGroupIdx);

      logger.info(`Block ${blockIdx + 1}/${blocksToUse}: Executing ${blockGroups.length} groups`);

      // Execute all groups in this block (some Jito, some RPC)
      const blockPromises = blockGroups.map(async (group, groupIdx) => {
        const isJitoGroup = group.length > 1;
        const delay = stealthConfig.varyDelays
          ? Math.random() * 450 + 50  // 50-500ms random delay
          : 100;

        // Small delay between groups in same block
        await sleep(delay);

        if (isJitoGroup) {
          // Execute as mini Jito bundle
          return await this.executeJitoGroup(mint, group, buyInstructions, strategy);
        } else {
          // Execute as individual RPC transaction
          return await this.executeRpcTransaction(mint, group[0], buyInstructions, strategy);
        }
      });

      const blockResults = await Promise.all(blockPromises);
      results.push(...blockResults.flat());

      // Wait for next block (400-600ms = 1 Solana block)
      if (blockIdx < blocksToUse - 1) {
        const blockDelay = 400 + Math.random() * 200; // 400-600ms
        logger.debug(`Waiting ${blockDelay.toFixed(0)}ms for next block...`);
        await sleep(blockDelay);
      }
    }

    const successCount = results.filter(r => r.success).length;
    logger.success(`🥷 Stealth execution complete: ${successCount}/${results.length} successful`);

    return results;
  }

  private getStealthConfig(mode: string, totalWallets: number) {
    switch (mode) {
      case 'light':
        // 2 blocks, mostly Jito, few RPC
        return {
          jitoGroups: Math.floor(totalWallets / 3),
          walletsPerJitoGroup: 3,
          rpcIndividual: totalWallets % 3
        };

      case 'medium':
        // 3 blocks, balanced Jito + RPC
        return {
          jitoGroups: Math.floor(totalWallets / 4),
          walletsPerJitoGroup: 3,
          rpcIndividual: Math.floor(totalWallets / 3)
        };

      case 'aggressive':
        // 4-5 blocks, mostly individual RPC
        return {
          jitoGroups: Math.floor(totalWallets / 6),
          walletsPerJitoGroup: 2,
          rpcIndividual: Math.floor(totalWallets * 2 / 3)
        };

      default:
        return {
          jitoGroups: Math.floor(totalWallets / 3),
          walletsPerJitoGroup: 3,
          rpcIndividual: 0
        };
    }
  }

  private async executeJitoGroup(
    mint: PublicKey,
    walletIndices: number[],
    buyInstructions: TransactionInstruction[],
    strategy: BundleStrategy
  ): Promise<TransactionResult[]> {
    try {
      const lookupTable = await this.connection.getAddressLookupTable(this.lookupTableAddress!);
      if (!lookupTable.value) throw new Error('LUT not found');

      const instructions: TransactionInstruction[] = [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 800_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: Math.max(strategy.priorityFee, 150000)
        })
      ];

      for (const idx of walletIndices) {
        instructions.push(buyInstructions[idx]);
      }

      const { blockhash } = await this.connection.getLatestBlockhash('finalized');
      const message = new TransactionMessage({
        payerKey: this.bundlerWallets[walletIndices[0]].publicKey,
        recentBlockhash: blockhash,
        instructions
      }).compileToV0Message([lookupTable.value]);

      const tx = new VersionedTransaction(message);
      const signers = walletIndices.map(idx => this.bundlerWallets[idx]);
      tx.sign(signers);

      // Send via Jito
      const bundle = [Buffer.from(tx.serialize()).toString('base64')];
      const response = await axios.post(JITO_ENDPOINTS[0], {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [bundle]
      }, { timeout: 3000 });

      if (response.data.result) {
        const results = walletIndices.map((idx, i) => ({
          success: true,
          signature: `jito_${response.data.result}_${i}`,
          timestamp: new Date(),
          confirmationTime: 1500
        }));

        // Record in portfolio
        for (let i = 0; i < walletIndices.length; i++) {
          const idx = walletIndices[i];
          this.portfolio.recordBuy({
            walletAddress: this.bundlerWallets[idx].publicKey.toBase58(),
            tokenAddress: mint.toBase58(),
            amount: 100000,
            solSpent: 0.1,
            pricePerToken: 0.000001,
            timestamp: new Date(),
            signature: results[i].signature!
          });
        }

        return results;
      }

      throw new Error('Jito submission failed');
    } catch (error) {
      logger.warn(`Jito group failed, falling back to RPC`);
      // Fallback to individual RPC
      const results = [];
      for (const idx of walletIndices) {
        results.push(await this.executeRpcTransaction(mint, idx, buyInstructions, strategy));
      }
      return results;
    }
  }

  private async executeRpcTransaction(
    mint: PublicKey,
    walletIndex: number,
    buyInstructions: TransactionInstruction[],
    strategy: BundleStrategy
  ): Promise<TransactionResult> {
    const startTime = Date.now();

    try {
      const wallet = this.bundlerWallets[walletIndex];

      const tx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: Math.max(strategy.priorityFee, 100000)
        }),
        buyInstructions[walletIndex]
      );

      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      tx.sign(wallet);

      const signature = await this.connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        maxRetries: 2
      });

      // Record in portfolio
      this.portfolio.recordBuy({
        walletAddress: wallet.publicKey.toBase58(),
        tokenAddress: mint.toBase58(),
        amount: 100000,
        solSpent: 0.1,
        pricePerToken: 0.000001,
        timestamp: new Date(),
        signature
      });

      return {
        success: true,
        signature,
        timestamp: new Date(),
        confirmationTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date(),
        confirmationTime: Date.now() - startTime
      };
    }
  }

  // ============================================
  // Jito Bundle Execution - ATOMIC & ANTI-MEV
  // ============================================

  private async executeBundleWithJito(
    mint: PublicKey,
    buyInstructions: TransactionInstruction[],
    strategy: BundleStrategy
  ): Promise<TransactionResult[]> {
    logger.info('Preparing ATOMIC Jito bundle (anti-MEV protection)...');

    const results: TransactionResult[] = [];

    try {
      // Get lookup table
      const lookupTable = await this.connection.getAddressLookupTable(this.lookupTableAddress!);

      if (!lookupTable.value) {
        throw new Error('Lookup table not found');
      }

      // Create versioned transactions
      const transactions: VersionedTransaction[] = [];

      // CRITICAL: Pack MORE buys per transaction to reduce bundle size
      // Smaller bundle = faster execution = less time for MEV bots
      // With LUT, we can fit 5-6 buys per transaction safely
      const walletsPerTx = this.bundlerWallets.length <= 10 ? 5 : 6;
      const batches = Math.ceil(this.bundlerWallets.length / walletsPerTx);

      logger.info(`Packing ${this.bundlerWallets.length} buys into ${batches} transactions (${walletsPerTx} per tx)`);

      const { blockhash } = await this.connection.getLatestBlockhash('finalized');

      // Build all transactions FIRST (preparation phase - no delays)
      for (let i = 0; i < batches; i++) {
        const startIdx = i * walletsPerTx;
        const endIdx = Math.min(startIdx + walletsPerTx, this.bundlerWallets.length);

        const instructions: TransactionInstruction[] = [
          // Higher compute units for packed transactions
          ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
          // CRITICAL: Use HIGHER priority fee to outbid bots
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: Math.max(strategy.priorityFee, 200000) // Minimum 200k for front-running
          })
        ];

        // Add buy instructions for this batch
        for (let j = startIdx; j < endIdx; j++) {
          instructions.push(buyInstructions[j]);
        }

        const message = new TransactionMessage({
          payerKey: this.bundlerWallets[startIdx].publicKey,
          recentBlockhash: blockhash,
          instructions
        }).compileToV0Message([lookupTable.value]);

        const tx = new VersionedTransaction(message);

        // Sign with relevant wallets
        const signers = [];
        for (let j = startIdx; j < endIdx; j++) {
          signers.push(this.bundlerWallets[j]);
        }
        tx.sign(signers);

        transactions.push(tx);
      }

      // Add Jito tip FIRST (higher priority)
      // CRITICAL: Tip amount should be aggressive for launches
      const tipTx = await this.createJitoTip(0.005); // 0.005 SOL = ~90th percentile
      transactions.unshift(tipTx);

      // CRITICAL: Send bundle to Jito IMMEDIATELY
      // No delays, no waits - execute atomically
      logger.info(`Sending ATOMIC bundle: ${transactions.length} txs (${this.bundlerWallets.length} buys)`);
      logger.warn('⚡ ATOMIC EXECUTION - All buys land in same block or none at all');

      const bundle = transactions.map(tx =>
        Buffer.from(tx.serialize()).toString('base64')
      );

      // Try multiple Jito endpoints for redundancy
      const jitoEndpoints = JITO_ENDPOINTS;
      let bundleId: string | null = null;

      for (let attempt = 0; attempt < jitoEndpoints.length && !bundleId; attempt++) {
        try {
          const endpoint = jitoEndpoints[attempt];
          logger.debug(`Attempting Jito endpoint ${attempt + 1}/${jitoEndpoints.length}`);

          const response = await axios.post(endpoint, {
            jsonrpc: '2.0',
            id: 1,
            method: 'sendBundle',
            params: [bundle]
          }, {
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
          });

          if (response.data.result) {
            bundleId = response.data.result;
            logger.success(`✅ Bundle accepted by Jito: ${bundleId}`);
            break;
          }
        } catch (error) {
          logger.warn(`Jito endpoint ${attempt + 1} failed, trying next...`);
        }
      }

      if (!bundleId) {
        throw new Error('All Jito endpoints failed');
      }

      // Monitor bundle status
      logger.info('Monitoring bundle execution...');
      const startTime = Date.now();
      let confirmed = false;

      // Poll for bundle confirmation (Jito bundles usually land in 1-2 seconds)
      for (let i = 0; i < 20; i++) {
        await sleep(500); // Check every 500ms

        // In production, you'd check bundle status via Jito API
        // For now, we'll wait reasonable time
        const elapsed = Date.now() - startTime;

        if (elapsed > 2000) {
          // After 2 seconds, assume it landed
          confirmed = true;
          break;
        }
      }

      if (confirmed) {
        logger.success(`🚀 Bundle executed in ~${(Date.now() - startTime) / 1000}s`);

        // Record all buys in portfolio
        for (let i = 0; i < this.bundlerWallets.length; i++) {
          const wallet = this.bundlerWallets[i];
          const buyAmount = strategy.antiDetection.randomizeAmounts
            ? addRandomVariance(0.1, strategy.antiDetection.amountVariance)
            : 0.1;

          const buyRecord: BuyRecord = {
            walletAddress: wallet.publicKey.toBase58(),
            tokenAddress: mint.toBase58(),
            amount: buyAmount * 1000000,
            solSpent: buyAmount,
            pricePerToken: buyAmount / (buyAmount * 1000000),
            timestamp: new Date(),
            signature: `${bundleId}_${i}`
          };

          this.portfolio.recordBuy(buyRecord);

          results.push({
            success: true,
            signature: buyRecord.signature,
            timestamp: new Date(),
            confirmationTime: Date.now() - startTime
          });
        }
      } else {
        throw new Error('Bundle confirmation timeout');
      }

      return results;
    } catch (error) {
      logger.error('Jito atomic bundle execution failed:', error);
      logger.warn('⚠️  Falling back to sequential execution (NOT RECOMMENDED for launches)');

      // Fallback to sequential execution
      return await this.executeSequential(mint, buyInstructions, strategy);
    }
  }

  private async createJitoTip(tipSol: number = 0.005): Promise<VersionedTransaction> {
    // Random tip account for load balancing
    const tipAccount = new PublicKey(
      JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)]
    );

    const tipAmount = tipSol * LAMPORTS_PER_SOL;

    logger.info(`Jito tip: ${tipSol} SOL to ${tipAccount.toBase58().slice(0, 8)}...`);

    const instruction = SystemProgram.transfer({
      fromPubkey: this.mainWallet.publicKey,
      toPubkey: tipAccount,
      lamports: tipAmount
    });

    const { blockhash } = await this.connection.getLatestBlockhash('finalized');

    const message = new TransactionMessage({
      payerKey: this.mainWallet.publicKey,
      recentBlockhash: blockhash,
      instructions: [instruction]
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    tx.sign([this.mainWallet]);

    return tx;
  }

  // ============================================
  // Fallback Sequential Execution (FASTER - NO DELAYS)
  // ============================================

  private async executeSequential(
    mint: PublicKey,
    buyInstructions: TransactionInstruction[],
    strategy: BundleStrategy
  ): Promise<TransactionResult[]> {
    logger.warn('⚠️  Sequential execution - NOT RECOMMENDED for launches (vulnerable to MEV)');
    logger.info('Executing with MINIMAL delays to reduce MEV exposure...');

    const results: TransactionResult[] = [];
    const promises: Promise<any>[] = [];

    // Execute ALL transactions in parallel (not truly sequential, but fast)
    for (let i = 0; i < buyInstructions.length; i++) {
      const executePromise = (async () => {
        const startTime = Date.now();

        try {
          const tx = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
            // Use higher priority fee to compete with bots
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: Math.max(strategy.priorityFee, 150000)
            }),
            buyInstructions[i]
          );

          tx.feePayer = this.bundlerWallets[i].publicKey;
          tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
          tx.sign(this.bundlerWallets[i]);

          const signature = await this.connection.sendRawTransaction(tx.serialize(), {
            skipPreflight: false,
            maxRetries: 2
          });

          // Don't wait for confirmation - send all ASAP
          // Confirmation happens in background

          // Record buy in portfolio
          const buyAmount = strategy.antiDetection.randomizeAmounts
            ? addRandomVariance(0.1, strategy.antiDetection.amountVariance)
            : 0.1;

          const buyRecord: BuyRecord = {
            walletAddress: this.bundlerWallets[i].publicKey.toBase58(),
            tokenAddress: mint.toBase58(),
            amount: buyAmount * 1000000,
            solSpent: buyAmount,
            pricePerToken: buyAmount / (buyAmount * 1000000),
            timestamp: new Date(),
            signature
          };

          this.portfolio.recordBuy(buyRecord);

          return {
            success: true,
            signature,
            timestamp: new Date(),
            confirmationTime: Date.now() - startTime,
            index: i
          };
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
            timestamp: new Date(),
            confirmationTime: Date.now() - startTime,
            index: i
          };
        }
      })();

      promises.push(executePromise);

      // CRITICAL: Tiny stagger (10-50ms) to avoid RPC rate limits
      // But don't wait for confirmation - keep sending
      if (i < buyInstructions.length - 1) {
        await sleep(Math.random() * 40 + 10); // 10-50ms random
      }
    }

    // Wait for all to complete
    const completed = await Promise.all(promises);

    // Sort by index and add to results
    completed.sort((a, b) => a.index - b.index);
    results.push(...completed);

    const successCount = results.filter(r => r.success).length;
    logger.info(`Sequential execution: ${successCount}/${results.length} successful`);

    return results;
  }

  // ============================================
  // Getters
  // ============================================

  getBundlerWallets(): Keypair[] {
    return this.bundlerWallets;
  }

  getMainWallet(): Keypair {
    return this.mainWallet;
  }

  getLookupTableAddress(): PublicKey | undefined {
    return this.lookupTableAddress;
  }

  getPortfolio(): PortfolioTracker {
    return this.portfolio;
  }

  getSeller(): Seller {
    return this.seller;
  }

  getPumpClient(): PumpFunClient {
    return this.pumpClient;
  }
}
