import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Bundler } from '@pump-bundler/core/bundler';
import { RPCManager } from '@pump-bundler/core/rpc-manager';
import { AppConfig, SellMode } from '@pump-bundler/types';
import { loadJson, loadKeypairFromString } from '@pump-bundler/utils';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG_PATH = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tokenAddress,
      mode,
      percentage,
      slippage,
      priorityFee,
      jitoTip,
      jitoBundleSize,
      delayBetweenSells,
    } = body;

    // Validation
    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Token address is required' },
        { status: 400 }
      );
    }

    if (!['regular', 'bundle', 'jito'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid sell mode. Use: regular, bundle, or jito' },
        { status: 400 }
      );
    }

    const sellPercentage = percentage || 100;
    if (sellPercentage < 1 || sellPercentage > 100) {
      return NextResponse.json(
        { error: 'Percentage must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Load config
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: 'Configuration not found. Please run setup first.' },
        { status: 404 }
      );
    }

    const config = loadJson<AppConfig>(CONFIG_PATH, {} as AppConfig);

    // Load bundler wallets
    const walletsPath = path.join(process.cwd(), '..', '..', 'keys', 'bundler-wallets.json');
    if (!fs.existsSync(walletsPath)) {
      return NextResponse.json(
        { error: 'No bundler wallets found. Create a token first.' },
        { status: 404 }
      );
    }

    const walletsData = JSON.parse(fs.readFileSync(walletsPath, 'utf-8'));
    const wallets = walletsData.map((k: string) => loadKeypairFromString(k));

    // Initialize services
    const rpcManager = new RPCManager(config.rpc);
    const connection = rpcManager.getCurrentConnection();
    const mainWallet = loadKeypairFromString(config.wallet.mainWalletPrivateKey);

    const bundler = new Bundler(connection, mainWallet, config.defaultMode);
    const seller = bundler.getSeller();

    const tokenMint = new PublicKey(tokenAddress);

    // Execute sell
    const result = await seller.sell(tokenMint, wallets, {
      mode: mode as SellMode,
      sellPercentage,
      slippage: slippage || config.bundleStrategy.slippageProtection,
      priorityFee: priorityFee || config.bundleStrategy.priorityFee,
      jitoTipLamports: jitoTip
        ? jitoTip * LAMPORTS_PER_SOL
        : config.jito.enabled
        ? config.jito.tipAmount * LAMPORTS_PER_SOL
        : 10000,
      jitoBundleSize: jitoBundleSize || 20,
      delayBetweenSells: delayBetweenSells || 1000,
    });

    return NextResponse.json({
      success: true,
      mode: result.mode,
      successfulSells: result.successfulSells,
      failedSells: result.failedSells,
      totalSold: result.totalSold,
      totalReceived: result.totalReceived,
      totalPnL: result.totalPnL,
      duration: result.duration,
    });

  } catch (error: any) {
    console.error('Sell failed:', error);
    return NextResponse.json(
      { error: error.message || 'Sell operation failed' },
      { status: 500 }
    );
  }
}
