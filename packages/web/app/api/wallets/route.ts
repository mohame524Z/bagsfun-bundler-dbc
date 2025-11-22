import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '@pump-bundler/types';
import bs58 from 'bs58';

const CONFIG_PATH = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');

interface WalletInfo {
  address: string;
  privateKey: string;
  solBalance: number;
  tokenCount: number;
  totalValue: number;
  pnl: number;
  status: 'active' | 'empty' | 'funded';
}

// Load config
function loadConfig(): AppConfig | null {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return null;
    }
    const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(configData) as AppConfig;
  } catch (error) {
    console.error('Failed to load config:', error);
    return null;
  }
}

// Save config
function saveConfig(config: AppConfig): void {
  const configDir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Get wallet info from chain
async function getWalletInfo(connection: Connection, privateKey: string): Promise<WalletInfo> {
  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    const publicKey = keypair.publicKey;

    // Get SOL balance
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    const tokenCount = tokenAccounts.value.length;

    // Calculate total value and PnL (simplified - would need price data for accurate calculation)
    let totalValue = solBalance;
    let pnl = 0; // Would need to track initial investment

    // Determine status
    let status: 'active' | 'empty' | 'funded' = 'empty';
    if (tokenCount > 0) {
      status = 'active';
    } else if (solBalance > 0) {
      status = 'funded';
    }

    return {
      address: publicKey.toBase58(),
      privateKey,
      solBalance,
      tokenCount,
      totalValue,
      pnl,
      status,
    };
  } catch (error) {
    console.error('Failed to get wallet info:', error);
    // Return empty wallet info on error
    return {
      address: '',
      privateKey,
      solBalance: 0,
      tokenCount: 0,
      totalValue: 0,
      pnl: 0,
      status: 'empty',
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const config = loadConfig();
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found. Please run setup first.' },
        { status: 404 }
      );
    }

    // Create connection
    const rpcUrl = config.rpc?.endpoints?.[0]?.url || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl);

    switch (action) {
      case 'list': {
        const bundleWallets = config.wallet?.bundleWallets || [];

        // Get info for all wallets
        const walletInfos = await Promise.all(
          bundleWallets.map(pk => getWalletInfo(connection, pk))
        );

        return NextResponse.json({ success: true, wallets: walletInfos });
      }

      case 'health': {
        const bundleWallets = config.wallet?.bundleWallets || [];

        // Get health info for all wallets
        const walletHealthInfos = await Promise.all(
          bundleWallets.map(async (pk) => {
            const info = await getWalletInfo(connection, pk);

            // Calculate health metrics
            const now = Date.now();

            // Get real transaction count from last 24 hours
            const publicKey = new PublicKey(info.address);
            const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 1000 });
            const oneDayAgo = now - 86400000;
            const transactionCount24h = signatures.filter(sig => (sig.blockTime || 0) * 1000 >= oneDayAgo).length;

            // Get last activity from most recent transaction
            const lastActivity = signatures.length > 0 && signatures[0].blockTime
              ? signatures[0].blockTime * 1000
              : now - 86400000 * 7; // Default to 7 days ago if no transactions

            // Calculate health score (0-100)
            let healthScore = 100;
            if (info.solBalance < 0.001) healthScore -= 40;
            else if (info.solBalance < 0.01) healthScore -= 20;

            if (transactionCount24h > 15) healthScore -= 30;
            else if (transactionCount24h > 10) healthScore -= 15;

            if (now - lastActivity < 3600000) healthScore -= 10; // Active in last hour

            healthScore = Math.max(0, healthScore);

            // Determine status
            let status: 'healthy' | 'warning' | 'critical' | 'inactive' = 'healthy';
            if (healthScore < 40) status = 'critical';
            else if (healthScore < 60) status = 'warning';
            else if (now - lastActivity > 86400000 * 7) status = 'inactive';

            // Determine heat level
            let heatLevel: 'cold' | 'warm' | 'hot' = 'cold';
            if (transactionCount24h > 10) heatLevel = 'hot';
            else if (transactionCount24h > 5) heatLevel = 'warm';

            // Identify issues
            const issues: string[] = [];
            if (info.solBalance < 0.001) issues.push('Very low SOL balance');
            if (transactionCount24h > 15) issues.push('Excessive transaction activity');
            if (heatLevel === 'hot') issues.push('High heat level detected');

            // Generate recommendations
            const recommendations: string[] = [];
            if (info.solBalance < 0.01) recommendations.push('Fund wallet with SOL');
            if (heatLevel === 'hot') recommendations.push('Consider rotating this wallet');
            if (status === 'inactive') recommendations.push('Wallet has been inactive - verify functionality');

            const rotationRecommended = heatLevel === 'hot' || transactionCount24h > 12;

            return {
              address: info.address,
              solBalance: info.solBalance,
              tokenCount: info.tokenCount,
              transactionCount24h,
              lastActivity,
              healthScore,
              status,
              issues,
              recommendations,
              heatLevel,
              rotationRecommended,
            };
          })
        );

        return NextResponse.json({ success: true, wallets: walletHealthInfos });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Wallet operation failed:', error);
    return NextResponse.json(
      { error: 'Wallet operation failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const config = loadConfig();
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found. Please run setup first.' },
        { status: 404 }
      );
    }

    // Create connection
    const rpcUrl = config.rpc?.endpoints?.[0]?.url || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl);

    switch (action) {
      case 'generate': {
        const { count } = body;

        if (!count || count < 1 || count > 100) {
          return NextResponse.json(
            { error: 'Count must be between 1 and 100' },
            { status: 400 }
          );
        }

        // Generate new wallets
        const newWallets: string[] = [];
        for (let i = 0; i < count; i++) {
          const keypair = Keypair.generate();
          const privateKey = bs58.encode(keypair.secretKey);
          newWallets.push(privateKey);
        }

        // Add to config
        if (!config.wallet) {
          config.wallet = {
            mainWalletPrivateKey: '',
            bundleWallets: [],
            walletCount: 0,
            generateWalletsOnStartup: false,
          };
        }

        config.wallet.bundleWallets = [
          ...(config.wallet.bundleWallets || []),
          ...newWallets,
        ];
        config.wallet.walletCount = config.wallet.bundleWallets.length;

        saveConfig(config);

        return NextResponse.json({
          success: true,
          generated: count,
          total: config.wallet.bundleWallets.length,
        });
      }

      case 'import': {
        const { privateKeys } = body;

        if (!Array.isArray(privateKeys) || privateKeys.length === 0) {
          return NextResponse.json(
            { error: 'Invalid private keys array' },
            { status: 400 }
          );
        }

        // Validate all keys
        const validKeys: string[] = [];
        for (const pk of privateKeys) {
          try {
            // Try to decode and create keypair to validate
            const keypair = Keypair.fromSecretKey(bs58.decode(pk));
            validKeys.push(pk);
          } catch (error) {
            console.error('Invalid private key:', pk.slice(0, 8) + '...');
          }
        }

        if (validKeys.length === 0) {
          return NextResponse.json(
            { error: 'No valid private keys provided' },
            { status: 400 }
          );
        }

        // Add to config
        if (!config.wallet) {
          config.wallet = {
            mainWalletPrivateKey: '',
            bundleWallets: [],
            walletCount: 0,
            generateWalletsOnStartup: false,
          };
        }

        config.wallet.bundleWallets = [
          ...(config.wallet.bundleWallets || []),
          ...validKeys,
        ];
        config.wallet.walletCount = config.wallet.bundleWallets.length;

        saveConfig(config);

        return NextResponse.json({
          success: true,
          imported: validKeys.length,
          total: config.wallet.bundleWallets.length,
        });
      }

      case 'fund': {
        const { amountPerWallet } = body;

        if (!amountPerWallet || amountPerWallet <= 0) {
          return NextResponse.json(
            { error: 'Invalid fund amount' },
            { status: 400 }
          );
        }

        if (!config.wallet?.mainWalletPrivateKey) {
          return NextResponse.json(
            { error: 'Main wallet not configured' },
            { status: 400 }
          );
        }

        const bundleWallets = config.wallet.bundleWallets || [];
        if (bundleWallets.length === 0) {
          return NextResponse.json(
            { error: 'No bundle wallets to fund' },
            { status: 400 }
          );
        }

        // Create main wallet keypair
        const mainKeypair = Keypair.fromSecretKey(bs58.decode(config.wallet.mainWalletPrivateKey));

        // Check main wallet balance
        const mainBalance = await connection.getBalance(mainKeypair.publicKey);
        const requiredAmount = (amountPerWallet * bundleWallets.length * LAMPORTS_PER_SOL) + (5000 * bundleWallets.length); // Include fees

        if (mainBalance < requiredAmount) {
          return NextResponse.json(
            { error: `Insufficient balance. Need ${requiredAmount / LAMPORTS_PER_SOL} SOL, have ${mainBalance / LAMPORTS_PER_SOL} SOL` },
            { status: 400 }
          );
        }

        // Fund all wallets
        let funded = 0;
        for (const privateKey of bundleWallets) {
          try {
            const destKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));

            const transaction = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: mainKeypair.publicKey,
                toPubkey: destKeypair.publicKey,
                lamports: Math.floor(amountPerWallet * LAMPORTS_PER_SOL),
              })
            );

            const signature = await connection.sendTransaction(transaction, [mainKeypair]);
            await connection.confirmTransaction(signature);

            funded++;
          } catch (error) {
            console.error('Failed to fund wallet:', error);
          }
        }

        return NextResponse.json({
          success: true,
          funded,
          total: bundleWallets.length,
        });
      }

      case 'clearEmpty': {
        if (!config.wallet) {
          return NextResponse.json(
            { error: 'No wallet configuration found' },
            { status: 400 }
          );
        }

        const bundleWallets = config.wallet.bundleWallets || [];

        // Check each wallet and remove if empty
        const keepWallets: string[] = [];
        let removed = 0;

        for (const privateKey of bundleWallets) {
          try {
            const info = await getWalletInfo(connection, privateKey);

            if (info.status !== 'empty') {
              keepWallets.push(privateKey);
            } else {
              removed++;
            }
          } catch (error) {
            // Keep wallet if we can't check it
            keepWallets.push(privateKey);
          }
        }

        config.wallet.bundleWallets = keepWallets;
        config.wallet.walletCount = keepWallets.length;

        saveConfig(config);

        return NextResponse.json({
          success: true,
          removed,
          remaining: keepWallets.length,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Wallet operation failed:', error);
    return NextResponse.json(
      { error: 'Wallet operation failed' },
      { status: 500 }
    );
  }
}
