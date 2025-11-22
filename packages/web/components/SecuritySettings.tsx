'use client';

import { useState, useEffect } from 'react';

interface ConfigData {
  rpcUrl: string;
  feePayerKeypairPath: string;
  jitoBlockEngineUrl?: string;
  jitoTipLamports?: number;
  numWallets?: number;
}

export default function SecuritySettings() {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  };

  const maskString = (str: string) => {
    if (!str) return '';
    if (str.length < 12) return '***';
    return str.substring(0, 8) + '...' + str.substring(str.length - 4);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">🔒 Security & API Settings</h2>
        <p className="text-gray-400 text-sm mt-1">Manage your API keys, wallets, and security settings</p>
      </div>

      {/* Security Warning */}
      <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
        <h3 className="text-red-400 font-bold text-lg mb-3">⚠️ SECURITY WARNING</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p className="font-semibold">Your private keys are stored UNENCRYPTED in:</p>
          <code className="block bg-black/50 px-3 py-2 rounded text-yellow-400 font-mono text-xs">
            packages/cli/bundler-config.json
          </code>

          <div className="mt-4 space-y-2">
            <p className="font-bold text-red-300">🚨 Security Risks:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Anyone with access to your computer can steal your wallets</li>
              <li>Malware can read the config file and drain your funds</li>
              <li>Backup files may contain sensitive data</li>
              <li>Browser extensions can potentially access localhost</li>
            </ul>
          </div>

          <div className="mt-4 space-y-2">
            <p className="font-bold text-green-300">✅ Security Recommendations:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Use a dedicated wallet</strong> - Don't use your main wallet for bundling</li>
              <li><strong>Keep minimal SOL</strong> - Only fund what you need for trading</li>
              <li><strong>Use hardware wallet</strong> - For storing profits (transfer regularly)</li>
              <li><strong>Enable firewall</strong> - Block unauthorized network access</li>
              <li><strong>Run on isolated machine</strong> - Use a dedicated trading computer</li>
              <li><strong>Regular backups</strong> - But encrypt backup files</li>
              <li><strong>Antivirus protection</strong> - Keep your system clean</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Current Configuration</h3>
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
          >
            {showKeys ? '🙈 Hide Keys' : '👁️ Show Keys'}
          </button>
        </div>

        {config && (
          <div className="space-y-3">
            <div className="bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-400">RPC URL</div>
              <div className="text-white font-mono text-sm">
                {showKeys ? config.rpcUrl : maskString(config.rpcUrl)}
              </div>
            </div>

            <div className="bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-400">Fee Payer Keypair Path</div>
              <div className="text-white font-mono text-sm">
                {config.feePayerKeypairPath}
              </div>
            </div>

            {config.jitoBlockEngineUrl && (
              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400">Jito Block Engine URL</div>
                <div className="text-white font-mono text-sm">
                  {showKeys ? config.jitoBlockEngineUrl : maskString(config.jitoBlockEngineUrl)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400">Bundle Wallets</div>
                <div className="text-white font-bold text-lg">{config.numWallets || 'N/A'}</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-400">Jito Tip (lamports)</div>
                <div className="text-white font-bold text-lg">
                  {config.jitoTipLamports?.toLocaleString() || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Keys for Features */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">API Keys for Advanced Features</h3>

        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-gray-700 rounded p-4">
            <div className="font-bold text-white mb-2">Required for Full Functionality:</div>
            <ul className="space-y-2 ml-2">
              <li>✅ <strong>Solana RPC</strong> - Already configured (above)</li>
              <li>❌ <strong>Twitter API</strong> - Not implemented (for social sentiment)</li>
              <li>❌ <strong>Discord Bot Token</strong> - Not implemented (for community alerts)</li>
              <li>❌ <strong>Telegram Bot Token</strong> - Not implemented (for notifications)</li>
            </ul>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
            <div className="font-bold text-blue-400 mb-2">📝 Note:</div>
            <p className="text-gray-300">
              Most features work WITHOUT additional API keys. The competitor intelligence and sentiment analysis
              use on-chain data and simulated metrics. For production use with real social data, you would need
              to add Twitter/Discord/Telegram API integration.
            </p>
          </div>
        </div>
      </div>

      {/* Security Best Practices */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-purple-400 mb-3">🛡️ Security Best Practices</h3>

        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <div className="font-bold text-white mb-2">1. Wallet Security:</div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Create a NEW wallet specifically for this bundler (don't use existing wallets)</li>
              <li>Fund it with only the amount you plan to trade</li>
              <li>Transfer profits to a secure cold wallet regularly</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white mb-2">2. System Security:</div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Run on a clean, malware-free computer</li>
              <li>Use a dedicated machine for trading if possible</li>
              <li>Don't install untrusted browser extensions</li>
              <li>Keep your OS and antivirus updated</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white mb-2">3. Network Security:</div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Use a VPN for additional privacy</li>
              <li>Don't run on public WiFi</li>
              <li>Firewall should block unauthorized access</li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white mb-2">4. Config File Security:</div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Never commit bundler-config.json to git</li>
              <li>Encrypt backups if you must backup</li>
              <li>Use file permissions (chmod 600) on Linux/Mac</li>
            </ul>
          </div>
        </div>
      </div>

      {/* File Permissions Helper (Linux/Mac) */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-3">🔐 Secure Your Config File</h3>
        <p className="text-gray-400 text-sm mb-3">Run this command to restrict access to your config file:</p>

        <div className="bg-black rounded p-3 font-mono text-sm">
          <div className="text-gray-500 mb-1"># Linux/Mac only:</div>
          <div className="text-green-400">chmod 600 packages/cli/bundler-config.json</div>
          <div className="text-gray-500 mt-2"># This makes it readable/writable only by you</div>
        </div>

        <div className="mt-3 text-xs text-gray-400">
          ⚠️ Windows users: Use NTFS permissions to restrict access to your user account only
        </div>
      </div>
    </div>
  );
}
