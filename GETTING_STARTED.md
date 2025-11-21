# 🚀 Getting Started with Pump Bundler

This guide will walk you through setting up and using the Pump.fun Advanced Bundler.

## 📦 What's Been Built

### ✅ Core Foundation (COMPLETED)
- **Type System**: Comprehensive TypeScript types for all features
- **Constants**: Mode configs, RPC endpoints, Jito setup, bonding curve constants
- **Utilities**: 30+ helper functions for wallets, distributions, formatting, validation
- **RPC Manager**: Advanced multi-RPC system with automatic failover
- **Pump.fun Client**: Full integration supporting Classic and Mayhem modes

### 🎯 Features Implemented

#### 1. RPC Management System
**File**: `packages/core/rpc-manager.ts`

Features:
- ✅ Multi-RPC support with priority levels
- ✅ Automatic health monitoring
- ✅ Smart failover on RPC failures
- ✅ Add/remove custom RPCs dynamically
- ✅ Switch between RPCs on demand
- ✅ Real-time latency tracking
- ✅ Success rate monitoring
- ✅ Configurable health check intervals

```typescript
// Example usage:
const rpcManager = new RPCManager({
  endpoints: [
    { id: 'helius', url: 'https://...', priority: 1, ... },
    { id: 'quicknode', url: 'https://...', priority: 2, ... }
  ],
  autoFailover: true,
  healthCheckEnabled: true,
  maxFailoverAttempts: 3
});

// Get current connection
const connection = rpcManager.getCurrentConnection();

// Add custom RPC
rpcManager.addCustomEndpoint({
  id: 'my-rpc',
  name: 'My Custom RPC',
  url: 'https://my-rpc.com',
  priority: 1,
  isCustom: true,
  maxRetries: 3,
  timeout: 30000,
  healthCheckInterval: 60000
});

// Switch to specific RPC
await rpcManager.switchToEndpoint('my-rpc');

// Check health status
const health = rpcManager.getHealthStatus();
console.log(health);
// Output: [{ endpointId: 'helius', isHealthy: true, latency: 45, ... }]
```

#### 2. Pump.fun Integration
**File**: `packages/core/pump-fun.ts`

Features:
- ✅ Classic mode support
- ✅ Mayhem mode support (50% faster bonding curve)
- ✅ Token creation with IPFS metadata upload
- ✅ Buy instruction generation
- ✅ Sell instruction generation
- ✅ Bonding curve calculations
- ✅ Token info fetching
- ✅ New token monitoring

```typescript
// Example usage:
const pumpClient = new PumpFunClient(connection, PumpMode.MAYHEM);

// Create token
const { mint, signature } = await pumpClient.createToken(
  {
    name: 'My Token',
    symbol: 'MTK',
    description: 'A cool token',
    image: './image.png',
    twitter: 'https://x.com/mytoken',
    telegram: 'https://t.me/mytoken',
    website: 'https://mytoken.com'
  },
  creatorKeypair,
  0.1 // initial buy amount in SOL
);

// Build buy instruction
const buyIx = await pumpClient.buildBuyInstruction({
  mint: mintAddress,
  amount: 0.5, // SOL
  slippage: 500, // 5%
  buyer: buyerKeypair
});

// Build sell instruction
const sellIx = await pumpClient.buildSellInstruction({
  mint: mintAddress,
  amount: 1000000, // tokens
  slippage: 500,
  seller: sellerKeypair
});

// Switch modes
pumpClient.setMode(PumpMode.CLASSIC);

// Get token info
const tokenInfo = await pumpClient.getTokenInfo(mintAddress);

// Monitor new tokens
const newTokens = await pumpClient.getNewTokens(50);
```

## 🛠️ Installation

### Prerequisites
- Node.js v16 or higher
- Yarn package manager
- Solana wallet with SOL
- RPC endpoint (Helius, QuickNode, or custom)

### Step 1: Clone and Install
```bash
git clone <your-repo>
cd pump-bundler
yarn install
```

### Step 2: Configuration

Create a config file at `config/bundler-config.json`:

```json
{
  "rpc": {
    "endpoints": [
      {
        "id": "helius-1",
        "name": "Helius Primary",
        "url": "https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY",
        "wsUrl": "wss://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY",
        "priority": 1,
        "isCustom": false,
        "maxRetries": 3,
        "timeout": 30000,
        "healthCheckInterval": 60000
      },
      {
        "id": "helius-2",
        "name": "Helius Backup",
        "url": "https://mainnet.helius-rpc.com/?api-key=YOUR_BACKUP_KEY",
        "wsUrl": "wss://mainnet.helius-rpc.com/?api-key=YOUR_BACKUP_KEY",
        "priority": 2,
        "isCustom": false,
        "maxRetries": 3,
        "timeout": 30000,
        "healthCheckInterval": 60000
      }
    ],
    "autoFailover": true,
    "healthCheckEnabled": true,
    "maxFailoverAttempts": 3
  },
  "wallet": {
    "mainWalletPrivateKey": "YOUR_BASE58_PRIVATE_KEY",
    "bundlerWalletCount": 12
  },
  "defaultMode": "mayhem",
  "bundleStrategy": {
    "walletCount": 12,
    "distribution": "random",
    "timing": {
      "simultaneousBuys": true,
      "staggered": false,
      "randomize": true
    },
    "antiDetection": {
      "randomizeAmounts": true,
      "amountVariance": 15,
      "randomizeTimings": true,
      "timingVariance": 500,
      "varyComputeBudget": true,
      "useMultipleRPCs": false
    },
    "slippageProtection": 500,
    "priorityFee": 100000
  },
  "risk": {
    "maxSolPerBundle": 10,
    "maxSolPerWallet": 1,
    "requireSimulation": true,
    "slippageProtection": 500,
    "rugPullDetection": true,
    "honeypotCheck": true,
    "maxPriceImpact": 10
  },
  "jito": {
    "enabled": true,
    "tipAmount": 0.001,
    "endpoints": [
      "https://mainnet.block-engine.jito.wtf/api/v1/bundles",
      "https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles"
    ]
  }
}
```

## 📝 Usage Examples

### Example 1: Basic Token Creation

```typescript
import { Connection } from '@solana/web3.js';
import { RPCManager } from '@pump-bundler/core/rpc-manager';
import { PumpFunClient } from '@pump-bundler/core/pump-fun';
import { PumpMode } from '@pump-bundler/types';
import { loadKeypairFromString } from '@pump-bundler/utils';

// Initialize RPC Manager
const rpcManager = new RPCManager(config.rpc);
const connection = rpcManager.getCurrentConnection();

// Initialize Pump.fun Client
const pumpClient = new PumpFunClient(connection, PumpMode.MAYHEM);

// Load your wallet
const creator = loadKeypairFromString('YOUR_PRIVATE_KEY');

// Create token
const result = await pumpClient.createToken(
  {
    name: 'Mayhem Token',
    symbol: 'MAYHEM',
    description: 'A token created in mayhem mode!',
    image: './token-image.png'
  },
  creator,
  0.1 // Initial buy
);

console.log('Token created:', result.mint.toBase58());
console.log('Signature:', result.signature);
```

### Example 2: RPC Failover Handling

```typescript
import { RPCManager } from '@pump-bundler/core/rpc-manager';

const rpcManager = new RPCManager({
  endpoints: [
    { id: 'primary', url: 'https://primary-rpc.com', priority: 1, ... },
    { id: 'backup', url: 'https://backup-rpc.com', priority: 2, ... }
  ],
  autoFailover: true,
  healthCheckEnabled: true,
  maxFailoverAttempts: 3
});

// Execute operation with automatic failover
const result = await rpcManager.executeWithFailover(async (connection) => {
  return await connection.getBalance(publicKey);
});

// Manually trigger failover if needed
await rpcManager.failover();

// Check RPC stats
const stats = rpcManager.getStats();
console.log(`Current RPC: ${stats.currentEndpoint}`);
console.log(`Healthy endpoints: ${stats.healthyEndpoints}/${stats.totalEndpoints}`);
console.log(`Average latency: ${stats.averageLatency}ms`);
```

### Example 3: Multi-RPC Management

```typescript
// Add custom RPC
rpcManager.addCustomEndpoint({
  id: 'my-custom-rpc',
  name: 'My Fast RPC',
  url: 'https://my-fast-rpc.com',
  wsUrl: 'wss://my-fast-rpc.com',
  priority: 1, // Make it primary
  isCustom: true,
  maxRetries: 3,
  timeout: 20000,
  healthCheckInterval: 30000
});

// Switch to it
await rpcManager.switchToEndpoint('my-custom-rpc');

// Check health of all RPCs
const healthStatus = rpcManager.getHealthStatus();
healthStatus.forEach(status => {
  console.log(`${status.endpointId}: ${status.isHealthy ? '✅' : '❌'} (${status.latency}ms)`);
});

// Remove an RPC
rpcManager.removeEndpoint('old-rpc');

// List all RPCs
const allEndpoints = rpcManager.getAllEndpoints();
console.log('Available RPCs:', allEndpoints.map(e => e.name));
```

## 🎨 Mode Differences

### Classic Mode
```typescript
pumpClient.setMode(PumpMode.CLASSIC);

// Characteristics:
// - Standard bonding curve (1.0x speed)
// - ~60 minute graduation time
// - 1% platform fee
// - 0.02 SOL creation fee
// - Max 2% buy per transaction
```

### Mayhem Mode
```typescript
pumpClient.setMode(PumpMode.MAYHEM);

// Characteristics:
// - Faster bonding curve (1.5x speed)
// - ~40 minute graduation time
// - 1.5% platform fee
// - 0.03 SOL creation fee
// - Max 2.5% buy per transaction
```

## 🔧 Advanced Configuration

### Custom Distribution Strategy

```typescript
import { calculateDistribution, DistributionType } from '@pump-bundler/utils';

// Even distribution
const evenAmounts = calculateDistribution(1.0, 12, DistributionType.EVEN);
// Result: [0.083, 0.083, 0.083, ...]

// Random distribution
const randomAmounts = calculateDistribution(1.0, 12, DistributionType.RANDOM);
// Result: [0.15, 0.05, 0.12, ...] (random but sums to 1.0)

// Fibonacci distribution
const fibAmounts = calculateDistribution(1.0, 12, DistributionType.FIBONACCI);
// Result: [0.004, 0.004, 0.008, 0.013, 0.021, 0.034, ...]

// Whale distribution (few large wallets)
const whaleAmounts = calculateDistribution(1.0, 12, DistributionType.WHALE);
// Result: [0.4, 0.2, 0.033, 0.033, ...] (first 2 wallets get 60%)

// Custom distribution
const customAmounts = calculateDistribution(
  1.0,
  3,
  DistributionType.CUSTOM,
  [50, 30, 20] // percentages
);
// Result: [0.5, 0.3, 0.2]
```

### Anti-Detection Features

```typescript
import { addRandomVariance, randomDelay } from '@pump-bundler/utils';

// Add variance to amounts (15% variance)
const baseAmount = 0.1; // SOL
const variedAmount = addRandomVariance(baseAmount, 15);
// Result: 0.085 - 0.115 SOL (random)

// Random delay between actions
await randomDelay(500, 2000); // 500-2000ms random delay
```

## 📊 Monitoring & Health Checks

### RPC Health Monitoring

```typescript
// Enable automatic health checks
const rpcManager = new RPCManager({
  ...config,
  healthCheckEnabled: true
});

// Check specific endpoint
const health = await rpcManager.checkEndpointHealth('helius-1');
console.log({
  healthy: health.isHealthy,
  latency: health.latency,
  successRate: (health.successRate * 100).toFixed(2) + '%',
  errorCount: health.errorCount
});

// Get all health statuses
const allHealth = rpcManager.getHealthStatus();
```

## 🚨 Error Handling

### Retry Logic

```typescript
import { retryAsync } from '@pump-bundler/utils';

// Retry with exponential backoff
const result = await retryAsync(
  async () => {
    return await someRiskyOperation();
  },
  3, // max retries
  1000, // initial delay (ms)
  true // use exponential backoff
);
```

### RPC Failover

```typescript
// Automatic failover on RPC errors
try {
  const balance = await rpcManager.executeWithFailover(
    async (connection) => {
      return await connection.getBalance(publicKey);
    }
  );
} catch (error) {
  console.error('All RPCs failed:', error);
}
```

## 📈 Next Steps

### Modules To Be Implemented

1. **CLI Interface** (pending)
   - Interactive TUI with blessed
   - Real-time dashboard
   - Command-line operations

2. **Bundler Module** (pending)
   - Multi-wallet coordination
   - Transaction bundling
   - Jito integration

3. **Sniper Bot** (pending)
   - New token monitoring
   - Filter-based auto-buying
   - WebSocket integration

4. **Volume Generator** (pending)
   - Self-trading patterns
   - Volume targets
   - Organic behavior simulation

5. **Browser Interface** (pending)
   - Next.js web app
   - Wallet adapter
   - Real-time charts

## 🤝 Contributing

Want to help build remaining features? Check out the open issues or create a PR!

---

**You now have a solid foundation with:**
- ✅ Complete type system
- ✅ RPC management with failover
- ✅ Pump.fun integration (classic & mayhem)
- ✅ Comprehensive utilities
- ✅ Configuration system

**Ready to use these modules to build the remaining features!**
