# Web Interface Guide

The pump.fun bundler now has a **fully functional web interface** with all CLI features available through a beautiful UI.

## Features Available in Web Interface

### ✅ All CLI Features Now in Web

The web interface now includes **100% feature parity** with the CLI:

1. **Token Creation & Bundling** with HYBRID stealth mode
2. **Multi-Mode Selling** (Regular, Bundle, Jito)
3. **Portfolio Tracking** with real-time P&L
4. **Sniper Bot** controls
5. **Volume Generation**
6. **RPC Management**

## Getting Started

### 1. Run Setup (CLI Required Once)

Before using the web interface, run the CLI setup **once** to configure your bundler:

```bash
yarn setup
```

This creates your configuration file with:
- Main wallet private key
- Bundler wallet settings
- HYBRID stealth mode (recommended)
- Jito configuration
- Priority fees
- Anti-MEV settings

### 2. Start Web Interface

```bash
cd packages/web
yarn dev
```

Navigate to `http://localhost:3000`

### 3. Connect Your Wallet

Click "Connect Wallet" in the top right and connect your Solana wallet (Phantom, Backpack, etc.)

## Web Features Explained

### 🚀 Create & Bundle Token

**Location**: Create tab

**Features**:
- Token metadata (name, symbol, description, image, socials)
- Bundle configuration (wallet count, buy amount)
- **HYBRID Stealth Mode** (70% atomic + 30% spread)
  - 🥷 NONE: Atomic Jito (fastest, detectable, MEV protected)
  - 💪 **HYBRID**: 70% atomic + 30% spread (BEST - MEV + organic) [Recommended]
  - ⚡ LIGHT: 2-block spread (fast, some MEV risk)
  - 🎯 MEDIUM: 3-block spread (balanced, moderate MEV risk)
  - 🔥 AGGRESSIVE: 4-5 block spread (slowest, HIGH MEV risk)
- **HYBRID Percentage Slider**: Adjust atomic/spread ratio (50-90%)
- **Jito Bundling**: Enable/disable with custom tip amount
- **Priority Fees**: Configure microLamports (200k+ for anti-MEV)

**How It Works**:
1. Fill in token details
2. Upload token image
3. Configure bundle settings
4. Select HYBRID mode (recommended)
5. Adjust first bundle percentage (default 70%)
6. Enable Jito bundling with tip (0.005 SOL recommended)
7. Set priority fee (200,000+ microLamports)
8. Click "Create & Bundle Token"

**Result**:
- Token created on pump.fun
- Automatic bundled buys
- 70% of wallets execute atomically (MEV protected)
- 30% spread for organic appearance
- Success metrics displayed

### 💰 Sell Tokens

**Location**: Sell tab

**Features**:
- Three sell modes:
  - **Regular**: 1-by-1 sequential (most reliable)
  - **Bundle**: Groups of 4 (balanced)
  - **Jito**: Groups of 20+ (fastest)
- **Percentage Slider**: Sell 1-100% of holdings
- **Advanced Settings**:
  - Priority fees
  - Jito tip (for Jito mode)
  - Custom slippage

**How It Works**:
1. Enter token mint address
2. Select sell mode (Regular/Bundle/Jito)
3. Set sell percentage (e.g., 100% to sell all)
4. Configure advanced settings
5. Click "Sell"

**Result**:
- Tokens sold from all bundler wallets
- SOL received
- P&L calculated
- Detailed success metrics

### 💼 Portfolio Tracking

**Location**: Portfolio tab

**Features**:
- **Overall Performance**:
  - Total invested
  - Current value
  - Unrealized P&L
  - Realized P&L
  - Total P&L with percentage
  - Trading stats (buys/sells)
- **Token Holdings**:
  - All tokens held across bundler wallets
  - Click to expand details
  - Amount, avg price, current value, P&L
  - Wallet distribution
- **Real-time Refresh**

**How It Works**:
1. Navigate to Portfolio tab
2. Click "Refresh" to update data
3. Click on any token to see details
4. Track performance across all wallets

### 🎯 Sniper Bot

**Location**: Sniper tab

**Features**:
- Start/stop sniper bot
- Configure target criteria
- Auto-bundle new tokens

**How It Works**:
1. Configure sniper settings
2. Click "Start Sniper"
3. Bot monitors new pump.fun tokens
4. Auto-bundles matching targets

### 📈 Volume Generation

**Location**: Volume tab

**Features**:
- Target volume in SOL
- Duration in minutes
- Organic-looking wash trading

**How It Works**:
1. Enter token address
2. Set target volume (e.g., 50 SOL)
3. Set duration (e.g., 60 minutes)
4. Click "Start"

### 📡 RPC Management

**Location**: RPC tab

**Features**:
- List all RPC endpoints
- Health status
- Latency monitoring
- Switch endpoints

**How It Works**:
1. View endpoint list
2. Check health status
3. Switch to fastest endpoint

## HYBRID Mode Explained

**The Problem**:
- Atomic bundling (all in 1 block) = MEV protected but **detectable** on bubble maps
- Multi-block spreading = Looks organic but **MEV vulnerable** (bots front-run)

**The Solution: HYBRID Mode**

```
Phase 1 (t=0-1s): 70% of wallets → Atomic Jito bundle
  ✅ MEV Protected (majority of capital)
  ✅ 1 block execution
  ✅ All at same price

Phase 2 (t=1-3s): 30% of wallets → Spread across 2 blocks
  ✅ Looks like organic snipers
  ✅ Smaller amounts (acceptable price variance)
  ✅ Avoids bubble map detection
```

**Benefits**:
- 🛡️ **MEV Protection**: 70% of capital protected
- 🥷 **Stealth**: Looks organic on AXIOM/gmgn bubble maps
- ⚡ **Speed**: 2-3 seconds total
- 🎚️ **Flexible**: Adjust atomic/spread ratio (50-90%)

**Example**:
- 15 wallets, 0.4 SOL each
- HYBRID mode (70/30)
- Phase 1: 10 wallets (4 SOL) in 1.5s at 0.000001 SOL
- Phase 2: 5 wallets (2 SOL) spread over 1-2s at 0.0000012-0.0000015 SOL
- **Result**: 67% capital protected, looks organic, total 3 seconds

## API Routes

All web features use these API routes (automatically called by UI):

- `POST /api/create` - Create and bundle token
- `POST /api/sell` - Sell tokens
- `GET /api/portfolio` - Get portfolio data
- `POST /api/sniper` - Control sniper bot
- `POST /api/volume` - Generate volume
- `GET /api/rpc` - RPC endpoints
- `POST /api/rpc` - Switch RPC
- `GET /api/config` - Load config
- `POST /api/config` - Update config

## Comparison: CLI vs Web

| Feature | CLI | Web |
|---------|-----|-----|
| Create & Bundle | ✅ | ✅ |
| HYBRID Stealth Mode | ✅ | ✅ |
| Jito Configuration | ✅ | ✅ |
| Multi-Mode Selling | ✅ | ✅ |
| Portfolio Tracking | ✅ | ✅ |
| Sniper Bot | ✅ | ✅ |
| Volume Generation | ✅ | ✅ |
| RPC Management | ✅ | ✅ |
| **User Interface** | Terminal | Beautiful UI |
| **Ease of Use** | Commands | Click & Go |
| **Best For** | Automation, Scripts | Manual Operations |

**Recommendation**:
- Use **Web** for manual launches and portfolio management
- Use **CLI** for automation, scripts, and advanced workflows

## Prerequisites

1. **Run `yarn setup` first** (creates config file)
2. Solana wallet with SOL for:
   - Token creation fees (~0.02 SOL)
   - Bundler wallet funding
   - Jito tips
   - Priority fees

## Tips for Success

1. **Always use HYBRID mode** for best MEV protection + stealth
2. **Set priority fees to 200k+** microLamports to outbid bots
3. **Enable Jito bundling** with 0.005 SOL tip for Phase 1
4. **Adjust HYBRID percentage** based on goals:
   - 90/10: Maximum MEV protection
   - 70/30: Balanced (recommended)
   - 50/50: Maximum stealth
5. **Monitor portfolio** after launch to track P&L
6. **Use Jito sell mode** for fastest exits

## Troubleshooting

**Error: "Configuration not found"**
- Run `yarn setup` in the root directory first

**Error: "No bundler wallets found"**
- Create a token first to generate bundler wallets

**Transaction failures**
- Increase priority fees
- Increase Jito tip
- Check RPC health status
- Try different RPC endpoint

**Slow bundling**
- Use NONE or HYBRID mode (not AGGRESSIVE)
- Increase priority fees
- Use faster RPC endpoint
- Increase Jito tip

## Next Steps

1. Run `yarn setup` to configure your bundler
2. Start web interface: `cd packages/web && yarn dev`
3. Connect your wallet
4. Create your first token with HYBRID mode
5. Monitor portfolio and sell when ready

**Happy bundling!** 🚀
