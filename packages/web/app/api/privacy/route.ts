import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRIVACY_FILE = path.join(DATA_DIR, 'privacy-settings.json');

interface PrivacySettings {
  torRouting: boolean;
  randomizeAmounts: boolean;
  randomizeAmountsPercent: number;
  timingDelays: boolean;
  minDelay: number;
  maxDelay: number;
  proxyWallets: boolean;
  proxyWalletCount: number;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  torRouting: false,
  randomizeAmounts: false,
  randomizeAmountsPercent: 5,
  timingDelays: false,
  minDelay: 100,
  maxDelay: 500,
  proxyWallets: false,
  proxyWalletCount: 3,
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(PRIVACY_FILE)) {
  fs.writeFileSync(PRIVACY_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
}

function loadSettings(): PrivacySettings {
  try {
    return JSON.parse(fs.readFileSync(PRIVACY_FILE, 'utf-8'));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: PrivacySettings) {
  fs.writeFileSync(PRIVACY_FILE, JSON.stringify(settings, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const settings = loadSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const currentSettings = loadSettings();
    const updatedSettings = { ...currentSettings, ...body };
    saveSettings(updatedSettings);

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
