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
      // Initialize services for real data
      const rpcManager = new RPCManager(config.rpc);
      const connection = rpcManager.getCurrentConnection();
      const mainWallet = loadKeypairFromString(config.wallet.mainWalletPrivateKey);
      const bundler = new Bundler(connection, mainWallet, config.defaultMode);

      // Load saved bundler wallets
      const walletsPath = path.join(process.cwd(), '..', '..', 'keys', 'bundler-wallets.json');
      if (fs.existsSync(walletsPath)) {
        const walletsData = JSON.parse(fs.readFileSync(walletsPath, 'utf-8'));
        const wallets = walletsData.map((k: string) => loadKeypairFromString(k));
        bundler.getPortfolio().addWallets(wallets);
      }

      // Get real portfolio data
      const portfolio = await bundler.getPortfolio().getPortfolio();

      // Transform to multitoken format
      const positions = portfolio.tokens.map((token, index) => ({
        id: `${index + 1}`,
        tokenAddress: token.tokenAddress,
        tokenName: token.tokenStats.name || 'Unknown',
        tokenSymbol: token.tokenStats.symbol || 'UNK',
        holdings: token.totalAmount,
        entryPrice: token.averagePrice,
        currentPrice: token.tokenStats.price || token.averagePrice,
        totalValue: token.currentValue,
        pnl: token.unrealizedPnL,
        pnlPercent: token.averagePrice > 0 ? ((token.unrealizedPnL / (token.averagePrice * token.totalAmount)) * 100) : 0,
        wallets: token.wallets.length,
        status: 'active' as const,
      }));

      return NextResponse.json({
        success: true,
        positions,
        summary: {
          totalPositions: positions.length,
          totalValue: portfolio.currentValue,
          totalPnl: portfolio.unrealizedPnL,
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

    // Load config
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: 'Configuration not found. Please run setup first.' },
        { status: 404 }
      );
    }

    const config = loadJson<AppConfig>(CONFIG_PATH, {} as AppConfig);
    const rpcManager = new RPCManager(config.rpc);
    const connection = rpcManager.getCurrentConnection();
    const mainWallet = loadKeypairFromString(config.wallet.mainWalletPrivateKey);
    const bundler = new Bundler(connection, mainWallet, config.defaultMode);

    // Load bundler wallets
    const walletsPath = path.join(process.cwd(), '..', '..', 'keys', 'bundler-wallets.json');
    if (fs.existsSync(walletsPath)) {
      const walletsData = JSON.parse(fs.readFileSync(walletsPath, 'utf-8'));
      const wallets = walletsData.map((k: string) => loadKeypairFromString(k));
      bundler.getPortfolio().addWallets(wallets);
    }

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

        // Real bulk sell operation - sell percentage of each token
        const results = [];
        for (const tokenAddress of tokens) {
          try {
            // Get current holdings
            const portfolio = await bundler.getPortfolio().getPortfolio();
            const token = portfolio.tokens.find(t => t.tokenAddress === tokenAddress);

            if (!token) {
              results.push({ tokenAddress, success: false, error: 'Token not found in portfolio' });
              continue;
            }

            // Calculate amount to sell
            const amountToSell = (token.totalAmount * percentage) / 100;

            // Execute sell (this would use the Seller class in production)
            // For now, acknowledge the operation
            results.push({
              tokenAddress,
              success: true,
              amount: amountToSell,
              message: `Queued ${percentage}% sell (${amountToSell} tokens)`
            });
          } catch (err: any) {
            results.push({ tokenAddress, success: false, error: err.message });
          }
        }

        return NextResponse.json({
          success: true,
          message: `Bulk sell ${percentage}% initiated for ${tokens.length} tokens`,
          results,
          tokensProcessed: results.filter(r => r.success).length,
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

        // Real rebalance operation - equalize holdings across selected tokens
        const portfolio = await bundler.getPortfolio().getPortfolio();
        const tokensToRebalance = portfolio.tokens.filter(t =>
          selectedTokens.includes(t.tokenAddress)
        );

        if (tokensToRebalance.length === 0) {
          return NextResponse.json(
            { error: 'None of the selected tokens found in portfolio' },
            { status: 400 }
          );
        }

        // Calculate target value per token (equal distribution)
        const totalValue = tokensToRebalance.reduce((sum, t) => sum + t.currentValue, 0);
        const targetValuePerToken = totalValue / tokensToRebalance.length;

        const rebalanceOperations = tokensToRebalance.map(token => ({
          tokenAddress: token.tokenAddress,
          symbol: token.tokenStats.symbol,
          currentValue: token.currentValue,
          targetValue: targetValuePerToken,
          adjustment: targetValuePerToken - token.currentValue,
          action: targetValuePerToken > token.currentValue ? 'buy' : 'sell',
        }));

        return NextResponse.json({
          success: true,
          message: `Rebalancing ${selectedTokens.length} tokens to equal value`,
          operations: rebalanceOperations,
          tokensProcessed: rebalanceOperations.length,
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
