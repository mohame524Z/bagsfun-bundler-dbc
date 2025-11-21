import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import {
  PumpMode,
  TokenMetadata,
  PumpFunToken,
  BondingCurveState,
  PumpFunBuyParams,
  PumpFunSellParams
} from '@pump-bundler/types';
import {
  PUMP_FUN_PROGRAM_ID,
  PUMP_FUN_GLOBAL,
  PUMP_FUN_EVENT_AUTHORITY,
  PUMP_FUN_FEE_RECIPIENT,
  MODE_CONFIGS,
  BONDING_CURVE_CONSTANTS,
  API_ENDPOINTS
} from '@pump-bundler/constants';
import { createLogger, retryAsync } from '@pump-bundler/utils';

const logger = createLogger('PumpFun');

export class PumpFunClient {
  private connection: Connection;
  private mode: PumpMode;

  constructor(connection: Connection, mode: PumpMode = PumpMode.CLASSIC) {
    this.connection = connection;
    this.mode = mode;
    logger.info(`PumpFunClient initialized in ${mode} mode`);
  }

  // ============================================
  // Mode Management
  // ============================================

  setMode(mode: PumpMode): void {
    this.mode = mode;
    logger.info(`Switched to ${mode} mode`);
  }

  getMode(): PumpMode {
    return this.mode;
  }

  getModeConfig() {
    return MODE_CONFIGS[this.mode];
  }

  // ============================================
  // Token Creation
  // ============================================

  async createToken(
    metadata: TokenMetadata,
    creator: Keypair,
    initialBuy: number = 0
  ): Promise<{ mint: PublicKey; signature: string }> {
    logger.info(`Creating token: ${metadata.name} (${metadata.symbol})`);

    // 1. Upload metadata to IPFS
    const metadataUri = await this.uploadMetadata(metadata);
    logger.info(`Metadata uploaded: ${metadataUri}`);

    // 2. Generate mint keypair
    const mintKeypair = Keypair.generate();
    logger.info(`Mint address: ${mintKeypair.publicKey.toBase58()}`);

    // 3. Create token transaction
    const tx = await this.buildCreateTokenTransaction(
      mintKeypair,
      creator,
      metadata,
      metadataUri,
      initialBuy
    );

    // 4. Send and confirm
    const signature = await this.sendAndConfirm(tx, [creator, mintKeypair]);

    logger.success(`Token created: ${mintKeypair.publicKey.toBase58()}`);
    logger.success(`Signature: ${signature}`);

    return {
      mint: mintKeypair.publicKey,
      signature
    };
  }

  private async buildCreateTokenTransaction(
    mint: Keypair,
    creator: Keypair,
    metadata: TokenMetadata,
    metadataUri: string,
    initialBuy: number
  ): Transaction {
    const modeConfig = this.getModeConfig();

    // Derive PDAs
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mint.publicKey.toBuffer()],
      PUMP_FUN_PROGRAM_ID
    );

    const [associatedBondingCurve] = PublicKey.findProgramAddressSync(
      [
        bondingCurve.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer()
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const [metadata PDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
        mint.publicKey.toBuffer()
      ],
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );

    // Create instruction data
    const instructionData = Buffer.concat([
      Buffer.from([0x18, 0x1e, 0xc8, 0x28, 0x05, 0x1c, 0x07, 0x77]), // discriminator for create
      Buffer.from(metadata.name),
      Buffer.alloc(32 - metadata.name.length),
      Buffer.from(metadata.symbol),
      Buffer.alloc(16 - metadata.symbol.length),
      Buffer.from(metadataUri),
      Buffer.alloc(200 - metadataUri.length)
    ]);

    const keys = [
      { pubkey: mint.publicKey, isSigner: true, isWritable: true },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: PUMP_FUN_GLOBAL, isSigner: false, isWritable: false },
      { pubkey: metadataPDA, isSigner: false, isWritable: true },
      { pubkey: creator.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_EVENT_AUTHORITY, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false }
    ];

    const createIx = new TransactionInstruction({
      keys,
      programId: PUMP_FUN_PROGRAM_ID,
      data: instructionData
    });

    const tx = new Transaction();

    // Add compute budget
    tx.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 })
    );

    tx.add(createIx);

    // Add initial buy if specified
    if (initialBuy > 0) {
      const buyIx = await this.buildBuyInstruction({
        mint: mint.publicKey,
        amount: initialBuy,
        slippage: 500, // 5%
        buyer: creator
      });
      tx.add(buyIx);
    }

    tx.feePayer = creator.publicKey;
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

    return tx;
  }

  // ============================================
  // Metadata Upload
  // ============================================

  private async uploadMetadata(metadata: TokenMetadata): Promise<string> {
    try {
      // Upload image first
      const imageUri = await this.uploadImage(metadata.image);

      // Create metadata JSON
      const metadataJson = {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: imageUri,
        showName: metadata.showName || 'true',
        createdOn: 'https://pump.fun',
        twitter: metadata.twitter || '',
        telegram: metadata.telegram || '',
        website: metadata.website || ''
      };

      // Upload metadata JSON
      const formData = new FormData();
      formData.append('file', JSON.stringify(metadataJson), {
        filename: 'metadata.json',
        contentType: 'application/json'
      });

      const response = await retryAsync(
        () =>
          axios.post(`${API_ENDPOINTS.PUMP_FUN_UPLOAD}`, formData, {
            headers: formData.getHeaders()
          }),
        3
      );

      return response.data.metadataUri;
    } catch (error) {
      logger.error('Failed to upload metadata', error);
      throw error;
    }
  }

  private async uploadImage(imagePath: string): Promise<string> {
    const formData = new FormData();

    if (imagePath.startsWith('http')) {
      // Download and upload
      const response = await axios.get(imagePath, { responseType: 'arraybuffer' });
      formData.append('file', Buffer.from(response.data), {
        filename: 'image.png'
      });
    } else {
      // Upload local file
      formData.append('file', fs.createReadStream(imagePath));
    }

    const response = await retryAsync(
      () =>
        axios.post(`${API_ENDPOINTS.PUMP_FUN_UPLOAD}`, formData, {
          headers: formData.getHeaders()
        }),
      3
    );

    return response.data.imageUri;
  }

  // ============================================
  // Buy/Sell Instructions
  // ============================================

  async buildBuyInstruction(params: PumpFunBuyParams): TransactionInstruction {
    const { mint, amount, slippage, buyer } = params;

    // Get bonding curve
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mint.toBuffer()],
      PUMP_FUN_PROGRAM_ID
    );

    const [associatedBondingCurve] = PublicKey.findProgramAddressSync(
      [bondingCurve.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Get buyer's ATA
    const buyerAta = await getAssociatedTokenAddress(mint, buyer.publicKey);

    // Calculate tokens to receive
    const state = await this.getBondingCurveState(bondingCurve);
    const tokensOut = this.calculateBuyTokens(amount, state);
    const minTokensOut = tokensOut * (1 - slippage / 10000);

    // Create instruction
    const instructionData = Buffer.concat([
      Buffer.from([0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea]), // buy discriminator
      new BN(amount * LAMPORTS_PER_SOL).toArrayLike(Buffer, 'le', 8),
      new BN(Math.floor(minTokensOut)).toArrayLike(Buffer, 'le', 8)
    ]);

    const keys = [
      { pubkey: PUMP_FUN_GLOBAL, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_FEE_RECIPIENT, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: buyerAta, isSigner: false, isWritable: true },
      { pubkey: buyer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_EVENT_AUTHORITY, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false }
    ];

    return new TransactionInstruction({
      keys,
      programId: PUMP_FUN_PROGRAM_ID,
      data: instructionData
    });
  }

  async buildSellInstruction(params: PumpFunSellParams): Promise<TransactionInstruction> {
    const { mint, amount, slippage, seller } = params;

    // Get bonding curve
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mint.toBuffer()],
      PUMP_FUN_PROGRAM_ID
    );

    const [associatedBondingCurve] = PublicKey.findProgramAddressSync(
      [bondingCurve.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Get seller's ATA
    const sellerAta = await getAssociatedTokenAddress(mint, seller.publicKey);

    // Calculate SOL to receive
    const state = await this.getBondingCurveState(bondingCurve);
    const solOut = this.calculateSellSol(amount, state);
    const minSolOut = solOut * (1 - slippage / 10000);

    // Create instruction
    const instructionData = Buffer.concat([
      Buffer.from([0x33, 0xe6, 0x85, 0xa4, 0x01, 0x7f, 0x83, 0xad]), // sell discriminator
      new BN(Math.floor(amount)).toArrayLike(Buffer, 'le', 8),
      new BN(Math.floor(minSolOut * LAMPORTS_PER_SOL)).toArrayLike(Buffer, 'le', 8)
    ]);

    const keys = [
      { pubkey: PUMP_FUN_GLOBAL, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_FEE_RECIPIENT, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: sellerAta, isSigner: false, isWritable: true },
      { pubkey: seller.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_EVENT_AUTHORITY, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false }
    ];

    return new TransactionInstruction({
      keys,
      programId: PUMP_FUN_PROGRAM_ID,
      data: instructionData
    });
  }

  // ============================================
  // Bonding Curve Calculations
  // ============================================

  private async getBondingCurveState(bondingCurve: PublicKey): Promise<BondingCurveState> {
    const accountInfo = await this.connection.getAccountInfo(bondingCurve);

    if (!accountInfo) {
      throw new Error('Bonding curve not found');
    }

    // Parse bonding curve state (layout depends on pump.fun implementation)
    const data = accountInfo.data;

    return {
      virtualTokenReserves: BigInt(data.readBigUInt64LE(8)),
      virtualSolReserves: BigInt(data.readBigUInt64LE(16)),
      realTokenReserves: BigInt(data.readBigUInt64LE(24)),
      realSolReserves: BigInt(data.readBigUInt64LE(32)),
      tokenTotalSupply: BigInt(data.readBigUInt64LE(40)),
      complete: data.readUInt8(48) === 1
    };
  }

  private calculateBuyTokens(solAmount: number, state: BondingCurveState): number {
    const modeConfig = this.getModeConfig();
    const speedMultiplier = modeConfig.bondingCurveSpeed;

    const solAmountLamports = BigInt(Math.floor(solAmount * LAMPORTS_PER_SOL));

    // Apply mode-specific speed multiplier
    const adjustedSolAmount = BigInt(Math.floor(Number(solAmountLamports) * speedMultiplier));

    // Constant product formula: x * y = k
    const tokensOut =
      (adjustedSolAmount * state.virtualTokenReserves) /
      (state.virtualSolReserves + adjustedSolAmount);

    return Number(tokensOut);
  }

  private calculateSellSol(tokenAmount: number, state: BondingCurveState): number {
    const modeConfig = this.getModeConfig();
    const speedMultiplier = modeConfig.bondingCurveSpeed;

    const tokenAmountBigInt = BigInt(Math.floor(tokenAmount));

    // Constant product formula
    const solOut =
      (tokenAmountBigInt * state.virtualSolReserves) /
      (state.virtualTokenReserves + tokenAmountBigInt);

    // Apply mode-specific speed multiplier (inverse for sells)
    const adjustedSolOut = Number(solOut) / speedMultiplier;

    return adjustedSolOut / LAMPORTS_PER_SOL;
  }

  // ============================================
  // Token Information
  // ============================================

  async getTokenInfo(mint: PublicKey): Promise<PumpFunToken | null> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.PUMP_FUN_API}/coins/${mint.toBase58()}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch token info for ${mint.toBase58()}`, error);
      return null;
    }
  }

  async getNewTokens(limit: number = 50): Promise<PumpFunToken[]> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.PUMP_FUN_API}/coins`, {
        params: { limit, sort: 'created_timestamp', order: 'desc' }
      });
      return response.data.coins || [];
    } catch (error) {
      logger.error('Failed to fetch new tokens', error);
      return [];
    }
  }

  // ============================================
  // Transaction Helpers
  // ============================================

  private async sendAndConfirm(
    transaction: Transaction,
    signers: Keypair[]
  ): Promise<string> {
    transaction.sign(...signers);

    const signature = await this.connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        maxRetries: 3
      }
    );

    await this.connection.confirmTransaction(signature, 'confirmed');

    return signature;
  }
}
