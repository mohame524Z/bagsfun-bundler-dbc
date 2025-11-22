import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ISOLATION_FILE = path.join(DATA_DIR, 'wallet-isolation.json');

interface IsolationGroup {
  id: string;
  name: string;
  purpose: 'trading' | 'holding' | 'distribution' | 'testing';
  wallets: string[];
  riskLevel: 'low' | 'medium' | 'high';
  maxExposure: number;
  crossContaminationPrevention: boolean;
  createdAt: number;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(ISOLATION_FILE)) {
  fs.writeFileSync(ISOLATION_FILE, JSON.stringify({ groups: [] }, null, 2));
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(ISOLATION_FILE, 'utf-8'));
  } catch {
    return { groups: [] };
  }
}

function saveData(data: any) {
  fs.writeFileSync(ISOLATION_FILE, JSON.stringify(data, null, 2));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const data = loadData();

    if (action === 'getGroups') {
      return NextResponse.json({ success: true, groups: data.groups });
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

    if (action === 'createGroup') {
      const { name, purpose, riskLevel, maxExposure, crossContaminationPrevention } = body;

      const newGroup: IsolationGroup = {
        id: `group_${Date.now()}`,
        name,
        purpose,
        wallets: [],
        riskLevel,
        maxExposure,
        crossContaminationPrevention: crossContaminationPrevention !== false,
        createdAt: Date.now(),
      };

      data.groups.push(newGroup);
      saveData(data);

      return NextResponse.json({ success: true, group: newGroup });
    }

    if (action === 'addWallet') {
      const { groupId, wallet } = body;
      const group = data.groups.find((g: IsolationGroup) => g.id === groupId);

      if (!group) {
        return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
      }

      if (!group.wallets.includes(wallet)) {
        group.wallets.push(wallet);
        saveData(data);
      }

      return NextResponse.json({ success: true, group });
    }

    if (action === 'removeWallet') {
      const { groupId, wallet } = body;
      const group = data.groups.find((g: IsolationGroup) => g.id === groupId);

      if (!group) {
        return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 });
      }

      group.wallets = group.wallets.filter(w => w !== wallet);
      saveData(data);

      return NextResponse.json({ success: true, group });
    }

    if (action === 'deleteGroup') {
      const { groupId } = body;
      data.groups = data.groups.filter((g: IsolationGroup) => g.id !== groupId);
      saveData(data);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
