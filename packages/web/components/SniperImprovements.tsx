'use client';

import { useState, useEffect } from 'react';

interface SniperConfig {
  enabled: boolean;
  filters: {
    minLiquidity: number;
    maxLiquidity: number;
    minHolders: number;
    maxMarketCap: number;
    requireVerifiedContract: boolean;
    requireSocials: boolean;
    keywords: string[];
    blacklist: string[];
  };
  entry: {
    buyAmount: number;
    maxSlippage: number;
    splitAcrossWallets: boolean;
    walletCount: number;
    useSmartEntry: boolean;
    delayMs: number;
  };
  safety: {
    maxPositionSize: number;
    requireSimulation: boolean;
    checkHoneypot: boolean;
    minLiquidityLock: number;
  };
  gas: {
    priorityFee: number;
    jitoTip: number;
    maxGasPrice: number;
  };
}

interface SniperStats {
  totalSnipes: number;
  successful: number;
  failed: number;
  profitableExits: number;
  totalProfit: number;
  avgEntryTime: number;
  bestMultiplier: number;
}

export default function SniperImprovements() {
  const [config, setConfig] = useState<SniperConfig>({
    enabled: false,
    filters: {
      minLiquidity: 5,
      maxLiquidity: 100,
      minHolders: 10,
      maxMarketCap: 100000,
      requireVerifiedContract: false,
      requireSocials: true,
      keywords: [],
      blacklist: [],
    },
    entry: {
      buyAmount: 0.5,
      maxSlippage: 10,
      splitAcrossWallets: true,
      walletCount: 5,
      useSmartEntry: true,
      delayMs: 100,
    },
    safety: {
      maxPositionSize: 5,
      requireSimulation: true,
      checkHoneypot: true,
      minLiquidityLock: 30,
    },
    gas: {
      priorityFee: 200000,
      jitoTip: 0.01,
      maxGasPrice: 0.001,
    },
  });

  const [stats, setStats] = useState<SniperStats>({
    totalSnipes: 0,
    successful: 0,
    failed: 0,
    profitableExits: 0,
    totalProfit: 0,
    avgEntryTime: 0,
    bestMultiplier: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/sniper?action=getConfig');
      const data = await response.json();
      if (response.ok && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load sniper config');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/sniper?action=getStats');
      const data = await response.json();
      if (response.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load sniper stats');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/sniper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateConfig', config }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save config');
      }

      setSuccess('Sniper configuration saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSniper = async () => {
    const newState = !config.enabled;
    setConfig({ ...config, enabled: newState });

    try {
      await fetch('/api/sniper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newState ? 'start' : 'stop',
        }),
      });

      setSuccess(newState ? 'Sniper bot started!' : 'Sniper bot stopped.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const successRate = stats.totalSnipes > 0 ? (stats.successful / stats.totalSnipes) * 100 : 0;
  const profitRate = stats.successful > 0 ? (stats.profitableExits / stats.successful) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">🎯 Advanced Sniper</h2>
          <p className="text-gray-400 text-sm mt-1">Enhanced token sniping with smart filters and safety features</p>
        </div>
        <button
          onClick={toggleSniper}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            config.enabled
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {config.enabled ? '⏸ Stop Sniper' : '▶ Start Sniper'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <p className="text-green-400">✅ {success}</p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Snipes</div>
          <div className="text-2xl font-bold text-white">{stats.totalSnipes}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Success Rate</div>
          <div className={`text-2xl font-bold ${successRate >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
            {successRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Profitable</div>
          <div className="text-2xl font-bold text-green-400">{stats.profitableExits}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Profit Rate</div>
          <div className={`text-2xl font-bold ${profitRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {profitRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Profit</div>
          <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)} SOL
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Avg Entry</div>
          <div className="text-2xl font-bold text-cyan-400">{stats.avgEntryTime.toFixed(0)}ms</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Best 🚀</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.bestMultiplier.toFixed(1)}x</div>
        </div>
      </div>

      {/* Configuration Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">🔍 Token Filters</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Min Liquidity (SOL)</label>
                <input
                  type="number"
                  value={config.filters.minLiquidity}
                  onChange={(e) => setConfig({
                    ...config,
                    filters: { ...config.filters, minLiquidity: parseFloat(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Max Liquidity (SOL)</label>
                <input
                  type="number"
                  value={config.filters.maxLiquidity}
                  onChange={(e) => setConfig({
                    ...config,
                    filters: { ...config.filters, maxLiquidity: parseFloat(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Min Holders</label>
                <input
                  type="number"
                  value={config.filters.minHolders}
                  onChange={(e) => setConfig({
                    ...config,
                    filters: { ...config.filters, minHolders: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Max Market Cap (SOL)</label>
                <input
                  type="number"
                  value={config.filters.maxMarketCap}
                  onChange={(e) => setConfig({
                    ...config,
                    filters: { ...config.filters, maxMarketCap: parseFloat(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={config.filters.requireVerifiedContract}
                  onChange={(e) => setConfig({
                    ...config,
                    filters: { ...config.filters, requireVerifiedContract: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                Verified Contract Only
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={config.filters.requireSocials}
                  onChange={(e) => setConfig({
                    ...config,
                    filters: { ...config.filters, requireSocials: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                Require Socials
              </label>
            </div>
          </div>
        </div>

        {/* Entry Strategy */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">💰 Entry Strategy</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Buy Amount (SOL)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.entry.buyAmount}
                  onChange={(e) => setConfig({
                    ...config,
                    entry: { ...config.entry, buyAmount: parseFloat(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Max Slippage (%)</label>
                <input
                  type="number"
                  value={config.entry.maxSlippage}
                  onChange={(e) => setConfig({
                    ...config,
                    entry: { ...config.entry, maxSlippage: parseFloat(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Wallet Count</label>
                <input
                  type="number"
                  value={config.entry.walletCount}
                  onChange={(e) => setConfig({
                    ...config,
                    entry: { ...config.entry, walletCount: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Entry Delay (ms)</label>
                <input
                  type="number"
                  value={config.entry.delayMs}
                  onChange={(e) => setConfig({
                    ...config,
                    entry: { ...config.entry, delayMs: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={config.entry.splitAcrossWallets}
                  onChange={(e) => setConfig({
                    ...config,
                    entry: { ...config.entry, splitAcrossWallets: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                Split Across Wallets
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={config.entry.useSmartEntry}
                  onChange={(e) => setConfig({
                    ...config,
                    entry: { ...config.entry, useSmartEntry: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                Smart Entry (Gradual)
              </label>
            </div>
          </div>
        </div>

        {/* Safety Settings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">🛡️ Safety Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Max Position Size (SOL)</label>
                <input
                  type="number"
                  value={config.safety.maxPositionSize}
                  onChange={(e) => setConfig({
                    ...config,
                    safety: { ...config.safety, maxPositionSize: parseFloat(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Min Liquidity Lock (days)</label>
                <input
                  type="number"
                  value={config.safety.minLiquidityLock}
                  onChange={(e) => setConfig({
                    ...config,
                    safety: { ...config.safety, minLiquidityLock: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={config.safety.requireSimulation}
                  onChange={(e) => setConfig({
                    ...config,
                    safety: { ...config.safety, requireSimulation: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                Require Simulation
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={config.safety.checkHoneypot}
                  onChange={(e) => setConfig({
                    ...config,
                    safety: { ...config.safety, checkHoneypot: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                Check Honeypot
              </label>
            </div>
          </div>
        </div>

        {/* Gas Settings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">⛽ Gas Optimization</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Priority Fee (micro lamports)</label>
              <input
                type="number"
                value={config.gas.priorityFee}
                onChange={(e) => setConfig({
                  ...config,
                  gas: { ...config.gas, priorityFee: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Jito Tip (SOL)</label>
              <input
                type="number"
                step="0.001"
                value={config.gas.jitoTip}
                onChange={(e) => setConfig({
                  ...config,
                  gas: { ...config.gas, jitoTip: parseFloat(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Max Gas Price (SOL)</label>
              <input
                type="number"
                step="0.0001"
                value={config.gas.maxGasPrice}
                onChange={(e) => setConfig({
                  ...config,
                  gas: { ...config.gas, maxGasPrice: parseFloat(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : '💾 Save Configuration'}
        </button>
      </div>
    </div>
  );
}
