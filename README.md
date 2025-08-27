# 🚀 bagsfun Bundler DBC

A high-performance Solana blockchain bundler for automated token creation and launchpad operations on Bonk.fun platform.

## ✨ Features

- **Automated Token Creation**: Generate and deploy tokens with custom metadata
- **Multi-Wallet Distribution**: Distribute SOL across multiple wallets for bundling
- **Lookup Table Optimization**: Efficient transaction bundling using Solana LUTs
- **Bonk.fun Integration**: Seamless integration with Bonk.fun launchpad
- **Vanity Address Support**: Generate custom vanity addresses ending with "bonk"
- **Jito MEV Protection**: Advanced transaction execution with Jito integration

## 🛠️ Tech Stack

- **Blockchain**: Solana
- **Language**: TypeScript
- **Key Libraries**: 
  - `@solana/web3.js` - Solana Web3 integration
  - `@raydium-io/raydium-sdk` - Raydium DEX operations
  - `@metadata-ipfs/bonk.fun-ipfs` - Bonk.fun metadata management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Yarn package manager
- Solana CLI tools
- RPC endpoint access

### Installation

```bash
git clone https://github.com/michalstefanow/bagsfun-bundler-dbc.git
cd bagsfun-bundler-dbc
yarn install
```

### Configuration

Create a `.env` file with your configuration:

```env
PRIVATE_KEY=your_private_key
RPC_ENDPOINT=your_rpc_endpoint
RPC_WEBSOCKET_ENDPOINT=your_websocket_endpoint
TOKEN_NAME=YourToken
TOKEN_SYMBOL=YTK
DESCRIPTION=Your token description
SWAP_AMOUNT=0.1
DISTRIBUTION_WALLETNUM=10
VANITY_MODE=true
```

### Usage

```bash
# Start the main bundler
yarn start

# Single wallet bundle
yarn single

# Close lookup table
yarn close

# Gather operations
yarn gather

# Check status
yarn status

# Run tests
yarn test
```

## 📁 Project Structure

```
├── src/           # Core functionality
├── executor/      # Transaction execution logic
├── constants/     # Configuration constants
├── utils/         # Utility functions
├── image/         # Token images and metadata
└── index.ts       # Main entry point
```

## 🔧 Core Components

- **Token Creation**: Automated SPL token deployment with metadata
- **Wallet Distribution**: SOL distribution across multiple keypairs
- **Transaction Bundling**: Efficient LUT-based transaction grouping
- **Launchpad Integration**: Bonk.fun platform token listing

## 📊 Performance Features

- **Lookup Tables**: Optimized transaction size and execution
- **Batch Processing**: Multiple wallet operations in single transactions
- **Compute Budget Management**: Optimized gas usage
- **Parallel Execution**: Concurrent transaction processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Contact

- **Telegram**: [@mooneagle](https://t.me/mooneagle)
- **Project**: [bagsfm-bundler-dbc](https://github.com/michalstefanow/bagsfm-bundler-dbc)

---

**Built with ❤️ for the Solana ecosystem**
