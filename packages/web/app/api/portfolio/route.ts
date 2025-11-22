import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { Bundler } from '@pump-bundler/core/bundler';
import { RPCManager } from '@pump-bundler/core/rpc-manager';
import { AppConfig } from '@pump-bundler/types';
import { loadJson, loadKeypairFromString } from '@pump-bundler/utils';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG_PATH = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');

export async function GET() {
  try {
    // Load config
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: 'Configuration not found. Please run setup first.' },
        { status: 404 }
      );
    }

    const config = loadJson<AppConfig>(CONFIG_PATH, {} as AppConfig);

    // Initialize services
    const rpcManager = new RPCManager(config.rpc);
    const connection = rpcManager.getCurrentConnection();
    const mainWallet = loadKeypairFromString(config.wallet.mainWalletPrivateKey);

    const bundler = new Bundler(connection, mainWallet, config.defaultMode);

    // Try to load saved bundler wallets
    const walletsPath = path.join(process.cwd(), '..', '..', 'keys', 'bundler-wallets.json');
    if (fs.existsSync(walletsPath)) {
      const walletsData = JSON.parse(fs.readFileSync(walletsPath, 'utf-8'));
      const wallets = walletsData.map((k: string) => loadKeypairFromString(k));
      bundler.getPortfolio().addWallets(wallets);
    }

    // Get portfolio data
    const portfolio = await bundler.getPortfolio().getPortfolio();
    const holdings = await bundler.getPortfolio().getHoldingsSummary();
    const stats = bundler.getPortfolio().getStats();

    return NextResponse.json({
      success: true,
      portfolio: {
        totalInvested: portfolio.totalInvested,
        currentValue: portfolio.currentValue,
        unrealizedPnL: portfolio.unrealizedPnL,
        realizedPnL: portfolio.realizedPnL,
        tokens: portfolio.tokens.map(t => ({
          tokenAddress: t.tokenAddress,
          symbol: t.tokenStats.symbol,
          totalAmount: t.totalAmount,
          averagePrice: t.averagePrice,
          currentValue: t.currentValue,
          unrealizedPnL: t.unrealizedPnL,
          walletCount: t.wallets.length,
        })),
      },
      holdings: {
        totalWallets: holdings.totalWallets,
        walletsWithTokens: holdings.walletsWithTokens,
        totalTokens: holdings.totalTokens,
        totalValueSOL: holdings.totalValueSOL,
      },
      stats: {
        totalBuys: stats.totalBuys,
        totalSells: stats.totalSells,
        uniqueTokens: stats.uniqueTokens,
      },
    });

  } catch (error: any) {
    console.error('Portfolio fetch failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}
