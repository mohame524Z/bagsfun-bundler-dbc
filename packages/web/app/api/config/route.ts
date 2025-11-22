import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '@pump-bundler/types';

const CONFIG_PATH = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');

export async function GET() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json(
        { error: 'Configuration not found. Please run setup first.' },
        { status: 404 }
      );
    }

    const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configData) as AppConfig;

    // Don't expose private keys in the response
    const sanitizedConfig = {
      ...config,
      wallet: {
        ...config.wallet,
        mainWalletPrivateKey: '[HIDDEN]',
      },
    };

    return NextResponse.json(sanitizedConfig);
  } catch (error) {
    console.error('Failed to load config:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json();

    // Load existing config or use updates as new config
    let config: AppConfig;
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
      config = JSON.parse(configData);

      // Update config (shallow merge)
      config = {
        ...config,
        ...updates,
      };
    } else {
      // No existing config, use the provided data as the new config
      config = updates as AppConfig;
    }

    // Save config
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
