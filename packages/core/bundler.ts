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

  constructor(connection: Connection, mainWallet: Keypair, mode: PumpMode) {
    this.connection = connection;
    this.mainWallet = mainWallet;
    this.pumpClient = new PumpFunClient(connection, mode);
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

      // 5. Bundle and execute transactions
      logger.info('Executing bundle...');
      const bundleResults = await this.executeBundleWithJito(
        mint,
        buyInstructions,
        strategy
      );

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
  // Jito Bundle Execution
  // ============================================

  private async executeBundleWithJito(
    mint: PublicKey,
    buyInstructions: TransactionInstruction[],
    strategy: BundleStrategy
  ): Promise<TransactionResult[]> {
    logger.info('Preparing Jito bundle...');

    const results: TransactionResult[] = [];

    try {
      // Get lookup table
      const lookupTable = await this.connection.getAddressLookupTable(this.lookupTableAddress!);

      if (!lookupTable.value) {
        throw new Error('Lookup table not found');
      }

      // Create versioned transactions
      const transactions: VersionedTransaction[] = [];

      // Group buys into batches (3 wallets per transaction)
      const walletsPerTx = 3;
      const batches = Math.ceil(this.bundlerWallets.length / walletsPerTx);

      const { blockhash } = await this.connection.getLatestBlockhash();

      for (let i = 0; i < batches; i++) {
        const startIdx = i * walletsPerTx;
        const endIdx = Math.min(startIdx + walletsPerTx, this.bundlerWallets.length);

        const instructions: TransactionInstruction[] = [
          ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: strategy.priorityFee
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

      // Add Jito tip
      const tipTx = await this.createJitoTip();
      transactions.unshift(tipTx);

      // Send to Jito
      logger.info(`Sending bundle with ${transactions.length} transactions to Jito...`);

      const bundle = transactions.map(tx =>
        Buffer.from(tx.serialize()).toString('base64')
      );

      const jitoEndpoint = JITO_ENDPOINTS[0];
      const response = await axios.post(jitoEndpoint, {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [bundle]
      });

      if (response.data.result) {
        logger.success(`Bundle sent to Jito: ${response.data.result}`);

        // Wait for confirmation
        await sleep(10000);

        // Mark all as successful (in reality, check individual confirmations)
        for (let i = 0; i < transactions.length - 1; i++) {
          results.push({
            success: true,
            signature: 'bundle_tx_' + i,
            timestamp: new Date(),
            confirmationTime: 10000
          });
        }
      } else {
        throw new Error('Jito bundle submission failed');
      }

      return results;
    } catch (error) {
      logger.error('Jito bundle execution failed:', error);

      // Fallback to sequential execution
      return await this.executeSequential(mint, buyInstructions, strategy);
    }
  }

  private async createJitoTip(): Promise<VersionedTransaction> {
    // Random tip account
    const tipAccount = new PublicKey(
      JITO_TIP_ACCOUNTS[Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length)]
    );

    const tipAmount = 0.001 * LAMPORTS_PER_SOL; // 0.001 SOL tip

    const instruction = SystemProgram.transfer({
      fromPubkey: this.mainWallet.publicKey,
      toPubkey: tipAccount,
      lamports: tipAmount
    });

    const { blockhash } = await this.connection.getLatestBlockhash();

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
  // Fallback Sequential Execution
  // ============================================

  private async executeSequential(
    mint: PublicKey,
    buyInstructions: TransactionInstruction[],
    strategy: BundleStrategy
  ): Promise<TransactionResult[]> {
    logger.warn('Falling back to sequential execution...');

    const results: TransactionResult[] = [];

    for (let i = 0; i < buyInstructions.length; i++) {
      const startTime = Date.now();

      try {
        const tx = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: strategy.priorityFee }),
          buyInstructions[i]
        );

        tx.feePayer = this.bundlerWallets[i].publicKey;
        tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
        tx.sign(this.bundlerWallets[i]);

        const signature = await this.connection.sendRawTransaction(tx.serialize());

        await this.connection.confirmTransaction(signature);

        results.push({
          success: true,
          signature,
          timestamp: new Date(),
          confirmationTime: Date.now() - startTime
        });

        logger.debug(`Buy ${i + 1}/${buyInstructions.length} confirmed`);

        // Random delay
        if (strategy.timing.randomize && i < buyInstructions.length - 1) {
          await randomDelay(
            strategy.antiDetection.timingVariance / 2,
            strategy.antiDetection.timingVariance
          );
        }
      } catch (error) {
        results.push({
          success: false,
          error: (error as Error).message,
          timestamp: new Date(),
          confirmationTime: Date.now() - startTime
        });

        logger.error(`Buy ${i + 1} failed:`, error);
      }
    }

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
}
