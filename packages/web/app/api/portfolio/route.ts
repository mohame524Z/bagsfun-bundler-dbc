import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { Bundler } from '@pump-bundler/core/bundler';
import { RPCManager } from '@pump-bundler/core/rpc-manager';
import { AppConfig } from '@pump-bundler/types';
import { loadJson, loadKeypairFromString } from '@pump-bundler/utils';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG_PATH = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Load config
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: 'Configuration not found. Please run setup first.' },
        { status: 404 }
      );
    }

    const config = loadJson<AppConfig>(CONFIG_PATH, {} as AppConfig);

    // Handle multitoken action for Multi-Token Portfolio Manager
    if (action === 'multitoken') {
      // Return mock data for now - in production would fetch real multi-token positions
      const mockPositions = [
        {
          id: '1',
          tokenAddress: 'TokenAddr1...',
          tokenName: 'Sample Token 1',
          tokenSymbol: 'ST1',
          holdings: 1000000,
          entryPrice: 0.0001,
          currentPrice: 0.00015,
          totalValue: 150,
          pnl: 50,
          pnlPercent: 50,
          wallets: 12,
          status: 'active' as const,
        },
        {
          id: '2',
          tokenAddress: 'TokenAddr2...',
          tokenName: 'Sample Token 2',
          tokenSymbol: 'ST2',
          holdings: 500000,
          entryPrice: 0.0002,
          currentPrice: 0.00018,
          totalValue: 90,
          pnl: -10,
          pnlPercent: -10,
          wallets: 8,
          status: 'active' as const,
        },
      ];

      return NextResponse.json({
        success: true,
        positions: mockPositions,
        summary: {
          totalPositions: mockPositions.length,
          totalValue: mockPositions.reduce((sum, p) => sum + p.totalValue, 0),
          totalPnl: mockPositions.reduce((sum, p) => sum + p.pnl, 0),
        },
      });
    }

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'bulkSell': {
        const { tokens, percentage } = body;

        if (!Array.isArray(tokens) || tokens.length === 0) {
          return NextResponse.json(
            { error: 'No tokens specified' },
            { status: 400 }
          );
        }

        if (!percentage || percentage < 0 || percentage > 100) {
          return NextResponse.json(
            { error: 'Invalid percentage' },
            { status: 400 }
          );
        }

        // Mock bulk sell operation
        return NextResponse.json({
          success: true,
          message: `Bulk sell ${percentage}% initiated for ${tokens.length} tokens`,
          tokensProcessed: tokens.length,
        });
      }

      case 'rebalance': {
        const { selectedTokens } = body;

        if (!Array.isArray(selectedTokens) || selectedTokens.length === 0) {
          return NextResponse.json(
            { error: 'No tokens selected for rebalancing' },
            { status: 400 }
          );
        }

        // Mock rebalance operation
        return NextResponse.json({
          success: true,
          message: `Rebalancing ${selectedTokens.length} tokens`,
          tokensProcessed: selectedTokens.length,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Portfolio operation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Portfolio operation failed' },
      { status: 500 }
    );
  }
}
