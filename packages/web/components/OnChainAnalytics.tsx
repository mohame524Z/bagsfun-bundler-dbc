'use client';

import { useState, useEffect } from 'react';

interface OnChainMetrics {
  totalTransactions: number;
  uniqueTokens: number;
  avgGasSpent: number;
  onChainProfit: number;
  smartContractInteractions: number;
  uniqueCounterparties: number;
}

export default function OnChainAnalytics() {
  const [metrics, setMetrics] = useState<OnChainMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    if (walletAddress) {
      loadMetrics();
    }
  }, [walletAddress]);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/onchain?wallet=${encodeURIComponent(walletAddress)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: OnChainMetrics = await response.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">⛓️ On-Chain Analytics</h2>
        <p className="text-gray-400 text-sm">Deep on-chain data analysis</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <label className="block text-sm text-gray-300 mb-2">Wallet Address</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
          <button
            onClick={loadMetrics}
            disabled={loading || !walletAddress}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Analyze'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Transactions</div>
            <div className="text-2xl font-bold text-white">{metrics.totalTransactions}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Unique Tokens</div>
            <div className="text-2xl font-bold text-cyan-400">{metrics.uniqueTokens}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Avg Gas Spent</div>
            <div className="text-2xl font-bold text-orange-400">{metrics.avgGasSpent} SOL</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">On-Chain Profit</div>
            <div className="text-2xl font-bold text-green-400">+{metrics.onChainProfit} SOL</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Contract Calls</div>
            <div className="text-2xl font-bold text-purple-400">{metrics.smartContractInteractions}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Counterparties</div>
            <div className="text-2xl font-bold text-blue-400">{metrics.uniqueCounterparties}</div>
          </div>
        </div>
      )}

      {!metrics && !error && (
        <div className="text-center py-12 text-gray-400">
          Enter a wallet address to view on-chain analytics
        </div>
      )}
    </div>
  );
}
