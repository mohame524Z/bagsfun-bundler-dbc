import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const ANALYTICS_PATH = path.join(process.cwd(), '..', '..', 'data', 'analytics.json');

interface TokenAnalytics {
  tokenAddress: string;
  name: string;
  symbol: string;
  createdAt: number;
  initialBuy: number;
  totalInvested: number;
  currentMarketCap: number;
  peakMarketCap: number;
  currentPrice: number;
  peakPrice: number;
  holders: number;
  volume24h: number;
  bondingCurveProgress: number;
  graduatedAt?: number;
  timeToGraduation?: number;
  successRate: number;
  pnl: number;
  pnlPercent: number;
  status: 'active' | 'graduated' | 'failed' | 'sold';
  rugRiskScore: number;
  transactions: number;
  avgConfirmationTime: number;
  bundleConfig: {
    walletCount: number;
    stealthMode: string;
    jitoEnabled: boolean;
  };
}

interface BundleAnalytics {
  bundleId: string;
  tokenAddress: string;
  timestamp: number;
  stealthMode: string;
  walletCount: number;
  totalSolSpent: number;
  successfulTxs: number;
  failedTxs: number;
  successRate: number;
  avgConfirmationTime: number;
  minConfirmationTime: number;
  maxConfirmationTime: number;
  jitoTipsSpent: number;
  priorityFeesSpent: number;
  totalFeesSpent: number;
  mevInteractions: number;
  blocksUsed: number;
  detectionRisk: 'low' | 'medium' | 'high';
  // Bundle-specific PnL (not total token PnL)
  bundlePnL?: number;
  bundlePnLPercent?: number;
  tokensBought?: number;
  currentValue?: number;
}

// Load analytics data
function loadAnalytics(): { tokens: TokenAnalytics[]; bundles: BundleAnalytics[] } {
  try {
    if (!fs.existsSync(ANALYTICS_PATH)) {
      return { tokens: [], bundles: [] };
    }
    const data = fs.readFileSync(ANALYTICS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { tokens: [], bundles: [] };
  }
}

// Save analytics data
function saveAnalytics(data: { tokens: TokenAnalytics[]; bundles: BundleAnalytics[] }): void {
  const dir = path.dirname(ANALYTICS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(ANALYTICS_PATH, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const analytics = loadAnalytics();

    switch (action) {
      case 'tokens': {
        // Return all token analytics
        return NextResponse.json({ success: true, tokens: analytics.tokens });
      }

      case 'bundles': {
        // Return all bundle analytics with PnL calculations
        const bundlesWithPnL = analytics.bundles.map(bundle => {
          // Calculate bundle-specific PnL if we have the data
          let bundlePnL = bundle.bundlePnL || 0;
          let bundlePnLPercent = bundle.bundlePnLPercent || 0;

          // If PnL not stored, try to calculate from current value
          if (bundle.currentValue !== undefined && bundle.tokensBought !== undefined) {
            const totalCost = bundle.totalSolSpent + bundle.totalFeesSpent;
            bundlePnL = bundle.currentValue - totalCost;
            bundlePnLPercent = totalCost > 0 ? (bundlePnL / totalCost) * 100 : 0;
          }

          return {
            ...bundle,
            bundlePnL,
            bundlePnLPercent,
          };
        });

        // Calculate bundle-specific summary stats
        const summary = {
          totalBundles: bundlesWithPnL.length,
          avgBundleSuccessRate: bundlesWithPnL.reduce((sum, b) => sum + b.successRate, 0) / (bundlesWithPnL.length || 1),
          avgConfirmationTime: bundlesWithPnL.reduce((sum, b) => sum + b.avgConfirmationTime, 0) / (bundlesWithPnL.length || 1),
          totalSolSpent: bundlesWithPnL.reduce((sum, b) => sum + b.totalSolSpent, 0),
          totalFeesSpent: bundlesWithPnL.reduce((sum, b) => sum + b.totalFeesSpent, 0),
          totalBundlePnL: bundlesWithPnL.reduce((sum, b) => sum + (b.bundlePnL || 0), 0),
          avgBundlePnL: bundlesWithPnL.reduce((sum, b) => sum + (b.bundlePnL || 0), 0) / (bundlesWithPnL.length || 1),
          profitableBundles: bundlesWithPnL.filter(b => (b.bundlePnL || 0) > 0).length,
        };

        return NextResponse.json({ success: true, bundles: bundlesWithPnL, summary });
      }

      case 'summary': {
        // Calculate summary stats
        const tokens = analytics.tokens;
        const bundles = analytics.bundles;

        const summary = {
          totalTokensCreated: tokens.length,
          activeTokens: tokens.filter(t => t.status === 'active').length,
          graduatedTokens: tokens.filter(t => t.status === 'graduated').length,
          failedTokens: tokens.filter(t => t.status === 'failed').length,

          totalBundles: bundles.length,
          avgBundleSuccessRate: bundles.reduce((sum, b) => sum + b.successRate, 0) / (bundles.length || 1),
          avgConfirmationTime: bundles.reduce((sum, b) => sum + b.avgConfirmationTime, 0) / (bundles.length || 1),

          totalInvested: tokens.reduce((sum, t) => sum + t.totalInvested, 0),
          totalPnL: tokens.reduce((sum, t) => sum + t.pnl, 0),
          avgPnLPercent: tokens.reduce((sum, t) => sum + t.pnlPercent, 0) / (tokens.length || 1),

          totalFeesSpent: bundles.reduce((sum, b) => sum + b.totalFeesSpent, 0),
          totalJitoTips: bundles.reduce((sum, b) => sum + b.jitoTipsSpent, 0),

          bestPerformer: tokens.reduce((best, t) => t.pnlPercent > best.pnlPercent ? t : best, tokens[0] || { pnlPercent: 0 }),
          worstPerformer: tokens.reduce((worst, t) => t.pnlPercent < worst.pnlPercent ? t : worst, tokens[0] || { pnlPercent: 0 }),

          avgTimeToGraduation: tokens
            .filter(t => t.graduatedAt)
            .reduce((sum, t) => sum + (t.timeToGraduation || 0), 0) / (tokens.filter(t => t.graduatedAt).length || 1),
        };

        return NextResponse.json({ success: true, summary });
      }

      case 'token': {
        const tokenAddress = searchParams.get('address');
        if (!tokenAddress) {
          return NextResponse.json({ error: 'Token address required' }, { status: 400 });
        }

        const token = analytics.tokens.find(t => t.tokenAddress === tokenAddress);
        if (!token) {
          return NextResponse.json({ error: 'Token not found' }, { status: 404 });
        }

        // Get bundles for this token
        const tokenBundles = analytics.bundles.filter(b => b.tokenAddress === tokenAddress);

        return NextResponse.json({ success: true, token, bundles: tokenBundles });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const analytics = loadAnalytics();

    switch (action) {
      case 'recordToken': {
        const { tokenData } = body;

        // Add or update token analytics
        const existingIndex = analytics.tokens.findIndex(t => t.tokenAddress === tokenData.tokenAddress);
        if (existingIndex >= 0) {
          analytics.tokens[existingIndex] = { ...analytics.tokens[existingIndex], ...tokenData };
        } else {
          analytics.tokens.push(tokenData);
        }

        saveAnalytics(analytics);
        return NextResponse.json({ success: true });
      }

      case 'recordBundle': {
        const { bundleData } = body;

        analytics.bundles.push(bundleData);
        saveAnalytics(analytics);
        return NextResponse.json({ success: true });
      }

      case 'updateToken': {
        const { tokenAddress, updates } = body;

        const tokenIndex = analytics.tokens.findIndex(t => t.tokenAddress === tokenAddress);
        if (tokenIndex >= 0) {
          analytics.tokens[tokenIndex] = { ...analytics.tokens[tokenIndex], ...updates };
          saveAnalytics(analytics);
          return NextResponse.json({ success: true });
        } else {
          return NextResponse.json({ error: 'Token not found' }, { status: 404 });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics operation failed:', error);
    return NextResponse.json({ error: 'Analytics operation failed' }, { status: 500 });
  }
}
