import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const BENCHMARKS_FILE = path.join(DATA_DIR, 'benchmarks.json');

interface UserPerformance {
  userId: string;
  username: string;
  totalProfit: number;
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  avgHoldTime: number;
  successfulGraduations: number;
  rugsPrevented: number;
}

interface BenchmarkData {
  timeframe: '24h' | '7d' | '30d' | 'all';
  userPerformance: UserPerformance;
  percentiles: {
    profit: { p25: number; p50: number; p75: number; p90: number };
    winRate: { p25: number; p50: number; p75: number; p90: number };
    trades: { p25: number; p50: number; p75: number; p90: number };
  };
  ranking: {
    profit: number;
    winRate: number;
    trades: number;
    overall: number;
  };
  totalUsers: number;
  updatedAt: number;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadAnalytics() {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
    }
  } catch {}
  return { tokens: [], bundles: [], summary: {} };
}

function loadBenchmarks(): Record<string, BenchmarkData> {
  try {
    if (fs.existsSync(BENCHMARKS_FILE)) {
      return JSON.parse(fs.readFileSync(BENCHMARKS_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveBenchmarks(data: Record<string, BenchmarkData>) {
  fs.writeFileSync(BENCHMARKS_FILE, JSON.stringify(data, null, 2));
}

function calculateBenchmarks(timeframe: '24h' | '7d' | '30d' | 'all'): BenchmarkData {
  const analytics = loadAnalytics();

  // Calculate current user performance from analytics
  const tokens = analytics.tokens || [];
  const summary = analytics.summary || {};

  const now = Date.now();
  const timeframeLimits: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    'all': Infinity,
  };

  const limit = timeframeLimits[timeframe];
  const filteredTokens = tokens.filter((t: any) => (now - t.createdAt) <= limit);

  const totalProfit = filteredTokens.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
  const totalTrades = filteredTokens.length;
  const successfulTrades = filteredTokens.filter((t: any) => (t.pnl || 0) > 0).length;
  const winRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
  const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;
  const avgHoldTime = filteredTokens.reduce((sum: number, t: any) => {
    if (t.sellTime && t.createdAt) {
      return sum + (t.sellTime - t.createdAt);
    }
    return sum;
  }, 0) / Math.max(1, filteredTokens.filter((t: any) => t.sellTime).length);

  const graduations = filteredTokens.filter((t: any) => t.graduated).length;
  const rugsPrevented = filteredTokens.filter((t: any) => t.rugRisk && t.rugRisk > 70 && (t.pnl || 0) >= 0).length;

  // Generate simulated network benchmarks (in production, this would aggregate all users)
  // We'll create a realistic distribution based on current user performance
  const baseProfit = Math.max(0, totalProfit);
  const baseWinRate = Math.max(0, Math.min(100, winRate));
  const baseTrades = Math.max(1, totalTrades);

  // Generate percentile data (simulated community performance)
  const percentiles = {
    profit: {
      p25: baseProfit * 0.3,
      p50: baseProfit * 0.6,
      p75: baseProfit * 1.2,
      p90: baseProfit * 2.0,
    },
    winRate: {
      p25: Math.min(100, baseWinRate * 0.6),
      p50: Math.min(100, baseWinRate * 0.8),
      p75: Math.min(100, baseWinRate * 1.1),
      p90: Math.min(100, baseWinRate * 1.3),
    },
    trades: {
      p25: Math.max(1, Math.floor(baseTrades * 0.4)),
      p50: Math.max(1, Math.floor(baseTrades * 0.7)),
      p75: Math.max(1, Math.floor(baseTrades * 1.5)),
      p90: Math.max(1, Math.floor(baseTrades * 3.0)),
    },
  };

  // Calculate rankings (percentile position)
  function calculateRank(value: number, percentileData: any): number {
    if (value >= percentileData.p90) return 90;
    if (value >= percentileData.p75) return 75 + ((value - percentileData.p75) / (percentileData.p90 - percentileData.p75)) * 15;
    if (value >= percentileData.p50) return 50 + ((value - percentileData.p50) / (percentileData.p75 - percentileData.p50)) * 25;
    if (value >= percentileData.p25) return 25 + ((value - percentileData.p25) / (percentileData.p50 - percentileData.p25)) * 25;
    return (value / percentileData.p25) * 25;
  }

  const profitRank = calculateRank(totalProfit, percentiles.profit);
  const winRateRank = calculateRank(winRate, percentiles.winRate);
  const tradesRank = calculateRank(totalTrades, percentiles.trades);
  const overallRank = (profitRank + winRateRank + tradesRank) / 3;

  const userPerformance: UserPerformance = {
    userId: 'current_user',
    username: 'You',
    totalProfit,
    totalTrades,
    winRate,
    avgProfit,
    avgHoldTime,
    successfulGraduations: graduations,
    rugsPrevented,
  };

  // Simulate 1000-5000 users in the network
  const totalUsers = 1000 + Math.floor(Math.random() * 4000);

  return {
    timeframe,
    userPerformance,
    percentiles,
    ranking: {
      profit: Math.round(profitRank),
      winRate: Math.round(winRateRank),
      trades: Math.round(tradesRank),
      overall: Math.round(overallRank),
    },
    totalUsers,
    updatedAt: Date.now(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeframe = (searchParams.get('timeframe') || '24h') as '24h' | '7d' | '30d' | 'all';

  try {
    // Check if we have cached benchmarks (update every 5 minutes)
    const benchmarks = loadBenchmarks();
    const cached = benchmarks[timeframe];

    if (cached && (Date.now() - cached.updatedAt) < 5 * 60 * 1000) {
      return NextResponse.json({ success: true, data: cached });
    }

    // Calculate fresh benchmarks
    const data = calculateBenchmarks(timeframe);
    benchmarks[timeframe] = data;
    saveBenchmarks(benchmarks);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
