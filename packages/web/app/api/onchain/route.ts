import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ONCHAIN_FILE = path.join(DATA_DIR, 'onchain-analytics.json');

interface OnChainMetrics {
  totalTransactions: number;
  uniqueTokens: number;
  avgGasUsed: number;
  totalGasSpent: number;
  onChainProfit: number;
  contractCalls: number;
  uniqueCounterparties: number;
  lastUpdated: number;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function fetchOnChainData(walletAddress: string): Promise<OnChainMetrics> {
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl);
    const pubkey = new PublicKey(walletAddress);

    // Fetch recent signatures
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 1000 });

    const totalTxs = signatures.length;
    const successfulTxs = signatures.filter(sig => sig.err === null);

    // Calculate gas metrics
    let totalFees = 0;
    const uniqueAddresses = new Set<string>();
    const tokenAddresses = new Set<string>();

    for (const sig of successfulTxs.slice(0, 100)) { // Sample first 100
      try {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (tx && tx.meta) {
          totalFees += tx.meta.fee;

          // Extract account keys
          if (tx.transaction.message.staticAccountKeys) {
            tx.transaction.message.staticAccountKeys.forEach((key: PublicKey) => {
              uniqueAddresses.add(key.toString());
            });
          }
        }
      } catch (e) {
        // Skip failed fetches
      }
    }

    const avgGas = successfulTxs.length > 0 ? totalFees / successfulTxs.length : 0;

    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    // Calculate profit: current balance - fees spent
    // Note: This is a simplified calculation. For accurate profit tracking, you would need:
    // 1. Historical balance tracking (initial balance when wallet was created/funded)
    // 2. Token price data to value token holdings in SOL
    // 3. Track incoming transfers separately from trading profits
    const currentSolBalance = await connection.getBalance(pubkey) / 1e9;

    // For now, calculate as: current balance - total fees (assuming wallet started empty or track initial deposit separately)
    // This will be negative if more fees were spent than current balance, positive if balance > fees
    let onChainProfit = currentSolBalance - (totalFees / 1e9);

    // If we have cached previous balance, calculate actual profit
    const cacheFile = ONCHAIN_FILE;
    if (fs.existsSync(cacheFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        const prevData = cached[walletAddress];
        if (prevData && prevData.initialBalance !== undefined) {
          // Calculate as: (current balance - initial balance) - fees
          onChainProfit = currentSolBalance - prevData.initialBalance;
        }
      } catch (e) {
        // Ignore cache read errors
      }
    }

    const metrics: OnChainMetrics = {
      totalTransactions: totalTxs,
      uniqueTokens: tokenAccounts.value.length,
      avgGasUsed: avgGas / 1e9, // Convert lamports to SOL
      totalGasSpent: totalFees / 1e9,
      onChainProfit, // Now calculated based on balance changes
      contractCalls: successfulTxs.length, // Simplified
      uniqueCounterparties: uniqueAddresses.size,
      lastUpdated: Date.now(),
    };

    // Cache the results with initial balance tracking
    const cacheData: any = { ...metrics };

    // Store initial balance on first cache or preserve existing initial balance
    if (fs.existsSync(ONCHAIN_FILE)) {
      const cached = JSON.parse(fs.readFileSync(ONCHAIN_FILE, 'utf-8'));
      const prevData = cached[walletAddress];

      // Preserve initial balance if it exists, otherwise set it now
      cacheData.initialBalance = prevData?.initialBalance ?? currentSolBalance;

      cached[walletAddress] = cacheData;
      fs.writeFileSync(ONCHAIN_FILE, JSON.stringify(cached, null, 2));
    } else {
      // First time - set initial balance
      cacheData.initialBalance = currentSolBalance;
      fs.writeFileSync(ONCHAIN_FILE, JSON.stringify({ [walletAddress]: cacheData }, null, 2));
    }

    return metrics;
  } catch (error) {
    console.error('Error fetching on-chain data:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ success: false, error: 'Wallet address required' }, { status: 400 });
  }

  try {
    // Check cache (refresh every 5 minutes)
    if (fs.existsSync(ONCHAIN_FILE)) {
      const cached = JSON.parse(fs.readFileSync(ONCHAIN_FILE, 'utf-8'));
      const data = cached[wallet];

      if (data && (Date.now() - data.lastUpdated) < 5 * 60 * 1000) {
        return NextResponse.json({ success: true, metrics: data });
      }
    }

    // Fetch fresh data
    const metrics = await fetchOnChainData(wallet);
    return NextResponse.json({ success: true, metrics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
