import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import { AppConfig, PumpMode, DistributionType } from '@pump-bundler/types';
import { saveJson, isValidPrivateKey, isValidUrl } from '@pump-bundler/utils';
import * as path from 'path';

console.log(
  chalk.cyan(
    figlet.textSync('Pump Bundler', {
      font: 'Standard',
      horizontalLayout: 'default'
    })
  )
);

console.log(chalk.bold.white('\n🚀 Welcome to Pump.fun Advanced Bundler Setup\n'));
console.log(chalk.gray('This wizard will help you configure your bundler.\n'));

async function setup() {
  const config: Partial<AppConfig> = {};

  // ============================================
  // RPC Configuration
  // ============================================

  console.log(chalk.bold.cyan('\n📡 RPC Configuration\n'));

  const rpcAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'primaryRpcUrl',
      message: 'Primary RPC URL:',
      default: 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
      validate: (input) => isValidUrl(input) || 'Please enter a valid URL'
    },
    {
      type: 'input',
      name: 'primaryRpcWs',
      message: 'Primary WebSocket URL (optional):',
      default: 'wss://mainnet.helius-rpc.com/?api-key=YOUR_KEY'
    },
    {
      type: 'confirm',
      name: 'addBackupRpc',
      message: 'Add backup RPC endpoint?',
      default: true
    }
  ]);

  const endpoints = [
    {
      id: 'primary',
      name: 'Primary RPC',
      url: rpcAnswers.primaryRpcUrl,
      wsUrl: rpcAnswers.primaryRpcWs || undefined,
      priority: 1,
      isCustom: false,
      maxRetries: 3,
      timeout: 30000,
      healthCheckInterval: 60000
    }
  ];

  if (rpcAnswers.addBackupRpc) {
    const backupAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'backupRpcUrl',
        message: 'Backup RPC URL:',
        validate: (input) => isValidUrl(input) || 'Please enter a valid URL'
      },
      {
        type: 'input',
        name: 'backupRpcWs',
        message: 'Backup WebSocket URL (optional):'
      }
    ]);

    endpoints.push({
      id: 'backup',
      name: 'Backup RPC',
      url: backupAnswers.backupRpcUrl,
      wsUrl: backupAnswers.backupRpcWs || undefined,
      priority: 2,
      isCustom: false,
      maxRetries: 3,
      timeout: 30000,
      healthCheckInterval: 60000
    });
  }

  config.rpc = {
    endpoints,
    autoFailover: true,
    healthCheckEnabled: true,
    maxFailoverAttempts: 3
  };

  // ============================================
  // Wallet Configuration
  // ============================================

  console.log(chalk.bold.cyan('\n💼 Wallet Configuration\n'));

  const walletAnswers = await inquirer.prompt([
    {
      type: 'password',
      name: 'privateKey',
      message: 'Main wallet private key (base58):',
      validate: (input) => {
        if (!input) return 'Private key is required';
        if (!isValidPrivateKey(input)) return 'Invalid private key format';
        return true;
      }
    },
    {
      type: 'number',
      name: 'bundlerWalletCount',
      message: 'Number of bundler wallets:',
      default: 12,
      validate: (input) => {
        if (input < 1) return 'Must be at least 1';
        if (input > 50) return 'Maximum 50 wallets';
        return true;
      }
    }
  ]);

  config.wallet = {
    mainWalletPrivateKey: walletAnswers.privateKey,
    bundlerWalletCount: walletAnswers.bundlerWalletCount
  };

  // ============================================
  // Mode Selection
  // ============================================

  console.log(chalk.bold.cyan('\n⚡ Mode Selection\n'));
  console.log(chalk.gray('Classic: Standard bonding curve (~60 min graduation)'));
  console.log(chalk.gray('Mayhem: 50% faster bonding curve (~40 min graduation)\n'));

  const modeAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'defaultMode',
      message: 'Select default mode:',
      choices: [
        { name: 'Classic Mode', value: PumpMode.CLASSIC },
        { name: 'Mayhem Mode', value: PumpMode.MAYHEM }
      ],
      default: PumpMode.MAYHEM
    }
  ]);

  config.defaultMode = modeAnswers.defaultMode;

  // ============================================
  // Bundle Strategy
  // ============================================

  console.log(chalk.bold.cyan('\n🎯 Bundle Strategy\n'));

  const strategyAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'distribution',
      message: 'Distribution strategy:',
      choices: [
        { name: 'Even (equal amounts)', value: DistributionType.EVEN },
        { name: 'Random (varied amounts)', value: DistributionType.RANDOM },
        { name: 'Fibonacci (gradual increase)', value: DistributionType.FIBONACCI },
        { name: 'Whale (few large wallets)', value: DistributionType.WHALE }
      ],
      default: DistributionType.RANDOM
    },
    {
      type: 'confirm',
      name: 'simultaneousBuys',
      message: 'Execute buys simultaneously?',
      default: true
    },
    {
      type: 'confirm',
      name: 'randomizeAmounts',
      message: 'Randomize buy amounts for anti-detection?',
      default: true
    },
    {
      type: 'number',
      name: 'amountVariance',
      message: 'Amount variance percentage (0-50):',
      default: 15,
      when: (answers) => answers.randomizeAmounts,
      validate: (input) => {
        if (input < 0 || input > 50) return 'Must be between 0 and 50';
        return true;
      }
    },
    {
      type: 'number',
      name: 'slippageProtection',
      message: 'Slippage protection (basis points, 500 = 5%):',
      default: 500,
      validate: (input) => {
        if (input < 0) return 'Must be positive';
        if (input > 10000) return 'Maximum 100%';
        return true;
      }
    },
    {
      type: 'number',
      name: 'priorityFee',
      message: 'Priority fee (microLamports):',
      default: 100000
    }
  ]);

  config.bundleStrategy = {
    walletCount: walletAnswers.bundlerWalletCount,
    distribution: strategyAnswers.distribution,
    timing: {
      simultaneousBuys: strategyAnswers.simultaneousBuys,
      staggered: !strategyAnswers.simultaneousBuys,
      randomize: true
    },
    antiDetection: {
      randomizeAmounts: strategyAnswers.randomizeAmounts,
      amountVariance: strategyAnswers.amountVariance || 15,
      randomizeTimings: true,
      timingVariance: 500,
      varyComputeBudget: true,
      useMultipleRPCs: false
    },
    slippageProtection: strategyAnswers.slippageProtection,
    priorityFee: strategyAnswers.priorityFee
  };

  // ============================================
  // Jito Configuration
  // ============================================

  console.log(chalk.bold.cyan('\n⚡ Jito Configuration\n'));
  console.log(chalk.gray('Jito bundles provide MEV protection\n'));

  const jitoAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enabled',
      message: 'Enable Jito bundles?',
      default: true
    },
    {
      type: 'number',
      name: 'tipAmount',
      message: 'Jito tip amount (SOL):',
      default: 0.001,
      when: (answers) => answers.enabled,
      validate: (input) => {
        if (input < 0) return 'Must be positive';
        if (input > 1) return 'Maximum 1 SOL';
        return true;
      }
    }
  ]);

  config.jito = {
    enabled: jitoAnswers.enabled,
    tipAmount: jitoAnswers.tipAmount || 0.001,
    endpoints: [
      'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
      'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles'
    ]
  };

  // ============================================
  // Risk Management
  // ============================================

  console.log(chalk.bold.cyan('\n🛡️ Risk Management\n'));

  const riskAnswers = await inquirer.prompt([
    {
      type: 'number',
      name: 'maxSolPerBundle',
      message: 'Max SOL per bundle:',
      default: 10,
      validate: (input) => input > 0 || 'Must be positive'
    },
    {
      type: 'number',
      name: 'maxSolPerWallet',
      message: 'Max SOL per wallet:',
      default: 1,
      validate: (input) => input > 0 || 'Must be positive'
    },
    {
      type: 'confirm',
      name: 'requireSimulation',
      message: 'Require transaction simulation before execution?',
      default: true
    }
  ]);

  config.risk = {
    maxSolPerBundle: riskAnswers.maxSolPerBundle,
    maxSolPerWallet: riskAnswers.maxSolPerWallet,
    requireSimulation: riskAnswers.requireSimulation,
    slippageProtection: strategyAnswers.slippageProtection,
    rugPullDetection: true,
    honeypotCheck: true,
    maxPriceImpact: 10
  };

  // ============================================
  // Sniper Configuration
  // ============================================

  console.log(chalk.bold.cyan('\n🎯 Sniper Bot (Optional)\n'));

  const sniperAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enableSniper',
      message: 'Configure sniper bot?',
      default: false
    }
  ]);

  if (sniperAnswers.enableSniper) {
    const sniperConfig = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'requireSocials',
        message: 'Require social links (Twitter/Telegram)?',
        default: true
      },
      {
        type: 'number',
        name: 'minNameLength',
        message: 'Minimum token name length:',
        default: 3
      },
      {
        type: 'confirm',
        name: 'autoBuy',
        message: 'Enable auto-buy for sniped tokens?',
        default: false
      }
    ]);

    config.sniper = {
      enabled: true,
      mode: config.defaultMode!,
      filters: {
        requireSocials: sniperConfig.requireSocials,
        minNameLength: sniperConfig.minNameLength
      },
      autoBuy: {
        enabled: sniperConfig.autoBuy,
        amountPerWallet: 0.1,
        maxWallets: 3,
        bundleStrategy: config.bundleStrategy!,
        maxSlippage: 1000
      },
      monitoring: {
        checkInterval: 5000,
        useWebSocket: false,
        alertOnNewToken: true
      }
    };
  }

  // ============================================
  // Volume Generator
  // ============================================

  config.volume = {
    enabled: false,
    targetVolume: 50,
    duration: 60,
    pattern: 'random' as any,
    wallets: [],
    randomization: {
      amountVariance: 20,
      timingVariance: 30,
      priceImpact: 1
    }
  };

  // ============================================
  // Sell Strategy
  // ============================================

  config.sellStrategy = {
    type: 'gradual' as any,
    config: {
      duration: 30,
      intervals: 10,
      percentagePerInterval: 10,
      randomizeTimings: true
    }
  };

  // ============================================
  // Save Configuration
  // ============================================

  console.log(chalk.bold.cyan('\n💾 Saving Configuration\n'));

  const configPath = path.join(process.cwd(), 'config', 'bundler-config.json');

  try {
    saveJson(configPath, config);
    console.log(chalk.green('✅ Configuration saved successfully!'));
    console.log(chalk.gray(`   Location: ${configPath}\n`));

    console.log(chalk.bold.white('🚀 You\'re all set!\n'));
    console.log(chalk.gray('Run the following commands:\n'));
    console.log(chalk.cyan('  yarn cli          ') + chalk.gray('# Start CLI interface'));
    console.log(chalk.cyan('  yarn cli create   ') + chalk.gray('# Create and bundle a token'));
    console.log(chalk.cyan('  yarn cli snipe    ') + chalk.gray('# Start sniper bot'));
    console.log(chalk.cyan('  yarn web          ') + chalk.gray('# Start web interface\n'));
  } catch (error) {
    console.log(chalk.red('❌ Failed to save configuration:'), error);
    process.exit(1);
  }
}

setup().catch(console.error);
