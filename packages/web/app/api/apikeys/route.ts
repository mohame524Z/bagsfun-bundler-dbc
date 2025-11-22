import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const APIKEYS_FILE = path.join(DATA_DIR, 'api-keys.json');

interface APIKey {
  id: string;
  key: string;
  name: string;
  permissions: string[];
  lastUsed?: number;
  usageCount: number;
  createdAt: number;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(APIKEYS_FILE)) {
  fs.writeFileSync(APIKEYS_FILE, JSON.stringify({ keys: [] }, null, 2));
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(APIKEYS_FILE, 'utf-8'));
  } catch {
    return { keys: [] };
  }
}

function saveData(data: any) {
  fs.writeFileSync(APIKEYS_FILE, JSON.stringify(data, null, 2));
}

function generateAPIKey(): string {
  return 'pbk_' + crypto.randomBytes(32).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    const data = loadData();
    // Return keys with masked values
    const maskedKeys = data.keys.map((k: APIKey) => ({
      ...k,
      key: k.key.slice(0, 12) + '...' + k.key.slice(-8),
    }));
    return NextResponse.json({ success: true, keys: maskedKeys });
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
      const { name, permissions } = body;

      const newKey: APIKey = {
        id: `key_${Date.now()}`,
        key: generateAPIKey(),
        name: name || 'Unnamed Key',
        permissions: permissions || ['read', 'write'],
        usageCount: 0,
        createdAt: Date.now(),
      };

      data.keys.push(newKey);
      saveData(data);

      // Return full key only on creation
      return NextResponse.json({ success: true, key: newKey });
    }

    if (action === 'regenerate') {
      const { keyId } = body;
      const key = data.keys.find((k: APIKey) => k.id === keyId);

      if (!key) {
        return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });
      }

      key.key = generateAPIKey();
      key.usageCount = 0;
      key.lastUsed = undefined;
      saveData(data);

      // Return full key on regeneration
      return NextResponse.json({ success: true, key });
    }

    if (action === 'delete') {
      const { keyId } = body;
      data.keys = data.keys.filter((k: APIKey) => k.id !== keyId);
      saveData(data);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
