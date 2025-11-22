import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ACHIEVEMENTS_FILE = path.join(DATA_DIR, 'achievements.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_bundle', name: 'First Bundle', description: 'Create your first token bundle', icon: '🎯', target: 1, metric: 'bundlesCreated' },
  { id: 'bundle_master', name: 'Bundle Master', description: 'Create 100 bundles', icon: '👑', target: 100, metric: 'bundlesCreated' },
  { id: 'profit_maker', name: 'Profit Maker', description: 'Make 10 SOL profit', icon: '💰', target: 10, metric: 'totalProfit' },
  { id: 'whale', name: 'Whale', description: 'Make 100 SOL profit', icon: '🐋', target: 100, metric: 'totalProfit' },
  { id: 'sniper_pro', name: 'Sniper Pro', description: 'Successfully snipe 50 tokens', icon: '🎯', target: 50, metric: 'successfulSnipes' },
  { id: 'graduate', name: 'Graduate', description: 'Graduate a token to Raydium', icon: '🎓', target: 1, metric: 'graduations' },
  { id: 'diamond_hands', name: 'Diamond Hands', description: 'Hold a token for 24+ hours', icon: '💎', target: 1, metric: 'longHolds' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Execute 10 trades in 1 minute', icon: '⚡', target: 10, metric: 'fastTrades' },
  { id: 'rug_survivor', name: 'Rug Survivor', description: 'Detect and avoid 5 rug pulls', icon: '🛡️', target: 5, metric: 'rugsPrevented' },
  { id: 'volume_king', name: 'Volume King', description: 'Generate 1000 SOL in volume', icon: '📊', target: 1000, metric: 'totalVolume' },
  { id: 'early_bird', name: 'Early Bird', description: 'Be in first 10 buyers', icon: '🐦', target: 10, metric: 'earlyBuys' },
  { id: 'perfect_week', name: 'Perfect Week', description: '7 days of only profitable trades', icon: '⭐', target: 7, metric: 'profitDays' },
  { id: 'diversified', name: 'Diversified', description: 'Hold 20+ different tokens', icon: '🌈', target: 20, metric: 'uniqueTokens' },
  { id: 'educator', name: 'Educator', description: 'Share 10 strategies', icon: '📚', target: 10, metric: 'strategiesShared' },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Follow 25 traders', icon: '🦋', target: 25, metric: 'following' },
  { id: 'god_mode', name: 'God Mode', description: '95%+ win rate over 100 trades', icon: '👼', target: 95, metric: 'winRate' },
];

function loadAnalytics() {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
    }
  } catch {}
  return { tokens: [], bundles: [], summary: {} };
}

function loadAchievements(): Achievement[] {
  try {
    if (fs.existsSync(ACHIEVEMENTS_FILE)) {
      return JSON.parse(fs.readFileSync(ACHIEVEMENTS_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveAchievements(achievements: Achievement[]) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(ACHIEVEMENTS_FILE, JSON.stringify(achievements, null, 2));
}

function calculateMetrics(analytics: any): Record<string, number> {
  const tokens = analytics.tokens || [];
  const bundles = analytics.bundles || [];
  const summary = analytics.summary || {};

  const totalProfit = tokens.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
  const graduations = tokens.filter((t: any) => t.graduated).length;
  const rugsPrevented = tokens.filter((t: any) => t.rugRisk && t.rugRisk > 70 && (t.pnl || 0) >= 0).length;
  const successfulTrades = tokens.filter((t: any) => (t.pnl || 0) > 0).length;
  const totalTrades = tokens.length;
  const winRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;

  return {
    bundlesCreated: bundles.length,
    totalProfit,
    successfulSnipes: summary.successfulSnipes || 0,
    graduations,
    longHolds: tokens.filter((t: any) => {
      if (t.sellTime && t.createdAt) {
        return (t.sellTime - t.createdAt) >= 24 * 60 * 60 * 1000;
      }
      return false;
    }).length,
    fastTrades: 0, // Would require timestamp tracking
    rugsPrevented,
    totalVolume: summary.totalVolume || 0,
    earlyBuys: summary.earlyBuys || 0,
    profitDays: 0, // Would require daily tracking
    uniqueTokens: tokens.length,
    strategiesShared: 0, // Would come from strategies API
    following: 0, // Would come from social API
    winRate: totalTrades >= 100 ? winRate : 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const analytics = loadAnalytics();
    const metrics = calculateMetrics(analytics);
    let achievements = loadAchievements();

    // Initialize if empty
    if (achievements.length === 0) {
      achievements = ACHIEVEMENT_DEFINITIONS.map(def => ({
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        progress: 0,
        target: def.target,
        unlocked: false,
      }));
    }

    // Update progress
    achievements.forEach(achievement => {
      const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === achievement.id);
      if (def) {
        const currentValue = metrics[def.metric] || 0;
        achievement.progress = Math.min(currentValue, def.target);

        if (!achievement.unlocked && achievement.progress >= def.target) {
          achievement.unlocked = true;
          achievement.unlockedAt = Date.now();
        }
      }
    });

    saveAchievements(achievements);

    return NextResponse.json({ success: true, achievements });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
