import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

interface NotificationRule {
  id: string;
  name: string;
  type: 'price' | 'volume' | 'new_token' | 'profit_target';
  enabled: boolean;
  conditions: {
    tokenAddress?: string;
    priceTarget?: number;
    volumeThreshold?: number;
    profitPercent?: number;
  };
  channels: ('browser' | 'email' | 'telegram')[];
  createdAt: number;
  lastTriggered?: number;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(NOTIFICATIONS_FILE)) {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify({ rules: [] }, null, 2));
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8'));
  } catch {
    return { rules: [] };
  }
}

function saveData(data: any) {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const data = loadData();
    return NextResponse.json({ success: true, rules: data.rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const data = loadData();

    if (action === 'create') {
      const { name, type, conditions, channels } = body;

      const newRule: NotificationRule = {
        id: `notif_${Date.now()}`,
        name,
        type,
        enabled: true,
        conditions,
        channels: channels || ['browser'],
        createdAt: Date.now(),
      };

      data.rules.push(newRule);
      saveData(data);

      return NextResponse.json({ success: true, rule: newRule });
    }

    if (action === 'toggle') {
      const { ruleId } = body;
      const rule = data.rules.find((r: NotificationRule) => r.id === ruleId);

      if (!rule) {
        return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
      }

      rule.enabled = !rule.enabled;
      saveData(data);

      return NextResponse.json({ success: true, rule });
    }

    if (action === 'delete') {
      const { ruleId } = body;
      data.rules = data.rules.filter((r: NotificationRule) => r.id !== ruleId);
      saveData(data);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
