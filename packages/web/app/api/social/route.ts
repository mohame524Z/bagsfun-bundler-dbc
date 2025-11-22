import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SOCIAL_FILE = path.join(DATA_DIR, 'social-trading.json');

interface Trader {
  id: string;
  username: string;
  roi: number;
  followers: number;
  trades24h: number;
  winRate: number;
  totalProfit: number;
  isFollowing?: boolean;
}

interface FollowData {
  userId: string;
  following: string[];
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SOCIAL_FILE)) {
  const defaultData = {
    traders: [
      { id: 'trader_1', username: 'SolanaWhale', roi: 245.5, followers: 1234, trades24h: 15, winRate: 78.5, totalProfit: 125.5 },
      { id: 'trader_2', username: 'PumpMaster', roi: 189.2, followers: 987, trades24h: 23, winRate: 71.2, totalProfit: 98.3 },
      { id: 'trader_3', username: 'DiamondHands', roi: 156.8, followers: 756, trades24h: 12, winRate: 82.1, totalProfit: 76.4 },
      { id: 'trader_4', username: 'QuickFlip', roi: 134.3, followers: 543, trades24h: 45, winRate: 65.7, totalProfit: 54.2 },
      { id: 'trader_5', username: 'MoonHunter', roi: 112.7, followers: 432, trades24h: 18, winRate: 69.3, totalProfit: 42.1 },
    ],
    follows: { userId: 'current_user', following: [] },
  };
  fs.writeFileSync(SOCIAL_FILE, JSON.stringify(defaultData, null, 2));
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(SOCIAL_FILE, 'utf-8'));
  } catch {
    return { traders: [], follows: { userId: 'current_user', following: [] } };
  }
}

function saveData(data: any) {
  fs.writeFileSync(SOCIAL_FILE, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const data = loadData();
    const traders = data.traders.map((t: Trader) => ({
      ...t,
      isFollowing: data.follows.following.includes(t.id),
    }));

    return NextResponse.json({ success: true, traders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, traderId } = body;
    const data = loadData();

    if (action === 'follow') {
      if (!data.follows.following.includes(traderId)) {
        data.follows.following.push(traderId);

        // Increment follower count
        const trader = data.traders.find((t: Trader) => t.id === traderId);
        if (trader) {
          trader.followers++;
        }

        saveData(data);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'unfollow') {
      data.follows.following = data.follows.following.filter((id: string) => id !== traderId);

      // Decrement follower count
      const trader = data.traders.find((t: Trader) => t.id === traderId);
      if (trader && trader.followers > 0) {
        trader.followers--;
      }

      saveData(data);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
