'use client';

import { useState } from 'react';
import { PumpMode, StealthMode } from '@pump-bundler/types';

interface SimulationResult {
  success: boolean;
  tokenAddress: string;
  transactions: {
    wallet: string;
    amount: number;
    block: number;
    confirmed: boolean;
    confirmationTime: number;
  }[];
  summary: {
    totalTxs: number;
    successfulTxs: number;
    failedTxs: number;
    successRate: number;
    avgConfirmationTime: number;
    totalFeesEstimate: number;
    jitoTipsEstimate: number;
    blocksUsed: number;
    estimatedDetectionRisk: 'low' | 'medium' | 'high';
  };
  bondingCurve: {
    initialProgress: number;
    finalProgress: number;
    estimatedMarketCap: number;
    estimatedTimeToGraduate: number;
  };
  warnings: string[];
  recommendations: string[];
}

export default function SimulationMode() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState({
    tokenName: 'Test Token',
    tokenSymbol: 'TEST',
    walletCount: 12,
    totalSol: 5,
    stealthMode: 'HYBRID',
    jitoEnabled: true,
    jitoTip: 0.005,
    mode: 'mayhem' as 'classic' | 'mayhem',
  });

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenMetadata: {
            name: config.tokenName,
            symbol: config.tokenSymbol,
            description: 'Simulation test',
          },
          bundleConfig: {
            walletCount: config.walletCount,
            totalSol: config.totalSol,
            stealthMode: config.stealthMode,
            jitoEnabled: config.jitoEnabled,
            jitoTip: config.jitoTip,
          },
          mode: config.mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Simulation failed');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-900/30 text-green-400';
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'high':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-gray-700 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">🧪 Simulation Mode</h2>
        <p className="text-gray-400 text-sm mt-1">Test your bundle configuration without spending real SOL</p>
      </div>

      {/* Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Token Name</label>
            <input
              type="text"
              value={config.tokenName}
              onChange={(e) => setConfig({ ...config, tokenName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Token Symbol</label>
            <input
              type="text"
              value={config.tokenSymbol}
              onChange={(e) => setConfig({ ...config, tokenSymbol: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Wallet Count</label>
            <input
              type="number"
              value={config.walletCount}
              onChange={(e) => setConfig({ ...config, walletCount: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              min="1"
              max="50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Total SOL to Spend</label>
            <input
              type="number"
              value={config.totalSol}
              onChange={(e) => setConfig({ ...config, totalSol: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              min="0.1"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Stealth Mode</label>
            <select
              value={config.stealthMode}
              onChange={(e) => setConfig({ ...config, stealthMode: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="HYBRID">HYBRID (70% atomic + 30% spread)</option>
              <option value="LIGHT">Light (2 blocks)</option>
              <option value="MEDIUM">Medium (3 blocks)</option>
              <option value="AGGRESSIVE">Aggressive (5 blocks)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Mode</label>
            <select
              value={config.mode}
              onChange={(e) => setConfig({ ...config, mode: e.target.value as any })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="classic">Classic (~60 min)</option>
              <option value="mayhem">Mayhem (~40 min)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.jitoEnabled}
              onChange={(e) => setConfig({ ...config, jitoEnabled: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-gray-300">Enable Jito Bundling</span>
          </label>

          {config.jitoEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-sm">Jito Tip:</span>
              <input
                type="number"
                value={config.jitoTip}
                onChange={(e) => setConfig({ ...config, jitoTip: parseFloat(e.target.value) })}
                className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                step="0.001"
              />
              <span className="text-gray-400 text-sm">SOL</span>
            </div>
          )}
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="w-full px-4 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium disabled:opacity-50"
        >
          {loading ? 'Running Simulation...' : '🚀 Run Simulation'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Success Rate</div>
              <div className={`text-2xl font-bold ${result.summary.successRate >= 95 ? 'text-green-400' : 'text-yellow-400'}`}>
                {result.summary.successRate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Avg Confirmation</div>
              <div className="text-2xl font-bold text-cyan-400">{result.summary.avgConfirmationTime.toFixed(0)}ms</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Total Fees</div>
              <div className="text-2xl font-bold text-orange-400">
                {(result.summary.totalFeesEstimate + result.summary.jitoTipsEstimate).toFixed(4)} SOL
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Detection Risk</div>
              <div className="text-2xl font-bold">
                <span className={`px-3 py-1 rounded text-lg ${getRiskColor(result.summary.estimatedDetectionRisk)}`}>
                  {result.summary.estimatedDetectionRisk.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Bonding Curve Impact */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Bonding Curve Impact</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Bonding Curve Progress</span>
                  <span>{result.bondingCurve.finalProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 h-4 rounded-full transition-all"
                    style={{ width: `${result.bondingCurve.finalProgress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Estimated Market Cap:</div>
                  <div className="text-white font-medium">${(result.bondingCurve.estimatedMarketCap).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400">Est. Time to Graduate:</div>
                  <div className="text-white font-medium">{formatTime(result.bondingCurve.estimatedTimeToGraduate)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
              <h4 className="text-yellow-400 font-bold mb-2">⚠️ Warnings</h4>
              <ul className="list-disc list-inside space-y-1">
                {result.warnings.map((warning, i) => (
                  <li key={i} className="text-yellow-300 text-sm">{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
              <h4 className="text-blue-400 font-bold mb-2">💡 Recommendations</h4>
              <ul className="list-disc list-inside space-y-1">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-blue-300 text-sm">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Transaction Details */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Transaction Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Wallet</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Amount (SOL)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Block</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Confirmation (ms)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {result.transactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-gray-700/50">
                      <td className="px-3 py-2 text-gray-300">{tx.wallet}</td>
                      <td className="px-3 py-2 text-white">{tx.amount.toFixed(4)}</td>
                      <td className="px-3 py-2 text-gray-400">{tx.block}</td>
                      <td className="px-3 py-2 text-cyan-400">{tx.confirmationTime.toFixed(0)}</td>
                      <td className="px-3 py-2">
                        {tx.confirmed ? (
                          <span className="text-green-400">✓ Confirmed</span>
                        ) : (
                          <span className="text-red-400">✗ Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Successful:</div>
                <div className="text-green-400 font-medium">{result.summary.successfulTxs} txs</div>
              </div>
              <div>
                <div className="text-gray-400">Failed:</div>
                <div className="text-red-400 font-medium">{result.summary.failedTxs} txs</div>
              </div>
              <div>
                <div className="text-gray-400">Blocks Used:</div>
                <div className="text-cyan-400 font-medium">{result.summary.blocksUsed} blocks</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
