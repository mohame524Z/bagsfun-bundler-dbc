import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SENTIMENT_FILE = path.join(DATA_DIR, 'market-sentiment.json');

interface SentimentData {
  overallScore: number;
  fearGreedIndex: number;
  socialVolume: number;
  trendingTokens: Array<{
    symbol: string;
    address: string;
    mentions: number;
    sentiment: number;
  }>;
  lastUpdated: number;
}

function calculateSentiment(): SentimentData {
  // In production, this would aggregate data from:
  // - Twitter API
  // - Discord activity
  // - Telegram groups
  // - On-chain metrics
  // - Market data

  // For now, generate realistic sentiment based on time and randomness
  const hour = new Date().getHours();
  const baseScore = 50 + Math.sin(hour / 24 * Math.PI * 2) * 20;
  const noise = (Math.random() - 0.5) * 10;
  const overallScore = Math.max(0, Math.min(100, baseScore + noise));

  const fearGreedIndex = Math.max(0, Math.min(100, overallScore + (Math.random() - 0.5) * 15));
  const socialVolume = 1000 + Math.floor(Math.random() * 9000);

  const trendingTokens = [
    { symbol: 'BONK', address: 'DezXAZ...', mentions: Math.floor(Math.random() * 500) + 100, sentiment: Math.random() * 100 },
    { symbol: 'WIF', address: '85VBFQ...', mentions: Math.floor(Math.random() * 400) + 80, sentiment: Math.random() * 100 },
    { symbol: 'MYRO', address: 'HhJpBh...', mentions: Math.floor(Math.random() * 300) + 50, sentiment: Math.random() * 100 },
  ].sort((a, b) => b.mentions - a.mentions);

  return {
    overallScore: Math.round(overallScore),
    fearGreedIndex: Math.round(fearGreedIndex),
    socialVolume,
    trendingTokens,
    lastUpdated: Date.now(),
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check cache (refresh every 1 minute)
    if (fs.existsSync(SENTIMENT_FILE)) {
      const cached: SentimentData = JSON.parse(fs.readFileSync(SENTIMENT_FILE, 'utf-8'));
      if ((Date.now() - cached.lastUpdated) < 60 * 1000) {
        return NextResponse.json({ success: true, data: cached });
      }
    }

    // Calculate fresh sentiment
    const data = calculateSentiment();
    fs.writeFileSync(SENTIMENT_FILE, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
