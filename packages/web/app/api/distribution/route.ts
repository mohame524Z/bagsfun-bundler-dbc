import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const RULES_FILE = path.join(DATA_DIR, 'distribution-rules.json');
const HISTORY_FILE = path.join(DATA_DIR, 'distribution-history.json');

interface DistributionRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: 'manual' | 'profit_threshold' | 'time_interval';
  triggerValue?: number;
  recipients: {
    address: string;
    percentage: number;
    label?: string;
  }[];
  minAmount: number;
  createdAt: number;
}

interface DistributionHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  amount: number;
  recipients: {
    address: string;
    amount: number;
    txSignature?: string;
  }[];
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(RULES_FILE)) {
  fs.writeFileSync(RULES_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
}

function loadRules(): DistributionRule[] {
  try {
    return JSON.parse(fs.readFileSync(RULES_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveRules(rules: DistributionRule[]) {
  fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2));
}

function loadHistory(): DistributionHistory[] {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveHistory(history: DistributionHistory[]) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'getRules') {
      const rules = loadRules();
      return NextResponse.json({ success: true, rules });
    }

    if (action === 'getHistory') {
      const history = loadHistory();
      return NextResponse.json({ success: true, history });
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

    if (action === 'createRule') {
      const { name, trigger, triggerValue, recipients, minAmount } = body;

      // Validate recipients percentages sum to 100
      const totalPercentage = recipients.reduce((sum: number, r: any) => sum + r.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return NextResponse.json(
          { success: false, error: 'Recipient percentages must sum to 100%' },
          { status: 400 }
        );
      }

      const rules = loadRules();
      const newRule: DistributionRule = {
        id: `rule_${Date.now()}`,
        name,
        enabled: true,
        trigger,
        triggerValue,
        recipients,
        minAmount,
        createdAt: Date.now(),
      };

      rules.push(newRule);
      saveRules(rules);

      return NextResponse.json({ success: true, rule: newRule });
    }

    if (action === 'updateRule') {
      const { ruleId, updates } = body;
      const rules = loadRules();
      const ruleIndex = rules.findIndex(r => r.id === ruleId);

      if (ruleIndex === -1) {
        return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
      }

      rules[ruleIndex] = { ...rules[ruleIndex], ...updates };
      saveRules(rules);

      return NextResponse.json({ success: true, rule: rules[ruleIndex] });
    }

    if (action === 'deleteRule') {
      const { ruleId } = body;
      const rules = loadRules();
      const filteredRules = rules.filter(r => r.id !== ruleId);
      saveRules(filteredRules);

      return NextResponse.json({ success: true });
    }

    if (action === 'toggleRule') {
      const { ruleId } = body;
      const rules = loadRules();
      const rule = rules.find(r => r.id === ruleId);

      if (!rule) {
        return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
      }

      rule.enabled = !rule.enabled;
      saveRules(rules);

      return NextResponse.json({ success: true, rule });
    }

    if (action === 'distribute') {
      const { ruleId, amount } = body;
      const rules = loadRules();
      const rule = rules.find(r => r.id === ruleId);

      if (!rule) {
        return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });
      }

      if (amount < rule.minAmount) {
        return NextResponse.json(
          { success: false, error: `Amount must be at least ${rule.minAmount} SOL` },
          { status: 400 }
        );
      }

      // Calculate distributions
      const distributions = rule.recipients.map(recipient => ({
        address: recipient.address,
        amount: (amount * recipient.percentage) / 100,
        txSignature: undefined, // Will be filled after actual transfer
      }));

      // TODO: Execute actual SOL transfers here
      // For now, we'll simulate successful transfers
      const history = loadHistory();
      const newDistribution: DistributionHistory = {
        id: `dist_${Date.now()}`,
        ruleId: rule.id,
        ruleName: rule.name,
        amount,
        recipients: distributions.map(d => ({
          ...d,
          txSignature: `sim_${Math.random().toString(36).substring(7)}`, // Simulated tx signature
        })),
        timestamp: Date.now(),
        status: 'completed',
      };

      history.unshift(newDistribution);
      // Keep last 100 distributions
      if (history.length > 100) {
        history.splice(100);
      }
      saveHistory(history);

      return NextResponse.json({ success: true, distribution: newDistribution });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
