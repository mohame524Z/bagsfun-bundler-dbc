'use client';

import { useState, useEffect } from 'react';

interface MarketMakerConfig {
  tokenAddress: string;
  tokenSymbol: string;
  enabled: boolean;
  spreadPercent: number;
  orderSize: number;
  minOrderSize: number;
  maxOrderSize: number;
  inventoryTarget: number;
  rebalanceThreshold: number;
  maxPosition: number;
  updateInterval: number;
  riskManagement: {
    stopLoss: number;
    maxDrawdown: number;
    dailyLimit: number;
  };
}

interface MarketMakerStats {
  totalVolume: number;
  profitLoss: number;
  spreadsCollected: number;
  ordersPlaced: number;
  ordersFilled: number;
  fillRate: number;
  currentInventory: number;
  avgSpread: number;
  uptime: number;
}

export default function MarketMakingBot() {
  const [config, setConfig] = useState<MarketMakerConfig>({
    tokenAddress: '',
    tokenSymbol: '',
    enabled: false,
    spreadPercent: 0.5,
    orderSize: 0.1,
    minOrderSize: 0.05,
    maxOrderSize: 0.5,
    inventoryTarget: 1000000,
    rebalanceThreshold: 20,
    maxPosition: 5000000,
    updateInterval: 5,
    riskManagement: {
      stopLoss: 10,
      maxDrawdown: 20,
      dailyLimit: 10,
    },
  });

  const [stats, setStats] = useState<MarketMakerStats>({
    totalVolume: 0,
    profitLoss: 0,
    spreadsCollected: 0,
    ordersPlaced: 0,
    ordersFilled: 0,
    fillRate: 0,
    currentInventory: 0,
    avgSpread: 0,
    uptime: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (config.enabled) {
      const interval = setInterval(loadStats, 10000);
      return () => clearInterval(interval);
    }
  }, [config.enabled]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/marketmaker?action=getStats');
      const data = await response.json();
      if (response.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const toggleMarketMaker = async () => {
    if (!config.tokenAddress) {
      setError('Please enter a token address first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/marketmaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: config.enabled ? 'stop' : 'start',
          tokenAddress: config.tokenAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle market maker');
      }

      setConfig({ ...config, enabled: !config.enabled });
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/marketmaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateConfig',
          tokenAddress: config.tokenAddress,
          updates: config
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save config');
      }

      setSuccess('Configuration saved successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">🤖 Market Making Bot</h2>
            <span className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 text-xs font-semibold rounded-full">
              🧪 LIMITED BETA
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">Provide liquidity and earn spreads (Requires active token strategy)</p>
        </div>
        <button
          onClick={toggleMarketMaker}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            config.enabled
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } disabled:opacity-50`}
        >
          {config.enabled ? '⏸ Stop Market Maker' : '▶ Start Market Maker'}
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
      {config.enabled && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Volume</div>
            <div className="text-2xl font-bold text-white">{stats.totalVolume.toFixed(2)} SOL</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Profit/Loss</div>
            <div className={`text-2xl font-bold ${stats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.profitLoss >= 0 ? '+' : ''}{stats.profitLoss.toFixed(4)} SOL
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Fill Rate</div>
            <div className="text-2xl font-bold text-cyan-400">{stats.fillRate.toFixed(1)}%</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Uptime</div>
            <div className="text-2xl font-bold text-purple-400">{stats.uptime.toFixed(0)}h</div>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">⚙️ Basic Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Token Address</label>
              <input
                type="text"
                value={config.tokenAddress}
                onChange={(e) => setConfig({ ...config, tokenAddress: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono"
                placeholder="Token mint address"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Token Symbol</label>
              <input
                type="text"
                value={config.tokenSymbol}
                onChange={(e) => setConfig({ ...config, tokenSymbol: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="e.g., TOKEN"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Spread (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.spreadPercent}
                  onChange={(e) => setConfig({ ...config, spreadPercent: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Update Interval (s)</label>
                <input
                  type="number"
                  value={config.updateInterval}
                  onChange={(e) => setConfig({ ...config, updateInterval: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Settings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">📊 Order Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Min Order (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.minOrderSize}
                  onChange={(e) => setConfig({ ...config, minOrderSize: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Default Order (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.orderSize}
                  onChange={(e) => setConfig({ ...config, orderSize: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Max Order (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.maxOrderSize}
                  onChange={(e) => setConfig({ ...config, maxOrderSize: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Inventory Target (tokens)</label>
                <input
                  type="number"
                  value={config.inventoryTarget}
                  onChange={(e) => setConfig({ ...config, inventoryTarget: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Max Position (tokens)</label>
                <input
                  type="number"
                  value={config.maxPosition}
                  onChange={(e) => setConfig({ ...config, maxPosition: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Rebalance Threshold (%)</label>
              <input
                type="number"
                value={config.rebalanceThreshold}
                onChange={(e) => setConfig({ ...config, rebalanceThreshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Rebalance when inventory deviates by this % from target
              </p>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">🛡️ Risk Management</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Stop Loss (%)</label>
              <input
                type="number"
                value={config.riskManagement.stopLoss}
                onChange={(e) => setConfig({
                  ...config,
                  riskManagement: { ...config.riskManagement, stopLoss: parseFloat(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Max Drawdown (%)</label>
              <input
                type="number"
                value={config.riskManagement.maxDrawdown}
                onChange={(e) => setConfig({
                  ...config,
                  riskManagement: { ...config.riskManagement, maxDrawdown: parseFloat(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Daily Loss Limit (SOL)</label>
              <input
                type="number"
                step="0.1"
                value={config.riskManagement.dailyLimit}
                onChange={(e) => setConfig({
                  ...config,
                  riskManagement: { ...config.riskManagement, dailyLimit: parseFloat(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
        </div>

        {/* Current Status */}
        {config.enabled && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">📈 Current Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Orders Placed:</span>
                <span className="text-white font-medium">{stats.ordersPlaced}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Orders Filled:</span>
                <span className="text-green-400 font-medium">{stats.ordersFilled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Spreads Collected:</span>
                <span className="text-cyan-400 font-medium">{stats.spreadsCollected.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Spread:</span>
                <span className="text-purple-400 font-medium">{stats.avgSpread.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current Inventory:</span>
                <span className="text-white font-medium">
                  {stats.currentInventory.toLocaleString()} tokens
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Inventory vs Target:</span>
                <span className={`font-medium ${
                  Math.abs(stats.currentInventory - config.inventoryTarget) / config.inventoryTarget * 100 < config.rebalanceThreshold
                    ? 'text-green-400'
                    : 'text-yellow-400'
                }`}>
                  {((stats.currentInventory / config.inventoryTarget - 1) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : '💾 Save Configuration'}
        </button>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-3">💡 About Market Making</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• <strong>Market Making:</strong> Place buy and sell orders to earn the bid-ask spread</p>
          <p>• <strong>Inventory Management:</strong> Automatically rebalances to maintain target position</p>
          <p>• <strong>Risk Controls:</strong> Stop loss, max drawdown, and daily limits protect capital</p>
          <p>• <strong>Continuous Operation:</strong> Bot updates orders based on market conditions</p>
          <p>• <strong>Best For:</strong> Illiquid tokens where you can earn consistent spreads</p>
        </div>
      </div>
    </div>
  );
}
