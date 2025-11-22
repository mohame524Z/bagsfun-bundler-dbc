import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const AUTOSELL_CONFIG_PATH = path.join(process.cwd(), '..', '..', 'data', 'autosell-strategies.json');

interface AutoSellStrategy {
  id: string;
  name: string;
  tokenAddress: string;
  enabled: boolean;
  type: 'takeProfit' | 'stopLoss' | 'trailing' | 'ladder' | 'timeBased' | 'volumeBased';

  // Take Profit
  takeProfitPercent?: number;
  sellPercentage?: number; // % of holdings to sell

  // Stop Loss
  stopLossPercent?: number;

  // Trailing Stop
  trailingPercent?: number;
  activationPercent?: number; // Start trailing after this gain

  // Ladder (sell in steps)
  ladderSteps?: {
    priceMultiplier: number; // e.g., 2x, 5x, 10x
    sellPercent: number; // % of remaining to sell
  }[];

  // Time Based
  sellAfterMinutes?: number;

  // Volume Based
  volumeDropPercent?: number; // Sell if 24h volume drops by X%

  // Execution
  executionMode: 'instant' | 'gradual';
  gradualDuration?: number; // minutes

  // Status
  createdAt: number;
  lastChecked?: number;
  triggered?: boolean;
  triggeredAt?: number;
  executedAmount?: number;
}

// Load strategies
function loadStrategies(): AutoSellStrategy[] {
  try {
    if (!fs.existsSync(AUTOSELL_CONFIG_PATH)) {
      return [];
    }
    const data = fs.readFileSync(AUTOSELL_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save strategies
function saveStrategies(strategies: AutoSellStrategy[]): void {
  const dir = path.dirname(AUTOSELL_CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(AUTOSELL_CONFIG_PATH, JSON.stringify(strategies, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const strategies = loadStrategies();

    switch (action) {
      case 'list': {
        const tokenAddress = searchParams.get('token');
        const filtered = tokenAddress
          ? strategies.filter(s => s.tokenAddress === tokenAddress)
          : strategies;
        return NextResponse.json({ success: true, strategies: filtered });
      }

      case 'active': {
        const active = strategies.filter(s => s.enabled && !s.triggered);
        return NextResponse.json({ success: true, strategies: active });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AutoSell fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const strategies = loadStrategies();

    switch (action) {
      case 'create': {
        const { strategy } = body;

        const newStrategy: AutoSellStrategy = {
          ...strategy,
          id: `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          enabled: true,
          triggered: false,
        };

        strategies.push(newStrategy);
        saveStrategies(strategies);

        return NextResponse.json({ success: true, strategy: newStrategy });
      }

      case 'update': {
        const { id, updates } = body;

        const index = strategies.findIndex(s => s.id === id);
        if (index >= 0) {
          strategies[index] = { ...strategies[index], ...updates };
          saveStrategies(strategies);
          return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
      }

      case 'delete': {
        const { id } = body;

        const filtered = strategies.filter(s => s.id !== id);
        saveStrategies(filtered);

        return NextResponse.json({ success: true });
      }

      case 'toggle': {
        const { id } = body;

        const index = strategies.findIndex(s => s.id === id);
        if (index >= 0) {
          strategies[index].enabled = !strategies[index].enabled;
          saveStrategies(strategies);
          return NextResponse.json({ success: true, enabled: strategies[index].enabled });
        }

        return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
      }

      case 'trigger': {
        // This would be called by a background monitor
        const { id } = body;

        const index = strategies.findIndex(s => s.id === id);
        if (index >= 0) {
          strategies[index].triggered = true;
          strategies[index].triggeredAt = Date.now();
          saveStrategies(strategies);

          // In production, this would execute the sell
          return NextResponse.json({ success: true, message: 'Strategy triggered' });
        }

        return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AutoSell operation failed:', error);
    return NextResponse.json({ error: 'AutoSell operation failed' }, { status: 500 });
  }
}
