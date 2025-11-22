import { NextRequest, NextResponse } from 'next/server';
import { RPCManager } from '@pump-bundler/core/rpc-manager';
import { AppConfig } from '@pump-bundler/types';
import { loadJson } from '@pump-bundler/utils';
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
    const rpcManager = new RPCManager(config.rpc);

    switch (action) {
      case 'list':
        const endpoints = rpcManager.getAllEndpoints();
        return NextResponse.json({ success: true, endpoints });

      case 'health':
        const health = rpcManager.getHealthStatus();
        return NextResponse.json({ success: true, health });

      case 'stats':
        const stats = rpcManager.getStats();
        return NextResponse.json({ success: true, stats });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: list, health, or stats' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('RPC operation failed:', error);
    return NextResponse.json(
      { error: error.message || 'RPC operation failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, endpointId } = body;

    // Load config
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: 'Configuration not found. Please run setup first.' },
        { status: 404 }
      );
    }

    const config = loadJson<AppConfig>(CONFIG_PATH, {} as AppConfig);
    const rpcManager = new RPCManager(config.rpc);

    switch (action) {
      case 'switch':
        if (!endpointId) {
          return NextResponse.json(
            { error: 'Endpoint ID is required' },
            { status: 400 }
          );
        }
        await rpcManager.switchToEndpoint(endpointId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: switch' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('RPC operation failed:', error);
    return NextResponse.json(
      { error: error.message || 'RPC operation failed' },
      { status: 500 }
    );
  }
}
