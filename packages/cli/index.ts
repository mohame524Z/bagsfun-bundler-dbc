#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import ora from 'ora';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { RPCManager } from '@pump-bundler/core/rpc-manager';
import { PumpFunClient } from '@pump-bundler/core/pump-fun';
import { Bundler } from '@pump-bundler/core/bundler';
import { Sniper } from '@pump-bundler/core/sniper';
import { VolumeGenerator } from '@pump-bundler/core/volume';
import { AppConfig, PumpMode, SellMode } from '@pump-bundler/types';
import { loadJson, loadKeypairFromString, formatSOL } from '@pump-bundler/utils';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

// Load config from project root (not CLI package directory)
const configPath = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');
let config: AppConfig;

try {
  config = loadJson<AppConfig>(configPath, {} as AppConfig);

  if (!config.rpc || !config.wallet) {
    console.log(chalk.red('\n❌ Configuration not found or invalid.\n'));
    console.log(chalk.yellow('Please run setup first:\n'));
    console.log(chalk.cyan('  yarn setup\n'));
    process.exit(1);
  }
} catch (error) {
  console.log(chalk.red('\n❌ Failed to load configuration.\n'));
  console.log(chalk.yellow('Please run setup first:\n'));
  console.log(chalk.cyan('  yarn setup\n'));
  process.exit(1);
}

// Initialize core services
const rpcManager = new RPCManager(config.rpc);
const connection = rpcManager.getCurrentConnection();
const mainWallet = loadKeypairFromString(config.wallet.mainWalletPrivateKey);

// ============================================
// CLI Commands
// ============================================

program
  .name('pump-bundler')
  .description('Pump.fun Advanced Bundler CLI')
  .version('1.0.0');

// ============================================
// Interactive Menu
// ============================================

program
  .command('menu')
  .description('Interactive menu')
  .action(async () => {
    await showMenu();
  });

// ============================================
// Create & Bundle
// ============================================

program
  .command('create')
  .description('Create and bundle a token')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🚀 Create & Bundle Token\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Token name:',
        validate: (input) => !!input || 'Required'
      },
      {
        type: 'input',
        name: 'symbol',
        message: 'Token symbol:',
        validate: (input) => !!input || 'Required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
        validate: (input) => !!input || 'Required'
      },
      {
        type: 'input',
        name: 'image',
        message: 'Image path:',
        validate: (input) => {
          if (!input) return 'Required';
          if (!fs.existsSync(input)) return 'File not found';
          return true;
        }
      },
      {
        type: 'input',
        name: 'twitter',
        message: 'Twitter URL (optional):'
      },
      {
        type: 'input',
        name: 'telegram',
        message: 'Telegram URL (optional):'
      },
      {
        type: 'input',
        name: 'website',
        message: 'Website URL (optional):'
      },
      {
        type: 'number',
        name: 'buyAmount',
        message: 'Buy amount per wallet (SOL):',
        default: 0.1,
        validate: (input) => input > 0 || 'Must be positive'
      }
    ]);

    const spinner = ora('Creating and bundling token...').start();

    try {
      const bundler = new Bundler(connection, mainWallet, config.defaultMode);

      // Setup wallets
      await bundler.setupWallets(config.wallet.bundlerWalletCount);

      // Distribute SOL
      const totalAmount = answers.buyAmount * config.wallet.bundlerWalletCount;
      await bundler.distributeSol(totalAmount + 1, config.bundleStrategy); // +1 for fees

      // Create and bundle
      const result = await bundler.createAndBundleToken(
        {
          name: answers.name,
          symbol: answers.symbol,
          description: answers.description,
          image: answers.image,
          twitter: answers.twitter,
          telegram: answers.telegram,
          website: answers.website
        },
        config.bundleStrategy,
        answers.buyAmount
      );

      spinner.succeed('Token created and bundled!');

      console.log(chalk.green('\n✅ Success!\n'));
      console.log(chalk.white('Token Address:'), chalk.cyan(result.tokenAddress));
      console.log(chalk.white('Transactions:'), chalk.cyan(result.transactions.length));
      console.log(chalk.white('Success Rate:'), chalk.cyan(`${(result.successRate * 100).toFixed(1)}%`));
      console.log(chalk.white('Avg Confirmation:'), chalk.cyan(`${result.averageConfirmationTime.toFixed(0)}ms\n`));
    } catch (error) {
      spinner.fail('Failed to create token');
      console.error(chalk.red(error));
    }
  });

// ============================================
// Sniper
// ============================================

program
  .command('snipe')
  .description('Start sniper bot')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🎯 Sniper Bot\n'));

    if (!config.sniper || !config.sniper.enabled) {
      console.log(chalk.yellow('Sniper not configured. Run setup first.\n'));
      return;
    }

    const sniper = new Sniper(connection, mainWallet, config.sniper);

    console.log(chalk.green('Starting sniper bot...\n'));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    await sniper.start();

    // Keep running
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\nStopping sniper...\n'));
      sniper.stop();
      process.exit(0);
    });
  });

// ============================================
// Volume
// ============================================

program
  .command('volume')
  .description('Generate volume')
  .requiredOption('-t, --token <address>', 'Token mint address')
  .option('-a, --amount <number>', 'Target volume in SOL', '50')
  .option('-d, --duration <number>', 'Duration in minutes', '60')
  .action(async (options) => {
    console.log(chalk.bold.cyan('\n📈 Volume Generator\n'));

    const volumeConfig = {
      ...config.volume,
      targetVolume: parseFloat(options.amount),
      duration: parseInt(options.duration)
    };

    const volumeGen = new VolumeGenerator(connection, volumeConfig, config.defaultMode);

    console.log(chalk.white('Token:'), chalk.cyan(options.token));
    console.log(chalk.white('Target Volume:'), chalk.cyan(`${volumeConfig.targetVolume} SOL`));
    console.log(chalk.white('Duration:'), chalk.cyan(`${volumeConfig.duration} minutes\n`));

    console.log(chalk.green('Starting volume generation...\n'));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));

    await volumeGen.start(options.token);
  });

// ============================================
// RPC Management
// ============================================

program
  .command('rpc')
  .description('Manage RPC endpoints')
  .action(async () => {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Select action:',
        choices: [
          { name: 'List endpoints', value: 'list' },
          { name: 'Check health', value: 'health' },
          { name: 'Switch endpoint', value: 'switch' },
          { name: 'Add custom endpoint', value: 'add' }
        ]
      }
    ]);

    switch (action) {
      case 'list':
        const endpoints = rpcManager.getAllEndpoints();
        console.log(chalk.bold.cyan('\n📡 RPC Endpoints\n'));
        endpoints.forEach((e, i) => {
          console.log(chalk.white(`${i + 1}. ${e.name}`));
          console.log(chalk.gray(`   ID: ${e.id}`));
          console.log(chalk.gray(`   URL: ${e.url}`));
          console.log(chalk.gray(`   Priority: ${e.priority}\n`));
        });
        break;

      case 'health':
        const spinner = ora('Checking RPC health...').start();
        const health = rpcManager.getHealthStatus();
        spinner.stop();

        console.log(chalk.bold.cyan('\n💚 RPC Health Status\n'));
        health.forEach(h => {
          const status = h.isHealthy ? chalk.green('✅ Healthy') : chalk.red('❌ Unhealthy');
          console.log(chalk.white(`${h.endpointId}:`), status);
          console.log(chalk.gray(`   Latency: ${h.latency}ms`));
          console.log(chalk.gray(`   Success Rate: ${(h.successRate * 100).toFixed(1)}%\n`));
        });
        break;

      case 'switch':
        const switchAnswers = await inquirer.prompt([
          {
            type: 'list',
            name: 'endpointId',
            message: 'Select endpoint:',
            choices: rpcManager.getAllEndpoints().map(e => ({
              name: e.name,
              value: e.id
            }))
          }
        ]);

        await rpcManager.switchToEndpoint(switchAnswers.endpointId);
        console.log(chalk.green('\n✅ Switched to ' + switchAnswers.endpointId + '\n'));
        break;

      case 'add':
        console.log(chalk.yellow('\nFeature coming soon!\n'));
        break;
    }
  });

// ============================================
// Portfolio
// ============================================

program
  .command('portfolio')
  .description('Show portfolio stats and holdings')
  .action(async () => {
    const spinner = ora('Loading portfolio...').start();

    try {
      // Load bundler with wallets
      const bundler = new Bundler(connection, mainWallet, config.defaultMode);

      // Try to load saved bundler wallets
      const walletsPath = path.join(process.cwd(), 'keys', 'bundler-wallets.json');
      if (fs.existsSync(walletsPath)) {
        const walletsData = JSON.parse(fs.readFileSync(walletsPath, 'utf-8'));
        const wallets = walletsData.map((k: string) => loadKeypairFromString(k));
        bundler.getPortfolio().addWallets(wallets);
      }

      const portfolio = await bundler.getPortfolio().getPortfolio();
      const holdings = await bundler.getPortfolio().getHoldingsSummary();
      const stats = bundler.getPortfolio().getStats();

      spinner.stop();

      console.log(chalk.bold.cyan('\n💼 Portfolio Overview\n'));

      // Overall Stats
      console.log(chalk.bold.white('Overall Performance:'));
      console.log(chalk.white('  Total Invested:'), chalk.cyan(formatSOL(portfolio.totalInvested * LAMPORTS_PER_SOL) + ' SOL'));
      console.log(chalk.white('  Current Value:'), chalk.cyan(formatSOL(portfolio.currentValue * LAMPORTS_PER_SOL) + ' SOL'));
      console.log(chalk.white('  Unrealized PnL:'), portfolio.unrealizedPnL >= 0
        ? chalk.green(`+${formatSOL(portfolio.unrealizedPnL * LAMPORTS_PER_SOL)} SOL`)
        : chalk.red(`${formatSOL(portfolio.unrealizedPnL * LAMPORTS_PER_SOL)} SOL`));
      console.log(chalk.white('  Realized PnL:'), portfolio.realizedPnL >= 0
        ? chalk.green(`+${formatSOL(portfolio.realizedPnL * LAMPORTS_PER_SOL)} SOL`)
        : chalk.red(`${formatSOL(portfolio.realizedPnL * LAMPORTS_PER_SOL)} SOL`));

      const totalPnL = portfolio.unrealizedPnL + portfolio.realizedPnL;
      const pnlPercent = portfolio.totalInvested > 0
        ? ((totalPnL / portfolio.totalInvested) * 100).toFixed(2)
        : '0.00';
      console.log(chalk.white('  Total PnL:'), totalPnL >= 0
        ? chalk.green(`+${formatSOL(totalPnL * LAMPORTS_PER_SOL)} SOL (${pnlPercent}%)`)
        : chalk.red(`${formatSOL(totalPnL * LAMPORTS_PER_SOL)} SOL (${pnlPercent}%)`));

      // Holdings Summary
      console.log(chalk.bold.white('\nHoldings Summary:'));
      console.log(chalk.white('  Total Wallets:'), chalk.cyan(holdings.totalWallets));
      console.log(chalk.white('  Wallets w/ Tokens:'), chalk.cyan(holdings.walletsWithTokens));
      console.log(chalk.white('  Total Tokens:'), chalk.cyan(holdings.totalTokens.toLocaleString()));
      console.log(chalk.white('  Total Value:'), chalk.cyan(formatSOL(holdings.totalValueSOL * LAMPORTS_PER_SOL) + ' SOL'));

      // Trading Stats
      console.log(chalk.bold.white('\nTrading Stats:'));
      console.log(chalk.white('  Total Buys:'), chalk.cyan(stats.totalBuys));
      console.log(chalk.white('  Total Sells:'), chalk.cyan(stats.totalSells));
      console.log(chalk.white('  Unique Tokens:'), chalk.cyan(stats.uniqueTokens));

      // Token Holdings
      if (portfolio.tokens.length > 0) {
        console.log(chalk.bold.white('\nToken Holdings:\n'));

        for (const token of portfolio.tokens) {
          console.log(chalk.cyan(`  ${token.tokenStats.symbol}`), chalk.gray(`(${token.tokenAddress.slice(0, 8)}...)`));
          console.log(chalk.white('    Amount:'), chalk.cyan(token.totalAmount.toLocaleString()));
          console.log(chalk.white('    Avg Price:'), chalk.cyan(token.averagePrice.toFixed(8) + ' SOL'));
          console.log(chalk.white('    Current Value:'), chalk.cyan(formatSOL(token.currentValue * LAMPORTS_PER_SOL) + ' SOL'));
          console.log(chalk.white('    PnL:'), token.unrealizedPnL >= 0
            ? chalk.green(`+${formatSOL(token.unrealizedPnL * LAMPORTS_PER_SOL)} SOL`)
            : chalk.red(`${formatSOL(token.unrealizedPnL * LAMPORTS_PER_SOL)} SOL`));
          console.log(chalk.white('    Wallets:'), chalk.cyan(token.wallets.length));
          console.log();
        }
      }

      console.log();
    } catch (error) {
      spinner.fail('Failed to load portfolio');
      console.error(chalk.red(error));
    }
  });

// ============================================
// Sell Tokens
// ============================================

program
  .command('sell')
  .description('Sell tokens from bundler wallets')
  .requiredOption('-t, --token <address>', 'Token mint address')
  .option('-m, --mode <mode>', 'Sell mode: regular, bundle, jito', 'regular')
  .option('-p, --percentage <number>', 'Percentage to sell (1-100)', '100')
  .action(async (options) => {
    console.log(chalk.bold.cyan('\n💰 Sell Tokens\n'));

    // Validate mode
    const mode = options.mode.toLowerCase() as SellMode;
    if (!['regular', 'bundle', 'jito'].includes(mode)) {
      console.log(chalk.red('Invalid sell mode. Use: regular, bundle, or jito\n'));
      return;
    }

    // Validate percentage
    const percentage = parseInt(options.percentage);
    if (percentage < 1 || percentage > 100) {
      console.log(chalk.red('Percentage must be between 1 and 100\n'));
      return;
    }

    const spinner = ora('Preparing to sell...').start();

    try {
      const bundler = new Bundler(connection, mainWallet, config.defaultMode);
      const seller = bundler.getSeller();

      // Load bundler wallets
      const walletsPath = path.join(process.cwd(), 'keys', 'bundler-wallets.json');
      if (!fs.existsSync(walletsPath)) {
        spinner.fail('No bundler wallets found. Create a token first.');
        return;
      }

      const walletsData = JSON.parse(fs.readFileSync(walletsPath, 'utf-8'));
      const wallets = walletsData.map((k: string) => loadKeypairFromString(k));

      const tokenMint = new PublicKey(options.token);

      spinner.text = `Selling ${percentage}% via ${mode} mode...`;

      const result = await seller.sell(tokenMint, wallets, {
        mode,
        sellPercentage: percentage,
        slippage: config.bundleStrategy.slippageProtection,
        priorityFee: config.bundleStrategy.priorityFee,
        jitoTipLamports: config.jito.enabled ? config.jito.tipAmount * LAMPORTS_PER_SOL : 10000,
        jitoBundleSize: 20,
        delayBetweenSells: 1000
      });

      spinner.succeed('Sell complete!');

      console.log(chalk.green('\n✅ Sell Results\n'));
      console.log(chalk.white('Mode:'), chalk.cyan(result.mode));
      console.log(chalk.white('Successful:'), chalk.green(`${result.successfulSells}/${result.successfulSells + result.failedSells}`));
      console.log(chalk.white('Total Sold:'), chalk.cyan(result.totalSold.toLocaleString() + ' tokens'));
      console.log(chalk.white('SOL Received:'), chalk.cyan(formatSOL(result.totalReceived * LAMPORTS_PER_SOL) + ' SOL'));
      console.log(chalk.white('Total PnL:'), result.totalPnL >= 0
        ? chalk.green(`+${formatSOL(result.totalPnL * LAMPORTS_PER_SOL)} SOL`)
        : chalk.red(`${formatSOL(result.totalPnL * LAMPORTS_PER_SOL)} SOL`));
      console.log(chalk.white('Duration:'), chalk.cyan(`${(result.duration / 1000).toFixed(1)}s\n`));

    } catch (error) {
      spinner.fail('Sell failed');
      console.error(chalk.red(error));
    }
  });

// ============================================
// Rent Recovery
// ============================================

program
  .command('recover-rent')
  .description('Close empty token accounts to recover rent')
  .requiredOption('-t, --tokens <addresses...>', 'Token mint addresses (space separated)')
  .action(async (options) => {
    console.log(chalk.bold.cyan('\n💸 Recover Rent from Token Accounts\n'));

    const spinner = ora('Preparing...').start();

    try {
      const bundler = new Bundler(connection, mainWallet, config.defaultMode);
      const seller = bundler.getSeller();

      // Load bundler wallets
      const walletsPath = path.join(process.cwd(), 'keys', 'bundler-wallets.json');
      if (!fs.existsSync(walletsPath)) {
        spinner.fail('No bundler wallets found.');
        return;
      }

      const walletsData = JSON.parse(fs.readFileSync(walletsPath, 'utf-8'));
      const wallets = walletsData.map((k: string) => loadKeypairFromString(k));

      const tokenMints = options.tokens.map((addr: string) => new PublicKey(addr));

      spinner.text = 'Closing token accounts...';

      const result = await seller.closeTokenAccounts(
        wallets,
        tokenMints,
        mainWallet.publicKey
      );

      spinner.succeed('Rent recovery complete!');

      console.log(chalk.green('\n✅ Recovery Results\n'));
      console.log(chalk.white('Accounts Closed:'), chalk.cyan(result.closed));
      console.log(chalk.white('Rent Recovered:'), chalk.cyan(formatSOL(result.rentRecovered) + ' SOL'));
      console.log(chalk.white('USD Value:'), chalk.cyan(`~$${((result.rentRecovered / LAMPORTS_PER_SOL) * 100).toFixed(2)}\n`));

    } catch (error) {
      spinner.fail('Recovery failed');
      console.error(chalk.red(error));
    }
  });

// ============================================
// Status
// ============================================

program
  .command('status')
  .description('Show bundler status')
  .action(async () => {
    const spinner = ora('Loading status...').start();

    try {
      const balance = await connection.getBalance(mainWallet.publicKey);
      const slot = await connection.getSlot();
      const rpcStats = rpcManager.getStats();

      spinner.stop();

      console.log(chalk.bold.cyan('\n📊 Bundler Status\n'));

      console.log(chalk.white('Mode:'), chalk.cyan(config.defaultMode));
      console.log(chalk.white('Wallet:'), chalk.cyan(mainWallet.publicKey.toBase58()));
      console.log(chalk.white('Balance:'), chalk.cyan(formatSOL(balance) + ' SOL'));

      console.log(chalk.bold.white('\nRPC:'));
      console.log(chalk.white('  Current:'), chalk.cyan(rpcStats.currentEndpoint));
      console.log(chalk.white('  Healthy:'), chalk.cyan(`${rpcStats.healthyEndpoints}/${rpcStats.totalEndpoints}`));
      console.log(chalk.white('  Avg Latency:'), chalk.cyan(`${rpcStats.averageLatency.toFixed(0)}ms`));

      console.log(chalk.bold.white('\nNetwork:'));
      console.log(chalk.white('  Slot:'), chalk.cyan(slot));

      console.log();
    } catch (error) {
      spinner.fail('Failed to load status');
      console.error(chalk.red(error));
    }
  });

// ============================================
// Interactive Menu
// ============================================

async function showMenu() {
  console.clear();
  console.log(
    chalk.cyan(
      figlet.textSync('Pump Bundler', {
        font: 'Small',
        horizontalLayout: 'default'
      })
    )
  );

  console.log(chalk.bold.white(`\nMode: ${chalk.cyan(config.defaultMode)}`));
  console.log(chalk.gray(`Wallet: ${mainWallet.publicKey.toBase58().slice(0, 8)}...\n`));

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select an option:',
      choices: [
        { name: '🚀 Create & Bundle Token', value: 'create' },
        { name: '💼 View Portfolio', value: 'portfolio' },
        { name: '💰 Sell Tokens', value: 'sell' },
        { name: '💸 Recover Rent', value: 'recover-rent' },
        new inquirer.Separator(),
        { name: '🎯 Start Sniper Bot', value: 'snipe' },
        { name: '📈 Generate Volume', value: 'volume' },
        new inquirer.Separator(),
        { name: '📡 Manage RPCs', value: 'rpc' },
        { name: '📊 Show Status', value: 'status' },
        new inquirer.Separator(),
        { name: '❌ Exit', value: 'exit' }
      ]
    }
  ]);

  if (choice === 'exit') {
    console.log(chalk.green('\n👋 Goodbye!\n'));
    process.exit(0);
  }

  await program.parseAsync(['node', 'cli', choice]);

  // Show menu again
  console.log();
  const { again } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'again',
      message: 'Return to menu?',
      default: true
    }
  ]);

  if (again) {
    await showMenu();
  } else {
    console.log(chalk.green('\n👋 Goodbye!\n'));
    process.exit(0);
  }
}

// ============================================
// Parse & Execute
// ============================================

if (process.argv.length === 2) {
  // No arguments, show menu
  showMenu();
} else {
  program.parse();
}
