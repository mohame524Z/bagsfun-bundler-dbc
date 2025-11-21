import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

interface Config {
  PRIVATE_KEY: string;
  RPC_ENDPOINT: string;
  RPC_WEBSOCKET_ENDPOINT: string;
  SWAP_AMOUNT: string;
  DISTRIBUTION_WALLETNUM: string;
  JITO_FEE: string;
  TOKEN_NAME: string;
  TOKEN_SYMBOL: string;
  DESCRIPTION: string;
  TOKEN_SHOW_NAME: string;
  TOKEN_CREATE_ON: string;
  TWITTER: string;
  TELEGRAM: string;
  WEBSITE: string;
  FILE: string;
  BUYER_WALLET: string;
  BUYER_AMOUNT: string;
  VANITY_MODE: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function runSetup() {
  console.log('\n=== Bags.fun Bundler Configuration Setup ===\n');

  const config: Config = {
    PRIVATE_KEY: '',
    RPC_ENDPOINT: '',
    RPC_WEBSOCKET_ENDPOINT: '',
    SWAP_AMOUNT: '',
    DISTRIBUTION_WALLETNUM: '',
    JITO_FEE: '',
    TOKEN_NAME: '',
    TOKEN_SYMBOL: '',
    DESCRIPTION: '',
    TOKEN_SHOW_NAME: '',
    TOKEN_CREATE_ON: '',
    TWITTER: '',
    TELEGRAM: '',
    WEBSITE: '',
    FILE: '',
    BUYER_WALLET: '',
    BUYER_AMOUNT: '',
    VANITY_MODE: ''
  };

  console.log('📋 Wallet Configuration\n');

  config.PRIVATE_KEY = await question('Enter your PRIVATE_KEY (base58 encoded): ');

  console.log('\n🌐 RPC Configuration\n');

  const defaultRpc = 'https://mainnet.helius-rpc.com/?api-key=';
  const rpcInput = await question(`Enter RPC_ENDPOINT [${defaultRpc}]: `);
  config.RPC_ENDPOINT = rpcInput || defaultRpc;

  const defaultWs = 'wss://mainnet.helius-rpc.com/?api-key=';
  const wsInput = await question(`Enter RPC_WEBSOCKET_ENDPOINT [${defaultWs}]: `);
  config.RPC_WEBSOCKET_ENDPOINT = wsInput || defaultWs;

  console.log('\n💰 Bundle Configuration\n');

  const swapAmountInput = await question('Enter SWAP_AMOUNT in SOL [0.001]: ');
  config.SWAP_AMOUNT = swapAmountInput || '0.001';

  const walletNumInput = await question('Enter DISTRIBUTION_WALLETNUM (number of bundler wallets) [12]: ');
  config.DISTRIBUTION_WALLETNUM = walletNumInput || '12';

  const jitoFeeInput = await question('Enter JITO_FEE in SOL [0.001]: ');
  config.JITO_FEE = jitoFeeInput || '0.001';

  console.log('\n🪙 Token Metadata\n');

  config.TOKEN_NAME = await question('Enter TOKEN_NAME: ');
  config.TOKEN_SYMBOL = await question('Enter TOKEN_SYMBOL: ');
  config.DESCRIPTION = await question('Enter DESCRIPTION: ');
  config.TOKEN_SHOW_NAME = await question('Enter TOKEN_SHOW_NAME (display name): ');

  const createOnInput = await question('Enter TOKEN_CREATE_ON [https://bags.fm]: ');
  config.TOKEN_CREATE_ON = createOnInput || 'https://bags.fm';

  console.log('\n🔗 Social Links\n');

  const twitterInput = await question('Enter TWITTER URL [https://x.com/]: ');
  config.TWITTER = twitterInput || 'https://x.com/';

  const telegramInput = await question('Enter TELEGRAM URL [https://t.me]: ');
  config.TELEGRAM = telegramInput || 'https://t.me';

  const websiteInput = await question('Enter WEBSITE URL [https://website.com]: ');
  config.WEBSITE = websiteInput || 'https://website.com';

  console.log('\n🖼️  Token Image\n');

  const fileInput = await question('Enter FILE path (path to token image) [./image/2.jpg]: ');
  config.FILE = fileInput || './image/2.jpg';

  console.log('\n💼 Single Wallet Bundle (Optional - press Enter to skip)\n');

  config.BUYER_WALLET = await question('Enter BUYER_WALLET (base58 encoded) [optional]: ');
  config.BUYER_AMOUNT = await question('Enter BUYER_AMOUNT in SOL [optional]: ');

  console.log('\n✨ Vanity Address (Optional)\n');

  const vanityInput = await question('Enable VANITY_MODE? (generates address ending with "bonk") [true/false]: ');
  config.VANITY_MODE = vanityInput || 'false';

  // Save configuration
  const configDir = path.join(__dirname, 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configPath = path.join(configDir, 'bundler-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log('\n✅ Configuration saved to config/bundler-config.json\n');
  console.log('You can now run:');
  console.log('  - yarn start    (multi-wallet bundle)');
  console.log('  - yarn single   (single-wallet bundle)');
  console.log('  - yarn gather   (collect funds back)');
  console.log('  - yarn status   (view holdings)');
  console.log('\n');

  rl.close();
}

runSetup().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
