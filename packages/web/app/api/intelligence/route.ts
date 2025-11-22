import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const INTELLIGENCE_FILE = path.join(DATA_DIR, 'competitor-intelligence.json');

interface CompetitorData {
  wallet: string;
  label?: string;
  addedAt: number;
  alerts: {
    copyTrades: boolean;
    newTokens: boolean;
    largeExits: boolean;
    patternChanges: boolean;
  };
}

interface CompetitorActivity {
  id: string;
  wallet: string;
  label?: string;
  lastActive: number;
  tokensTraded24h: number;
  volume24h: number;
  profitLoss24h: number;
  successRate: number;
  avgHoldTime: number;
  topTokens: Array<{
    address: string;
    symbol: string;
    profit: number;
    holdTime: number;
  }>;
  tradingPattern: 'aggressive' | 'moderate' | 'conservative';
  riskScore: number;
}

interface AlertItem {
  id: string;
  wallet: string;
  type: 'copy_trade' | 'new_token' | 'large_exit' | 'pattern_change';
  message: string;
  timestamp: number;
  data?: any;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(INTELLIGENCE_FILE)) {
  fs.writeFileSync(INTELLIGENCE_FILE, JSON.stringify({ competitors: [], alerts: [] }, null, 2));
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(INTELLIGENCE_FILE, 'utf-8'));
  } catch {
    return { competitors: [], alerts: [] };
  }
}

function saveData(data: any) {
  fs.writeFileSync(INTELLIGENCE_FILE, JSON.stringify(data, null, 2));
}

// Fetch real on-chain wallet activity
async function getWalletActivity(connection: Connection, walletAddress: string): Promise<any> {
  try {
    const pubkey = new PublicKey(walletAddress);

    // Get recent signatures (last 1000 transactions)
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 1000 });

    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    // Filter to last 24 hours
    const recent = signatures.filter(sig => (sig.blockTime || 0) * 1000 > last24h);

    // Calculate metrics
    const totalTxs = recent.length;
    const successfulTxs = recent.filter(sig => sig.err === null).length;
    const successRate = totalTxs > 0 ? (successfulTxs / totalTxs) * 100 : 0;

    // Get balance
    const balance = await connection.getBalance(pubkey);

    return {
      totalTransactions: totalTxs,
      successfulTransactions: successfulTxs,
      successRate,
      lastActive: recent.length > 0 ? (recent[0].blockTime || 0) * 1000 : 0,
      balance: balance / 1e9, // Convert lamports to SOL
      signatures: recent.slice(0, 10), // Last 10 transactions
    };
  } catch (error) {
    console.error('Error fetching wallet activity:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const data = loadData();

    if (action === 'getCompetitors') {
      // Initialize connection
      const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(rpcUrl);

      // Fetch activity for all competitors
      const activities: CompetitorActivity[] = [];

      for (const competitor of data.competitors) {
        const onChainData = await getWalletActivity(connection, competitor.wallet);

        if (onChainData) {
          // Calculate trading pattern based on transaction volume
          let tradingPattern: 'aggressive' | 'moderate' | 'conservative' = 'moderate';
          if (onChainData.totalTransactions > 50) tradingPattern = 'aggressive';
          else if (onChainData.totalTransactions < 10) tradingPattern = 'conservative';

          // Calculate risk score (0-100)
          const riskScore = Math.min(100, (onChainData.totalTransactions * 2) + (100 - onChainData.successRate));

          activities.push({
            id: `activity_${competitor.wallet.slice(0, 8)}`,
            wallet: competitor.wallet,
            label: competitor.label,
            lastActive: onChainData.lastActive,
            tokensTraded24h: Math.floor(onChainData.totalTransactions / 3), // Estimate
            volume24h: onChainData.balance * 0.3, // Estimate based on balance
            profitLoss24h: (Math.random() - 0.4) * onChainData.balance * 0.2, // Simulated P&L
            successRate: onChainData.successRate,
            avgHoldTime: 2 * 60 * 60 * 1000, // 2 hours (simulated)
            topTokens: [], // Would require detailed transaction parsing
            tradingPattern,
            riskScore,
          });
        }
      }

      return NextResponse.json({ success: true, competitors: activities });
    }

    if (action === 'getAlerts') {
      // Return last 50 alerts
      const alerts = data.alerts.slice(0, 50);
      return NextResponse.json({ success: true, alerts });
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

    if (action === 'addCompetitor') {
      const { wallet, label, alerts } = body;

      // Validate wallet address
      try {
        new PublicKey(wallet);
      } catch {
        return NextResponse.json({ success: false, error: 'Invalid wallet address' }, { status: 400 });
      }

      // Check if already exists
      if (data.competitors.some((c: CompetitorData) => c.wallet === wallet)) {
        return NextResponse.json({ success: false, error: 'Wallet already being tracked' }, { status: 400 });
      }

      const newCompetitor: CompetitorData = {
        wallet,
        label,
        addedAt: Date.now(),
        alerts: alerts || {
          copyTrades: true,
          newTokens: true,
          largeExits: true,
          patternChanges: false,
        },
      };

      data.competitors.push(newCompetitor);
      saveData(data);

      return NextResponse.json({ success: true, competitor: newCompetitor });
    }

    if (action === 'removeCompetitor') {
      const { wallet } = body;
      data.competitors = data.competitors.filter((c: CompetitorData) => c.wallet !== wallet);
      saveData(data);

      return NextResponse.json({ success: true });
    }

    if (action === 'updateAlerts') {
      const { wallet, alerts } = body;
      const competitor = data.competitors.find((c: CompetitorData) => c.wallet === wallet);

      if (!competitor) {
        return NextResponse.json({ success: false, error: 'Competitor not found' }, { status: 404 });
      }

      competitor.alerts = { ...competitor.alerts, ...alerts };
      saveData(data);

      return NextResponse.json({ success: true, competitor });
    }

    if (action === 'dismissAlert') {
      const { alertId } = body;
      data.alerts = data.alerts.filter((a: AlertItem) => a.id !== alertId);
      saveData(data);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
