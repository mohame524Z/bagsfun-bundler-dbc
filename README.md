# 🚀 Pump.fun Advanced Bundler

A professional-grade pump.fun bundler with CLI and browser interfaces supporting both **Classic** and **Mayhem** modes.

## ✨ Features

### Core Features
- ✅ **Dual Mode Support**: Classic & Mayhem modes with automatic bonding curve adjustments
- ✅ **Advanced RPC Management**: Multi-RPC support with automatic failover and health monitoring
- ✅ **Custom RPC**: Add your own RPC endpoints with priority configuration
- ✅ **Backup RPC System**: Automatic failover to backup RPCs when primary fails
- ✅ **Multi-Wallet Bundling**: Distribute and bundle buys across multiple wallets
- ✅ **Anti-Detection**: Randomize amounts, timings, and compute budgets
- ✅ **Jito Integration**: MEV protection with Jito bundles
- ✅ **Multiple Distribution Strategies**: Even, Random, Fibonacci, Whale, Custom
- ✅ **CLI Interface**: Beautiful terminal UI with real-time updates
- ✅ **Browser Interface**: Web-based dashboard (Next.js)

### Advanced Features
- 🎯 **Token Sniper**: Monitor and auto-buy new tokens with filters
- 📈 **Volume Generator**: Create organic-looking trading volume
- 💰 **Smart Sell Strategies**: Gradual, Trigger-based, and Scheduled sells
- 📊 **Portfolio Tracking**: Real-time P&L and holdings monitoring
- 🔒 **Risk Management**: Slippage protection, honeypot detection, simulation mode
- 🚨 **Health Monitoring**: RPC health checks with automatic failover

## 📁 Project Structure

```
pump-bundler/
├── packages/
│   ├── core/               # Core pump.fun integration
│   │   ├── rpc-manager.ts  # RPC management with failover
│   │   ├── pump-fun.ts     # Pump.fun client (classic & mayhem)
│   │   ├── bundler.ts      # Multi-wallet bundling
│   │   ├── sniper.ts       # Token sniping bot
│   │   └── volume.ts       # Volume generation
│   ├── cli/                # CLI interface
│   │   ├── setup.ts        # Interactive setup wizard
│   │   ├── dashboard.ts    # TUI dashboard
│   │   └── commands/       # CLI commands
│   └── web/                # Browser interface
│       ├── app/            # Next.js app
│       └── components/     # React components
└── shared/
    ├── types/              # TypeScript types
    ├── constants/          # Constants & config
    └── utils/              # Shared utilities
```

## 🚀 Quick Start

### Installation

```bash
# Clone and install
git clone <repo-url>
cd pump-bundler
yarn install

# Run interactive setup
yarn setup

# Start CLI bundler
yarn cli

# Or start web interface
yarn web
```

### Interactive Setup

The setup wizard will prompt you for:

1. **RPC Configuration**
   - Primary RPC endpoint (Helius, QuickNode, etc.)
   - Backup RPC endpoints
   - Custom RPC endpoints
   - Websocket endpoints
   - Health check settings

2. **Wallet Configuration**
   - Main wallet private key
   - Number of bundler wallets to generate
   - Wallet distribution strategy

3. **Mode Selection**
   - Classic mode (standard bonding curve)
   - Mayhem mode (50% faster graduation)

4. **Bundle Strategy**
   - Distribution type (even, random, fibonacci, whale, custom)
   - Anti-detection settings
   - Slippage protection
   - Priority fees

5. **Jito Configuration**
   - Enable/disable Jito bundles
   - Tip amount
   - Preferred regions

6. **Advanced Features**
   - Token sniper configuration
   - Volume generator settings
   - Sell strategy preferences
   - Risk management rules

## 🎮 CLI Usage

### Main Commands

```bash
# Create and bundle a token
yarn cli create

# Snipe new tokens
yarn cli snipe

# Generate volume
yarn cli volume

# View portfolio
yarn cli portfolio

# Manage RPCs
yarn cli rpc list
yarn cli rpc add
yarn cli rpc switch <id>
yarn cli rpc health

# Sell tokens
yarn cli sell --strategy gradual
yarn cli sell --strategy trigger --target 2x
```

### CLI Dashboard

The CLI features a beautiful terminal UI with:
- Real-time RPC health status
- Active token monitoring
- Transaction logs
- Portfolio overview
- Task progress tracking

```
┌─────────────────────────────────────────────────────────────┐
│  PUMP.FUN BUNDLER v1.0 - Mode: [MAYHEM]                     │
├─────────────────────────────────────────────────────────────┤
│  RPC: Helius (Primary) ● 45ms | Backup: QuickNode ● 62ms   │
│  Wallet: 8cKd...xY7q | Balance: 12.5 SOL                    │
│  Bundler Wallets: 12 ready | Total SOL: 1.2                │
├─────────────────────────────────────────────────────────────┤
│  [1] Create & Bundle Token                                   │
│  [2] Snipe New Tokens                                        │
│  [3] Generate Volume                                         │
│  [4] View Portfolio                                          │
│  [5] Sell Strategy                                           │
│  [6] RPC Management                                          │
│  [7] Settings                                                │
│  [0] Exit                                                    │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 Browser Interface

Start the web interface:

```bash
yarn web
```

Features:
- Wallet adapter integration (Phantom, Solflare, etc.)
- Real-time transaction monitoring
- Interactive charts
- Token creation wizard
- Portfolio dashboard
- RPC health monitoring

## 🔧 RPC Management

### Add Custom RPC

```bash
yarn cli rpc add \
  --name "My Custom RPC" \
  --url "https://my-rpc.com" \
  --ws "wss://my-rpc.com" \
  --priority 1
```

### Switch RPC

```bash
yarn cli rpc switch helius-2
```

### RPC Configuration File

```json
{
  "endpoints": [
    {
      "id": "helius-1",
      "name": "Helius Primary",
      "url": "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY",
      "wsUrl": "wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY",
      "priority": 1,
      "isCustom": false,
      "maxRetries": 3,
      "timeout": 30000,
      "healthCheckInterval": 60000
    },
    {
      "id": "custom-1",
      "name": "My RPC",
      "url": "https://my-rpc.com",
      "priority": 2,
      "isCustom": true,
      "maxRetries": 3,
      "timeout": 30000,
      "healthCheckInterval": 60000
    }
  ],
  "autoFailover": true,
  "healthCheckEnabled": true,
  "maxFailoverAttempts": 3
}
```

## 📊 Mode Comparison

| Feature | Classic Mode | Mayhem Mode |
|---------|-------------|-------------|
| Bonding Curve Speed | 1.0x | 1.5x (50% faster) |
| Graduation Threshold | 85 SOL | 85 SOL |
| Platform Fee | 1% | 1.5% |
| Creation Fee | 0.02 SOL | 0.03 SOL |
| Max Buy % | 2.0% | 2.5% |
| Est. Graduation Time | ~60 min | ~40 min |

## 🎯 Distribution Strategies

### Even Distribution
All wallets receive equal amounts.

### Random Distribution
Random amounts with variance for natural appearance.

### Fibonacci Distribution
Amounts follow Fibonacci sequence (1, 1, 2, 3, 5, 8...).

### Whale Distribution
First wallet gets 40%, second 20%, rest distributed evenly.

### Custom Distribution
Define exact percentages for each wallet.

## 🛡️ Risk Management

- **Slippage Protection**: Set max acceptable slippage
- **Simulation Mode**: Test transactions before execution
- **Honeypot Detection**: Check for suspicious contracts
- **Max Price Impact**: Limit market impact per transaction
- **Stop Loss**: Automatic sell on threshold breach
- **Take Profit**: Auto-sell at profit targets

## 🔐 Security

- Never commit private keys or config files
- All sensitive data stored in `.gitignored` directories
- RPC endpoints encrypted in config
- Wallet data never leaves your machine

## 📈 Example Workflows

### Workflow 1: Create & Bundle
```bash
# 1. Run setup
yarn setup

# 2. Create token with 12 wallet bundle
yarn cli create \
  --name "My Token" \
  --symbol "MTK" \
  --mode mayhem \
  --wallets 12 \
  --amount 0.5 \
  --distribution fibonacci

# 3. Monitor in dashboard
yarn cli dashboard
```

### Workflow 2: Snipe New Tokens
```bash
# Configure sniper
yarn cli snipe config \
  --min-liquidity 10 \
  --max-liquidity 100 \
  --require-socials \
  --auto-buy

# Start sniping
yarn cli snipe start
```

### Workflow 3: Generate Volume
```bash
# Generate organic volume
yarn cli volume \
  --token <MINT_ADDRESS> \
  --target-volume 50 \
  --duration 60 \
  --pattern wave
```

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This tool is for educational purposes only. Use at your own risk. The authors are not responsible for any financial losses. Always comply with local regulations and pump.fun terms of service.

## 🆘 Support

- GitHub Issues: Report bugs or request features
- Documentation: Full docs at `/docs`
- Discord: Join our community (link)

---

**Built with ❤️ for the Solana community**
