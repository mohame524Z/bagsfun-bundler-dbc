import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { Sniper } from '@pump-bundler/core/sniper';
import { RPCManager } from '@pump-bundler/core/rpc-manager';
import { AppConfig } from '@pump-bundler/types';
import { loadJson, loadKeypairFromString } from '@pump-bundler/utils';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG_PATH = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Load config
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: 'Configuration not found. Please run setup first.' },
        { status: 404 }
      );
    }

    const config = loadJson<AppConfig>(CONFIG_PATH, {} as AppConfig);

    if (!config.sniper || !config.sniper.enabled) {
      return NextResponse.json(
        { error: 'Sniper not configured. Please run setup first.' },
        { status: 400 }
      );
    }

    // Initialize services
    const rpcManager = new RPCManager(config.rpc);
    const connection = rpcManager.getCurrentConnection();
    const mainWallet = loadKeypairFromString(config.wallet.mainWalletPrivateKey);

    const sniper = new Sniper(connection, mainWallet, config.sniper);

    switch (action) {
      case 'start':
        // Note: Sniper is a long-running operation
        // In a production app, this should be handled with WebSockets or background jobs
        // For now, we'll just start it and return immediately
        sniper.start().catch(err => {
          console.error('Sniper error:', err);
        });

        return NextResponse.json({
          success: true,
          message: 'Sniper started',
        });

      case 'stop':
        sniper.stop();
        return NextResponse.json({
          success: true,
          message: 'Sniper stopped',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start or stop' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Sniper operation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Sniper operation failed' },
      { status: 500 }
    );
  }
}
