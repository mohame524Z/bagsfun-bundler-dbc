import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const STRATEGIES_FILE = path.join(DATA_DIR, 'shared-strategies.json');

interface Strategy {
  id: string;
  name: string;
  description: string;
  category: 'bundling' | 'sniping' | 'volume' | 'selling';
  config: Record<string, any>;
  author: string;
  rating: number;
  downloads: number;
  createdAt: number;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(STRATEGIES_FILE)) {
  // Initialize with some default strategies
  const defaultStrategies: Strategy[] = [
    {
      id: 'strat_default_1',
      name: 'Safe Bundler',
      description: 'Conservative bundling strategy with low risk',
      category: 'bundling',
      config: {
        numWallets: 5,
        buyAmount: 0.05,
        stealthMode: 'HYBRID',
        antiMEV: true,
      },
      author: 'System',
      rating: 4.5,
      downloads: 1234,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
    {
      id: 'strat_default_2',
      name: 'Aggressive Sniper',
      description: 'Fast sniping with high success rate',
      category: 'sniping',
      config: {
        maxBuyAmount: 1.0,
        priorityFee: 0.001,
        slippage: 15,
        minLiquidity: 5,
      },
      author: 'System',
      rating: 4.8,
      downloads: 2567,
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    },
  ];
  fs.writeFileSync(STRATEGIES_FILE, JSON.stringify({ strategies: defaultStrategies }, null, 2));
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(STRATEGIES_FILE, 'utf-8'));
  } catch {
    return { strategies: [] };
  }
}

function saveData(data: any) {
  fs.writeFileSync(STRATEGIES_FILE, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    const data = loadData();
    let strategies = data.strategies;

    if (category && category !== 'all') {
      strategies = strategies.filter((s: Strategy) => s.category === category);
    }

    // Sort by rating * downloads (popularity)
    strategies.sort((a: Strategy, b: Strategy) =>
      (b.rating * b.downloads) - (a.rating * a.downloads)
    );

    return NextResponse.json({ success: true, strategies });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const data = loadData();

    if (action === 'upload') {
      const { name, description, category, config } = body;

      const newStrategy: Strategy = {
        id: `strat_${Date.now()}`,
        name,
        description,
        category,
        config,
        author: 'User', // Would be actual user ID in production
        rating: 0,
        downloads: 0,
        createdAt: Date.now(),
      };

      data.strategies.push(newStrategy);
      saveData(data);

      return NextResponse.json({ success: true, strategy: newStrategy });
    }

    if (action === 'download') {
      const { strategyId } = body;
      const strategy = data.strategies.find((s: Strategy) => s.id === strategyId);

      if (!strategy) {
        return NextResponse.json({ success: false, error: 'Strategy not found' }, { status: 404 });
      }

      strategy.downloads++;
      saveData(data);

      return NextResponse.json({ success: true, strategy });
    }

    if (action === 'rate') {
      const { strategyId, rating } = body;
      const strategy = data.strategies.find((s: Strategy) => s.id === strategyId);

      if (!strategy) {
        return NextResponse.json({ success: false, error: 'Strategy not found' }, { status: 404 });
      }

      // Simple average (in production would track individual ratings)
      strategy.rating = ((strategy.rating * strategy.downloads) + rating) / (strategy.downloads + 1);
      saveData(data);

      return NextResponse.json({ success: true, strategy });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
