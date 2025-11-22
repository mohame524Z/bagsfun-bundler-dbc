'use client';

import { useState, useEffect } from 'react';

interface BundleAnalytics {
  bundleId: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  timestamp: number;
  stealthMode: string;
  walletCount: number;
  totalSolSpent: number;
  successfulTxs: number;
  failedTxs: number;
  successRate: number;
  avgConfirmationTime: number;
  minConfirmationTime: number;
  maxConfirmationTime: number;
  jitoTipsSpent: number;
  priorityFeesSpent: number;
  totalFeesSpent: number;
  mevInteractions: number;
  blocksUsed: number;
  detectionRisk: 'low' | 'medium' | 'high';
  costPerTx: number;
  efficiency: number;
}

export default function BundleAnalytics() {
  const [bundles, setBundles] = useState<BundleAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<BundleAnalytics | null>(null);
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'success' | 'cost' | 'efficiency'>('date');

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics?action=bundles');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load bundles');
      }

      setBundles(data.bundles || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bundle analytics');
    } finally {
      setLoading(false);
    }
  };

  const filteredBundles = bundles
    .filter(b => filterRisk === 'all' || b.detectionRisk === filterRisk)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.timestamp - a.timestamp;
        case 'success':
          return b.successRate - a.successRate;
        case 'cost':
          return a.totalFeesSpent - b.totalFeesSpent;
        case 'efficiency':
          return b.efficiency - a.efficiency;
        default:
          return 0;
      }
    });

  const avgStats = bundles.length > 0 ? {
    successRate: bundles.reduce((sum, b) => sum + b.successRate, 0) / bundles.length,
    avgConfirmationTime: bundles.reduce((sum, b) => sum + b.avgConfirmationTime, 0) / bundles.length,
    totalFeesSpent: bundles.reduce((sum, b) => sum + b.totalFeesSpent, 0),
    avgCostPerTx: bundles.reduce((sum, b) => sum + b.costPerTx, 0) / bundles.length,
    bestSuccessRate: Math.max(...bundles.map(b => b.successRate)),
    worstSuccessRate: Math.min(...bundles.map(b => b.successRate)),
  } : null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-900/30 text-green-400';
      case 'medium': return 'bg-yellow-900/30 text-yellow-400';
      case 'high': return 'bg-red-900/30 text-red-400';
      default: return 'bg-gray-700 text-gray-400';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-400';
    if (efficiency >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">📊 Bundle Analytics</h2>
        <p className="text-gray-400 text-sm mt-1">Detailed performance metrics for all your bundles</p>
      </div>

      {/* Summary Stats */}
      {avgStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Bundles</div>
            <div className="text-2xl font-bold text-white">{bundles.length}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Avg Success Rate</div>
            <div className={`text-2xl font-bold ${avgStats.successRate >= 95 ? 'text-green-400' : 'text-yellow-400'}`}>
              {avgStats.successRate.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Avg Confirmation</div>
            <div className="text-2xl font-bold text-cyan-400">{avgStats.avgConfirmationTime.toFixed(0)}ms</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Fees Paid</div>
            <div className="text-2xl font-bold text-orange-400">{avgStats.totalFeesSpent.toFixed(4)} SOL</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Avg Cost/Tx</div>
            <div className="text-2xl font-bold text-purple-400">{avgStats.avgCostPerTx.toFixed(6)} SOL</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Best/Worst</div>
            <div className="text-sm">
              <span className="text-green-400">{avgStats.bestSuccessRate.toFixed(1)}%</span>
              {' / '}
              <span className="text-red-400">{avgStats.worstSuccessRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <span className="text-gray-400 text-sm py-2">Risk:</span>
            {['all', 'low', 'medium', 'high'].map((risk) => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk as any)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filterRisk === risk ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {risk.charAt(0).toUpperCase() + risk.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-gray-400 text-sm">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="date">Date</option>
              <option value="success">Success Rate</option>
              <option value="cost">Cost</option>
              <option value="efficiency">Efficiency</option>
            </select>
            <button
              onClick={loadBundles}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm font-medium"
            >
              {loading ? 'Loading...' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {/* Bundle List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Token</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Config</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Success</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Avg Confirm</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Total Fees</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Efficiency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredBundles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    {loading ? 'Loading bundles...' : 'No bundles found. Create your first bundle to see analytics.'}
                  </td>
                </tr>
              ) : (
                filteredBundles.map((bundle) => (
                  <tr
                    key={bundle.bundleId}
                    className="hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => setSelectedBundle(bundle)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-white">{bundle.tokenSymbol}</div>
                        <div className="text-xs text-gray-400">{bundle.tokenName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {new Date(bundle.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {bundle.walletCount}w / {bundle.stealthMode}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${bundle.successRate >= 95 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {bundle.successRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">
                        {bundle.successfulTxs}/{bundle.successfulTxs + bundle.failedTxs}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-cyan-400">{bundle.avgConfirmationTime.toFixed(0)}ms</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-orange-400">{bundle.totalFeesSpent.toFixed(4)} SOL</div>
                      <div className="text-xs text-gray-400">{bundle.costPerTx.toFixed(6)}/tx</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${getEfficiencyColor(bundle.efficiency)}`}>
                        {bundle.efficiency.toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(bundle.detectionRisk)}`}>
                        {bundle.detectionRisk.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bundle Detail Modal */}
      {selectedBundle && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedBundle(null)}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedBundle.tokenName}</h2>
                <p className="text-gray-400">{selectedBundle.tokenSymbol} • {new Date(selectedBundle.timestamp).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedBundle(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 text-sm">Bundle Config</div>
                <div className="text-white font-medium">{selectedBundle.walletCount} wallets</div>
                <div className="text-cyan-400 text-xs">{selectedBundle.stealthMode} mode</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 text-sm">Total Spent</div>
                <div className="text-white font-medium">{selectedBundle.totalSolSpent.toFixed(2)} SOL</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 text-sm">Transactions</div>
                <div className="text-green-400 font-medium">{selectedBundle.successfulTxs} success</div>
                <div className="text-red-400 text-xs">{selectedBundle.failedTxs} failed</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 text-sm">Confirmation Times</div>
                <div className="text-white font-medium">{selectedBundle.avgConfirmationTime.toFixed(0)}ms avg</div>
                <div className="text-xs text-gray-400">{selectedBundle.minConfirmationTime}-{selectedBundle.maxConfirmationTime}ms</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 text-sm">Blocks Used</div>
                <div className="text-white font-medium">{selectedBundle.blocksUsed}</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-gray-400 text-sm">Detection Risk</div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(selectedBundle.detectionRisk)}`}>
                    {selectedBundle.detectionRisk.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded p-4 mb-4">
              <h3 className="text-white font-bold mb-3">Fee Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Jito Tips:</span>
                  <span className="text-purple-400">{selectedBundle.jitoTipsSpent.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Priority Fees:</span>
                  <span className="text-orange-400">{selectedBundle.priorityFeesSpent.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-2">
                  <span className="text-white font-medium">Total Fees:</span>
                  <span className="text-white font-medium">{selectedBundle.totalFeesSpent.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cost per Transaction:</span>
                  <span className="text-gray-300">{selectedBundle.costPerTx.toFixed(6)} SOL</span>
                </div>
              </div>
            </div>

            {selectedBundle.mevInteractions > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-4">
                <h4 className="text-yellow-400 font-bold mb-2">⚠️ MEV Interactions Detected</h4>
                <p className="text-yellow-300 text-sm">
                  {selectedBundle.mevInteractions} potential MEV interactions detected during this bundle execution.
                  Consider increasing Jito tips for better protection.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
