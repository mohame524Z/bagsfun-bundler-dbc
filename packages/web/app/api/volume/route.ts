import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { VolumeGenerator } from '@pump-bundler/core/volume';
import { RPCManager } from '@pump-bundler/core/rpc-manager';
import { AppConfig } from '@pump-bundler/types';
import { loadJson } from '@pump-bundler/utils';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG_PATH = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');
const DATA_DIR = path.join(process.cwd(), 'data');
const STRATEGIES_FILE = path.join(DATA_DIR, 'volume-strategies.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(STRATEGIES_FILE)) {
  fs.writeFileSync(STRATEGIES_FILE, JSON.stringify({ strategies: [] }, null, 2));
}

function loadStrategies() {
  try {
    return JSON.parse(fs.readFileSync(STRATEGIES_FILE, 'utf-8'));
  } catch {
    return { strategies: [] };
  }
}

function saveStrategies(data: any) {
  fs.writeFileSync(STRATEGIES_FILE, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'getStrategies') {
      const data = loadStrategies();
      return NextResponse.json({ success: true, strategies: data.strategies });
    }

    if (action === 'getStats') {
      const data = loadStrategies();
      const stats = {
        totalStrategies: data.strategies.length,
        activeStrategies: data.strategies.filter((s: any) => s.enabled).length,
        totalVolumeGenerated: data.strategies.reduce((sum: number, s: any) => sum + (s.volumeGenerated || 0), 0),
      };
      return NextResponse.json({ success: true, stats });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tokenAddress,
      targetVolume,
      duration,
    } = body;

    // Validation
    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Token address is required' },
        { status: 400 }
      );
    }

    // Load config
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: 'Configuration not found. Please run setup first.' },
        { status: 404 }
      );
    }

    const config = loadJson<AppConfig>(CONFIG_PATH, {} as AppConfig);

    const volumeConfig = {
      ...config.volume,
      targetVolume: targetVolume || config.volume.targetVolume,
      duration: duration || config.volume.duration,
    };

    // Initialize services
    const rpcManager = new RPCManager(config.rpc);
    const connection = rpcManager.getCurrentConnection();

    const volumeGen = new VolumeGenerator(connection, volumeConfig, config.defaultMode);

    // Note: Volume generation is a long-running operation
    // In a production app, this should be handled with WebSockets or background jobs
    // For now, we'll just start it and return immediately
    volumeGen.start(tokenAddress).catch(err => {
      console.error('Volume generation error:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Volume generation started',
      config: volumeConfig,
    });

  } catch (error: any) {
    console.error('Volume generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Volume generation failed' },
      { status: 500 }
    );
  }
}
