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

  // ============================================
  // Stealth Mode Configuration
  // ============================================

  console.log(chalk.bold.cyan('\n🥷 Stealth Mode Configuration\n'));
  console.log(chalk.gray('Avoid detection by bubble maps and blockchain explorers\n'));

  const stealthAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'stealthMode',
      message: 'Stealth mode (balance speed vs detectability):',
      choices: [
        {
          name: 'NONE - Atomic Jito (fastest, 1 block, detectable, MEV protected)',
          value: 'none'
        },
        {
          name: 'HYBRID - 70% atomic + 30% spread (BEST - MEV protected + organic) [Recommended]',
          value: 'hybrid'
        },
        {
          name: 'LIGHT - 2-block spread (fast, some MEV risk)',
          value: 'light'
        },
        {
          name: 'MEDIUM - 3-block spread (balanced, moderate MEV risk)',
          value: 'medium'
        },
        {
          name: 'AGGRESSIVE - 4-5 block spread (slowest, HIGH MEV risk)',
          value: 'aggressive'
        }
      ],
      default: 'hybrid'
    },
    {
      type: 'confirm',
      name: 'shuffleWallets',
      message: 'Shuffle wallet order?',
      default: true,
      when: (answers) => answers.stealthMode !== 'none'
    },
    {
      type: 'confirm',
      name: 'mixedExecution',
      message: 'Mix Jito + RPC transactions?',
      default: true,
      when: (answers) => answers.stealthMode !== 'none'
    },
    {
      type: 'confirm',
      name: 'varyDelays',
      message: 'Add random 50-500ms delays?',
      default: true,
      when: (answers) => answers.stealthMode !== 'none'
    }
  ]);

  let stealthConfig = undefined;

  if (stealthAnswers.stealthMode !== 'none') {
    const spreadBlocksMap: Record<string, number> = {
      hybrid: 3,
      light: 2,
      medium: 3,
      aggressive: 5
    };
    const spreadBlocks = spreadBlocksMap[stealthAnswers.stealthMode as string] || 3;

    stealthConfig = {
      mode: stealthAnswers.stealthMode,
      spreadBlocks,
      shuffleWallets: stealthAnswers.shuffleWallets !== false,
      mixedExecution: stealthAnswers.mixedExecution !== false,
      varyDelays: stealthAnswers.varyDelays !== false,
      aggressiveVariance: stealthAnswers.stealthMode === 'aggressive',
      simulatePostLaunch: false,
      useAgedWallets: false,
      multiRpcRouting: false,
      firstBundlePercent: stealthAnswers.stealthMode === 'hybrid' ? 70 : undefined
    };

    if (stealthAnswers.stealthMode === 'hybrid') {
      console.log(chalk.green('\n✅ HYBRID MODE: Best of both worlds!'));
      console.log(chalk.gray('  - 70% of wallets in atomic Jito bundle (MEV protected)'));
      console.log(chalk.gray('  - 30% of wallets spread across blocks (organic looking)'));
      console.log(chalk.gray('  - Execution time: ~2-3s'));
    } else {
      console.log(chalk.yellow('\n⚠️  Note: Stealth mode trades speed for undetectability'));
      console.log(chalk.gray(`Execution time: ${stealthAnswers.stealthMode === 'light' ? '2-3s' : stealthAnswers.stealthMode === 'medium' ? '3-4s' : '5-6s'}`));
      if (stealthAnswers.stealthMode !== 'light') {
        console.log(chalk.red('⚠️  WARNING: MEV bots can exploit gaps between blocks!'));
      }
    }
  }

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
      useMultipleRPCs: false,
      stealthConfig
    },
    slippageProtection: strategyAnswers.slippageProtection,
    priorityFee: strategyAnswers.priorityFee
  };

  // ============================================
  // Jito Configuration
  // ============================================

  console.log(chalk.bold.cyan('\n⚡ Jito Configuration\n'));
  console.log(chalk.gray('Jito bundles provide MEV protection and priority execution\n'));

  const jitoAnswers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enabled',
      message: 'Enable Jito bundles?',
      default: true
    },
    {
      type: 'list',
      name: 'tipPreset',
      message: 'Select Jito tip amount:',
      when: (answers) => answers.enabled,
      choices: [
        {
          name: '0.0001 SOL - Low (~25th percentile, slower execution)',
          value: 0.0001
        },
        {
          name: '0.0005 SOL - Medium (~50th percentile, normal execution)',
          value: 0.0005
        },
        {
          name: '0.001 SOL - High (~75th percentile, fast execution) [Recommended]',
          value: 0.001
        },
        {
          name: '0.005 SOL - Very High (~90th percentile, priority execution)',
          value: 0.005
        },
        {
          name: '0.01 SOL - Maximum (~95th percentile, highest priority)',
          value: 0.01
        },
        {
          name: 'Custom amount',
          value: 'custom'
        }
      ],
      default: 0.001
    },
    {
      type: 'number',
      name: 'customTip',
      message: 'Enter custom Jito tip amount (SOL):',
      when: (answers) => answers.enabled && answers.tipPreset === 'custom',
      validate: (input) => {
        if (input < 0.00001) return 'Minimum 0.00001 SOL';
        if (input > 1) return 'Maximum 1 SOL';
        return true;
      }
    }
  ]);

  let finalTipAmount = 0.001;
  if (jitoAnswers.enabled) {
    if (jitoAnswers.tipPreset === 'custom') {
      finalTipAmount = jitoAnswers.customTip;
    } else {
      finalTipAmount = jitoAnswers.tipPreset;
    }
  }

  config.jito = {
    enabled: jitoAnswers.enabled,
    tipAmount: finalTipAmount,
    endpoints: [
      'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
      'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
      'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
      'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
      'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles'
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

  // Save to project root config directory (not CLI package directory)
  const configPath = path.join(process.cwd(), '..', '..', 'config', 'bundler-config.json');

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
