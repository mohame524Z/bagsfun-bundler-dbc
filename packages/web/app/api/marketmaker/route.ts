import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const MM_FILE = path.join(DATA_DIR, 'market-maker.json');

interface MarketMakerConfig {
  tokenAddress: string;
  tokenSymbol: string;
  enabled: boolean;
  spreadPercent: number;
  orderSize: number;
  minOrderSize: number;
  maxOrderSize: number;
  inventoryTarget: number;
  rebalanceThreshold: number;
  maxPosition: number;
  updateInterval: number;
  riskManagement: {
    stopLoss: number;
    maxDrawdown: number;
    dailyLimit: number;
  };
  stats: {
    ordersPlaced: number;
    ordersFilled: number;
    totalVolume: number;
    profitLoss: number;
    currentInventory: number;
    startedAt?: number;
  };
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(MM_FILE)) {
  fs.writeFileSync(MM_FILE, JSON.stringify({ configs: [] }, null, 2));
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(MM_FILE, 'utf-8'));
  } catch {
    return { configs: [] };
  }
}

function saveData(data: any) {
  fs.writeFileSync(MM_FILE, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const data = loadData();

    if (action === 'getStats') {
      return NextResponse.json({ success: true, configs: data.configs });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const data = loadData();

    if (action === 'createConfig') {
      const config: MarketMakerConfig = {
        tokenAddress: body.tokenAddress,
        tokenSymbol: body.tokenSymbol || 'TOKEN',
        enabled: false,
        spreadPercent: body.spreadPercent || 0.5,
        orderSize: body.orderSize || 0.1,
        minOrderSize: body.minOrderSize || 0.01,
        maxOrderSize: body.maxOrderSize || 1.0,
        inventoryTarget: body.inventoryTarget || 50,
        rebalanceThreshold: body.rebalanceThreshold || 20,
        maxPosition: body.maxPosition || 100,
        updateInterval: body.updateInterval || 10,
        riskManagement: body.riskManagement || {
          stopLoss: 10,
          maxDrawdown: 20,
          dailyLimit: 50,
        },
        stats: {
          ordersPlaced: 0,
          ordersFilled: 0,
          totalVolume: 0,
          profitLoss: 0,
          currentInventory: 0,
        },
      };

      data.configs.push(config);
      saveData(data);

      return NextResponse.json({ success: true, config });
    }

    if (action === 'start') {
      const { tokenAddress } = body;
      const config = data.configs.find((c: MarketMakerConfig) => c.tokenAddress === tokenAddress);

      if (!config) {
        return NextResponse.json({ success: false, error: 'Config not found' }, { status: 404 });
      }

      config.enabled = true;
      config.stats.startedAt = Date.now();
      saveData(data);

      // TODO: Start actual market making bot
      // This would spawn a background process that:
      // 1. Monitors order book
      // 2. Places buy/sell orders at spread
      // 3. Manages inventory
      // 4. Updates stats

      return NextResponse.json({ success: true, message: 'Market maker started', config });
    }

    if (action === 'stop') {
      const { tokenAddress } = body;
      const config = data.configs.find((c: MarketMakerConfig) => c.tokenAddress === tokenAddress);

      if (!config) {
        return NextResponse.json({ success: false, error: 'Config not found' }, { status: 404 });
      }

      config.enabled = false;
      saveData(data);

      // TODO: Stop market making bot

      return NextResponse.json({ success: true, message: 'Market maker stopped', config });
    }

    if (action === 'updateConfig') {
      const { tokenAddress, updates } = body;
      const config = data.configs.find((c: MarketMakerConfig) => c.tokenAddress === tokenAddress);

      if (!config) {
        return NextResponse.json({ success: false, error: 'Config not found' }, { status: 404 });
      }

      Object.assign(config, updates);
      saveData(data);

      return NextResponse.json({ success: true, config });
    }

    if (action === 'delete') {
      const { tokenAddress } = body;
      data.configs = data.configs.filter((c: MarketMakerConfig) => c.tokenAddress !== tokenAddress);
      saveData(data);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
