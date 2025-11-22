'use client';

import { useState, useEffect } from 'react';

interface WalletHealth {
  address: string;
  solBalance: number;
  tokenCount: number;
  transactionCount24h: number;
  lastActivity: number;
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical' | 'inactive';
  issues: string[];
  recommendations: string[];
  heatLevel: 'cold' | 'warm' | 'hot';
  rotationRecommended: boolean;
}

export default function WalletHealthMonitor() {
  const [wallets, setWallets] = useState<WalletHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<WalletHealth | null>(null);

  useEffect(() => {
    loadWalletHealth();
    if (autoRefresh) {
      const interval = setInterval(loadWalletHealth, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadWalletHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/wallets?action=health');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load wallet health');
      }

      setWallets(data.wallets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-900/30 text-green-400';
      case 'warning':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'critical':
        return 'bg-red-900/30 text-red-400';
      case 'inactive':
        return 'bg-gray-700 text-gray-400';
      default:
        return 'bg-gray-700 text-gray-400';
    }
  };

  const getHeatBadge = (heat: string) => {
    switch (heat) {
      case 'cold':
        return 'bg-blue-900/30 text-blue-400';
      case 'warm':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'hot':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-gray-700 text-gray-400';
    }
  };

  const healthyWallets = wallets.filter(w => w.status === 'healthy').length;
  const warningWallets = wallets.filter(w => w.status === 'warning').length;
  const criticalWallets = wallets.filter(w => w.status === 'critical').length;
  const rotationNeeded = wallets.filter(w => w.rotationRecommended).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">🏥 Wallet Health Monitor</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time health monitoring and recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-refresh (30s)
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Wallets</div>
          <div className="text-2xl font-bold text-white">{wallets.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Healthy</div>
          <div className="text-2xl font-bold text-green-400">{healthyWallets}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Need Attention</div>
          <div className="text-2xl font-bold text-yellow-400">{warningWallets}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Critical</div>
          <div className="text-2xl font-bold text-red-400">{criticalWallets}</div>
        </div>
      </div>

      {/* Alerts */}
      {rotationNeeded > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-yellow-400 font-bold mb-2">⚠️ Wallet Rotation Recommended</h4>
          <p className="text-yellow-300 text-sm">
            {rotationNeeded} wallet(s) are showing high activity and should be rotated to maintain stealth.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {/* Wallet List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-bold">Wallet Health Status</h3>
            <button
              onClick={loadWalletHealth}
              disabled={loading}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500 disabled:opacity-50"
            >
              {loading ? 'Checking...' : '↻ Refresh Now'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Wallet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Health Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">SOL Balance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Activity (24h)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Heat Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Issues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    {loading ? 'Loading wallet health...' : 'No wallets found.'}
                  </td>
                </tr>
              ) : (
                wallets.map((wallet) => (
                  <tr
                    key={wallet.address}
                    className="hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => setSelectedWallet(wallet)}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-cyan-400">
                      {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${getHealthColor(wallet.healthScore)}`}>
                          {wallet.healthScore}
                        </div>
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              wallet.healthScore >= 80 ? 'bg-green-500' :
                              wallet.healthScore >= 60 ? 'bg-yellow-500' :
                              wallet.healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${wallet.healthScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm ${wallet.solBalance < 0.01 ? 'text-red-400' : 'text-white'}`}>
                        {wallet.solBalance.toFixed(4)} SOL
                      </div>
                      {wallet.tokenCount > 0 && (
                        <div className="text-xs text-gray-400">{wallet.tokenCount} tokens</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {wallet.transactionCount24h} txs
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getHeatBadge(wallet.heatLevel)}`}>
                        {wallet.heatLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(wallet.status)}`}>
                        {wallet.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-red-400">
                      {wallet.issues.length > 0 && (
                        <span>⚠️ {wallet.issues.length}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet Detail Modal */}
      {selectedWallet && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedWallet(null)}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-white font-mono">
                  {selectedWallet.address.slice(0, 8)}...{selectedWallet.address.slice(-8)}
                </h2>
                <p className="text-gray-400 text-sm">
                  Last activity: {new Date(selectedWallet.lastActivity).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedWallet(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Health Score */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Health Score</span>
                <span className={`text-2xl font-bold ${getHealthColor(selectedWallet.healthScore)}`}>
                  {selectedWallet.healthScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    selectedWallet.healthScore >= 80 ? 'bg-green-500' :
                    selectedWallet.healthScore >= 60 ? 'bg-yellow-500' :
                    selectedWallet.healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${selectedWallet.healthScore}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 text-sm">SOL Balance</div>
                <div className="text-white font-medium">{selectedWallet.solBalance.toFixed(4)} SOL</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 text-sm">Token Count</div>
                <div className="text-white font-medium">{selectedWallet.tokenCount}</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 text-sm">Activity (24h)</div>
                <div className="text-white font-medium">{selectedWallet.transactionCount24h} txs</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 text-sm">Heat Level</div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getHeatBadge(selectedWallet.heatLevel)}`}>
                    {selectedWallet.heatLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Issues */}
            {selectedWallet.issues.length > 0 && (
              <div className="mb-4">
                <h3 className="text-red-400 font-bold mb-2">⚠️ Issues Detected</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
                  {selectedWallet.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {selectedWallet.recommendations.length > 0 && (
              <div>
                <h3 className="text-cyan-400 font-bold mb-2">💡 Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  {selectedWallet.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedWallet.rotationRecommended && (
              <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded">
                <p className="text-yellow-300 text-sm font-medium">
                  🔄 Wallet rotation recommended - This wallet has high activity and should be replaced to maintain stealth.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
