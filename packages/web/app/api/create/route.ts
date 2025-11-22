import { NextRequest, NextResponse } from 'next/server';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Bundler } from '@pump-bundler/core/bundler';
import { RPCManager } from '@pump-bundler/core/rpc-manager';
import { AppConfig, StealthMode } from '@pump-bundler/types';
import { loadJson, loadKeypairFromString } from '@pump-bundler/utils';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG_PATH = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      symbol,
      description,
      image,
      twitter,
      telegram,
      website,
      buyAmount,
      walletCount,
      stealthMode,
      firstBundlePercent,
      jitoEnabled,
      jitoTip,
      priorityFee,
    } = body;

    // Validation
    if (!name || !symbol || !description || !image) {
      return NextResponse.json(
        { error: 'Missing required fields: name, symbol, description, image' },
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

    // Override config with request params
    if (stealthMode) {
      config.bundleStrategy.antiDetection.stealthConfig = {
        ...config.bundleStrategy.antiDetection.stealthConfig!,
        mode: stealthMode as StealthMode,
        firstBundlePercent: firstBundlePercent || 70,
      };
    }

    if (jitoEnabled !== undefined) {
      config.jito.enabled = jitoEnabled;
    }

    if (jitoTip) {
      config.jito.tipAmount = jitoTip;
    }

    if (priorityFee) {
      config.bundleStrategy.priorityFee = priorityFee;
    }

    if (walletCount) {
      config.wallet.bundlerWalletCount = walletCount;
    }

    // Initialize services
    const rpcManager = new RPCManager(config.rpc);
    const connection = rpcManager.getCurrentConnection();
    const mainWallet = loadKeypairFromString(config.wallet.mainWalletPrivateKey);

    // Create bundler
    const bundler = new Bundler(connection, mainWallet, config.defaultMode);

    // Setup wallets
    await bundler.setupWallets(config.wallet.bundlerWalletCount);

    // Distribute SOL
    const totalAmount = buyAmount * config.wallet.bundlerWalletCount;
    await bundler.distributeSol(totalAmount + 1, config.bundleStrategy); // +1 for fees

    // Create and bundle token
    const result = await bundler.createAndBundleToken(
      {
        name,
        symbol,
        description,
        image,
        twitter,
        telegram,
        website,
      },
      config.bundleStrategy,
      buyAmount
    );

    // Save bundler wallets for later use
    const keysDir = path.join(process.cwd(), '..', '..', 'keys');
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }

    const walletKeys = bundler['bundlerWallets'].map(w =>
      JSON.stringify(Array.from(w.secretKey))
    );

    fs.writeFileSync(
      path.join(keysDir, 'bundler-wallets.json'),
      JSON.stringify(walletKeys, null, 2)
    );

    return NextResponse.json({
      success: true,
      tokenAddress: result.tokenAddress,
      transactions: result.transactions.length,
      successRate: result.successRate,
      averageConfirmationTime: result.averageConfirmationTime,
      mode: config.bundleStrategy.antiDetection.stealthConfig?.mode,
    });

  } catch (error: any) {
    console.error('Token creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Token creation failed' },
      { status: 500 }
    );
  }
}
