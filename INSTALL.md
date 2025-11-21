# 🚀 Installation Guide

## Quick Install (5 minutes)

### 1. Prerequisites Check

```bash
# Check Node.js (need v16+)
node --version

# Check Yarn
yarn --version

# If Yarn not installed:
npm install -g yarn
```

### 2. Install Dependencies

```bash
cd /home/user/pump-bundler
yarn install
```

This will install all dependencies for:
- Core package (@pump-bundler/core)
- Shared packages (types, constants, utils)
- CLI package (when built)
- Web package (when built)

### 3. Create Configuration

Create `config/bundler-config.json`:

```bash
mkdir -p config
cat > config/bundler-config.json << 'EOF'
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
      }
    ],
    "autoFailover": true,
    "healthCheckEnabled": true,
    "maxFailoverAttempts": 3
  },
  "wallet": {
    "mainWalletPrivateKey": "YOUR_PRIVATE_KEY_HERE",
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
      "https://mainnet.block-engine.jito.wtf/api/v1/bundles"
    ]
  }
}
EOF
```

### 4. Update Your Configuration

Edit `config/bundler-config.json` and replace:

- `YOUR_API_KEY` with your Helius API key
- `YOUR_PRIVATE_KEY_HERE` with your wallet's base58 private key

**Security Note**: Never commit this file! It's already in `.gitignore`.

### 5. Test Installation

Create a test script `test-setup.ts`:

```typescript
import { RPCManager } from './packages/core/rpc-manager';
import { PumpFunClient } from './packages/core/pump-fun';
import { PumpMode } from './shared/types';
import config from './config/bundler-config.json';

async function test() {
  console.log('🧪 Testing Pump Bundler Setup...\n');

  // Test RPC Manager
  console.log('1️⃣  Testing RPC Manager...');
  const rpcManager = new RPCManager(config.rpc);
  const connection = rpcManager.getCurrentConnection();
  console.log('   ✅ RPC Manager initialized');

  // Check connection
  try {
    const slot = await connection.getSlot();
    console.log(`   ✅ Connected to Solana (Slot: ${slot})`);
  } catch (error) {
    console.error('   ❌ Connection failed:', error);
    return;
  }

  // Test RPC health
  console.log('\n2️⃣  Checking RPC Health...');
  const health = rpcManager.getHealthStatus();
  health.forEach(h => {
    const status = h.isHealthy ? '✅' : '❌';
    console.log(`   ${status} ${h.endpointId}: ${h.latency}ms`);
  });

  // Test Pump.fun Client
  console.log('\n3️⃣  Testing Pump.fun Client...');
  const pumpClient = new PumpFunClient(connection, PumpMode.MAYHEM);
  console.log(`   ✅ Pump.fun Client initialized (Mode: ${pumpClient.getMode()})`);

  // Get new tokens
  try {
    const newTokens = await pumpClient.getNewTokens(5);
    console.log(`   ✅ Fetched ${newTokens.length} recent tokens`);
    if (newTokens.length > 0) {
      console.log(`      Latest: ${newTokens[0].name} (${newTokens[0].symbol})`);
    }
  } catch (error) {
    console.log('   ⚠️  Could not fetch tokens (this is OK if API is rate limited)');
  }

  // Get RPC stats
  console.log('\n4️⃣  RPC Statistics:');
  const stats = rpcManager.getStats();
  console.log(`   Current Endpoint: ${stats.currentEndpoint}`);
  console.log(`   Healthy Endpoints: ${stats.healthyEndpoints}/${stats.totalEndpoints}`);
  console.log(`   Average Latency: ${stats.averageLatency.toFixed(2)}ms`);

  console.log('\n✨ Setup test complete! Everything is working.\n');

  // Cleanup
  rpcManager.destroy();
}

test().catch(console.error);
```

Run the test:

```bash
yarn ts-node test-setup.ts
```

### 6. Expected Output

```
🧪 Testing Pump Bundler Setup...

1️⃣  Testing RPC Manager...
   ✅ RPC Manager initialized
   ✅ Connected to Solana (Slot: 285123456)

2️⃣  Checking RPC Health...
   ✅ helius-1: 45ms

3️⃣  Testing Pump.fun Client...
   ✅ Pump.fun Client initialized (Mode: mayhem)
   ✅ Fetched 5 recent tokens
      Latest: Cool Token (COOL)

4️⃣  RPC Statistics:
   Current Endpoint: Helius Primary
   Healthy Endpoints: 1/1
   Average Latency: 45.00ms

✨ Setup test complete! Everything is working.
```

## ✅ Verification Checklist

- [ ] Node.js v16+ installed
- [ ] Yarn installed
- [ ] Dependencies installed (`yarn install`)
- [ ] Config file created (`config/bundler-config.json`)
- [ ] RPC API key added
- [ ] Wallet private key added
- [ ] Test script runs successfully
- [ ] Connection to Solana works
- [ ] RPC health checks pass

## 🎯 You're Ready!

Now you can:

1. **Use the RPC Manager**
   ```typescript
   import { RPCManager } from '@pump-bundler/core/rpc-manager';
   const rpcManager = new RPCManager(config.rpc);
   ```

2. **Create Tokens**
   ```typescript
   import { PumpFunClient } from '@pump-bundler/core/pump-fun';
   const pumpClient = new PumpFunClient(connection, PumpMode.MAYHEM);
   ```

3. **Calculate Distributions**
   ```typescript
   import { calculateDistribution, DistributionType } from '@pump-bundler/utils';
   const amounts = calculateDistribution(1.0, 12, DistributionType.FIBONACCI);
   ```

## 📚 Next Steps

- Read `GETTING_STARTED.md` for detailed usage examples
- Read `PROJECT_SUMMARY.md` for architecture overview
- Read `README.md` for feature documentation

## 🆘 Troubleshooting

### Error: "Cannot find module"

```bash
# Rebuild node_modules
rm -rf node_modules yarn.lock
yarn install
```

### Error: "RPC connection failed"

- Check your API key is correct
- Verify internet connection
- Try a different RPC endpoint

### Error: "Invalid private key"

- Ensure private key is base58 encoded
- Get it from Phantom: Settings > Export Private Key
- Or from CLI: `solana-keygen recover`

### Error: "Module not found: @pump-bundler/..."

```bash
# Ensure TypeScript paths are correct
yarn tsc --noEmit
```

## 🔐 Security Best Practices

1. **Never commit config files**
   - Already in `.gitignore`
   - Double-check before pushing

2. **Use environment variables for secrets**
   ```typescript
   const privateKey = process.env.PRIVATE_KEY || config.wallet.mainWalletPrivateKey;
   ```

3. **Separate test and production wallets**
   - Use a dedicated wallet for testing
   - Never use your main wallet for development

4. **Keep RPC keys secure**
   - Don't share API keys
   - Rotate keys regularly
   - Use read-only keys when possible

## 🚀 Ready to Build More?

The foundation is complete. Next modules to build:

- **CLI Interface** - Interactive terminal UI
- **Bundler** - Multi-wallet coordination
- **Sniper Bot** - Auto-buy new tokens
- **Volume Generator** - Create trading volume
- **Web Interface** - Browser-based dashboard

See `PROJECT_SUMMARY.md` for next steps!

---

**Installation complete! 🎉**
