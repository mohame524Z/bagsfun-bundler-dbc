'use client';

import { useState, useEffect } from 'react';

interface VolumeStrategy {
  id: string;
  name: string;
  enabled: boolean;
  tokenAddress: string;
  targetVolume24h: number;
  currentVolume24h: number;
  walletCount: number;
  minTradeSize: number;
  maxTradeSize: number;
  tradeInterval: number;
  randomization: number;
  priceImpactLimit: number;
  useNaturalPatterns: boolean;
  peakHours: number[];
}

interface VolumeStats {
  totalVolume24h: number;
  totalTrades: number;
  avgTradeSize: number;
  uniqueWallets: number;
  detectionRisk: 'low' | 'medium' | 'high';
  organicRatio: number;
}

export default function VolumeEnhancements() {
  const [strategies, setStrategies] = useState<VolumeStrategy[]>([]);
  const [stats, setStats] = useState<VolumeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStrategy, setNewStrategy] = useState<Partial<VolumeStrategy>>({
    name: '',
    tokenAddress: '',
    targetVolume24h: 1000,
    walletCount: 10,
    minTradeSize: 0.05,
    maxTradeSize: 0.5,
    tradeInterval: 300,
    randomization: 30,
    priceImpactLimit: 1,
    useNaturalPatterns: true,
    peakHours: [10, 11, 14, 15, 16, 19, 20],
  });

  useEffect(() => {
    loadStrategies();
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStrategies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/volume?action=getStrategies');
      const data = await response.json();
      if (response.ok && data.strategies) {
        setStrategies(data.strategies);
      }
    } catch (err) {
      console.error('Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/volume?action=getStats');
      const data = await response.json();
      if (response.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const createStrategy = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createStrategy', strategy: newStrategy }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create strategy');
      }

      setSuccess('Volume strategy created successfully!');
      setShowCreateModal(false);
      loadStrategies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategy = async (id: string, enabled: boolean) => {
    try {
      await fetch('/api/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStrategy', id, enabled }),
      });

      setStrategies(strategies.map(s => s.id === id ? { ...s, enabled } : s));
      setSuccess(`Strategy ${enabled ? 'started' : 'paused'}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteStrategy = async (id: string) => {
    if (!confirm('Delete this volume strategy?')) return;

    try {
      await fetch('/api/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteStrategy', id }),
      });

      setStrategies(strategies.filter(s => s.id !== id));
      setSuccess('Strategy deleted');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'high': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">📊 Volume Bot Enhanced</h2>
          <p className="text-gray-400 text-sm mt-1">Advanced volume generation with natural patterns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          + New Strategy
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

      {/* Global Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">24h Volume</div>
            <div className="text-2xl font-bold text-white">{stats.totalVolume24h.toFixed(2)} SOL</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Trades</div>
            <div className="text-2xl font-bold text-cyan-400">{stats.totalTrades}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Avg Trade Size</div>
            <div className="text-2xl font-bold text-purple-400">{stats.avgTradeSize.toFixed(3)} SOL</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Active Wallets</div>
            <div className="text-2xl font-bold text-green-400">{stats.uniqueWallets}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Detection Risk</div>
            <div className={`text-lg font-bold ${getRiskColor(stats.detectionRisk)}`}>
              {stats.detectionRisk.toUpperCase()}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Organic Ratio</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.organicRatio.toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* Strategies List */}
      <div className="space-y-4">
        {loading && strategies.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Loading strategies...</div>
        ) : strategies.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No volume strategies. Create your first one to get started!
          </div>
        ) : (
          strategies.map((strategy) => (
            <div key={strategy.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{strategy.name}</h3>
                  <p className="text-sm text-gray-400 font-mono">{strategy.tokenAddress.slice(0, 16)}...</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStrategy(strategy.id, !strategy.enabled)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      strategy.enabled
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {strategy.enabled ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={() => deleteStrategy(strategy.id)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-gray-400 text-sm">Target Volume (24h)</div>
                  <div className="text-white font-medium">{strategy.targetVolume24h} SOL</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Current Volume (24h)</div>
                  <div className="text-cyan-400 font-medium">{strategy.currentVolume24h.toFixed(2)} SOL</div>
                  <div className="text-xs text-gray-500">
                    {((strategy.currentVolume24h / strategy.targetVolume24h) * 100).toFixed(0)}% of target
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Wallets</div>
                  <div className="text-white font-medium">{strategy.walletCount}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Trade Size</div>
                  <div className="text-white font-medium">
                    {strategy.minTradeSize} - {strategy.maxTradeSize} SOL
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-400">Interval:</span>
                  <span className="text-white ml-1">{strategy.tradeInterval}s</span>
                </div>
                <div>
                  <span className="text-gray-400">Randomization:</span>
                  <span className="text-white ml-1">±{strategy.randomization}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Price Impact:</span>
                  <span className="text-white ml-1">≤{strategy.priceImpactLimit}%</span>
                </div>
                <div>
                  {strategy.useNaturalPatterns && (
                    <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded">
                      🌿 Natural Patterns
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Strategy Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-6">Create Volume Strategy</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Strategy Name</label>
                <input
                  type="text"
                  value={newStrategy.name}
                  onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="e.g., Token Volume Boost"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Token Address</label>
                <input
                  type="text"
                  value={newStrategy.tokenAddress}
                  onChange={(e) => setNewStrategy({ ...newStrategy, tokenAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono"
                  placeholder="Token mint address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Target 24h Volume (SOL)</label>
                  <input
                    type="number"
                    value={newStrategy.targetVolume24h}
                    onChange={(e) => setNewStrategy({ ...newStrategy, targetVolume24h: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Wallet Count</label>
                  <input
                    type="number"
                    value={newStrategy.walletCount}
                    onChange={(e) => setNewStrategy({ ...newStrategy, walletCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Min Trade Size (SOL)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStrategy.minTradeSize}
                    onChange={(e) => setNewStrategy({ ...newStrategy, minTradeSize: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Max Trade Size (SOL)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStrategy.maxTradeSize}
                    onChange={(e) => setNewStrategy({ ...newStrategy, maxTradeSize: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Trade Interval (seconds)</label>
                  <input
                    type="number"
                    value={newStrategy.tradeInterval}
                    onChange={(e) => setNewStrategy({ ...newStrategy, tradeInterval: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Randomization (%)</label>
                  <input
                    type="number"
                    value={newStrategy.randomization}
                    onChange={(e) => setNewStrategy({ ...newStrategy, randomization: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Price Impact Limit (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newStrategy.priceImpactLimit}
                    onChange={(e) => setNewStrategy({ ...newStrategy, priceImpactLimit: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={newStrategy.useNaturalPatterns}
                    onChange={(e) => setNewStrategy({ ...newStrategy, useNaturalPatterns: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Use Natural Trading Patterns (recommended)
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Simulates organic trading with varying activity during peak hours
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={createStrategy}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Strategy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
