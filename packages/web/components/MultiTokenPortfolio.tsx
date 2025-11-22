'use client';

import { useState, useEffect } from 'react';

interface TokenPosition {
  tokenAddress: string;
  name: string;
  symbol: string;
  walletCount: number;
  totalTokens: number;
  avgBuyPrice: number;
  currentPrice: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  status: 'active' | 'exited' | 'partial';
  createdAt: number;
}

interface PortfolioAction {
  type: 'rebalance' | 'sell' | 'distribute';
  tokenAddress: string;
  percentage: number;
}

export default function MultiTokenPortfolio() {
  const [positions, setPositions] = useState<TokenPosition[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<'sell' | 'rebalance' | ''>('');

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/portfolio?action=multitoken');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load positions');
      }

      setPositions(data.positions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (tokenAddress: string) => {
    if (selectedTokens.includes(tokenAddress)) {
      setSelectedTokens(selectedTokens.filter(addr => addr !== tokenAddress));
    } else {
      setSelectedTokens([...selectedTokens, tokenAddress]);
    }
  };

  const selectAll = () => {
    if (selectedTokens.length === positions.length) {
      setSelectedTokens([]);
    } else {
      setSelectedTokens(positions.map(p => p.tokenAddress));
    }
  };

  const handleBulkSell = async (percentage: number) => {
    if (selectedTokens.length === 0) {
      setError('Please select tokens to sell');
      return;
    }

    if (!confirm(`Sell ${percentage}% of ${selectedTokens.length} selected tokens?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulkSell',
          tokens: selectedTokens,
          percentage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bulk sell failed');
      }

      setSuccess(`Successfully sold ${percentage}% of ${selectedTokens.length} tokens`);
      setSelectedTokens([]);
      loadPositions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRebalance = async () => {
    if (selectedTokens.length < 2) {
      setError('Select at least 2 tokens to rebalance');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rebalance',
          tokens: selectedTokens,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Rebalance failed');
      }

      setSuccess('Portfolio rebalanced successfully');
      setSelectedTokens([]);
      loadPositions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalInvested = positions.reduce((sum, p) => sum + p.invested, 0);
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const activePositions = positions.filter(p => p.status === 'active').length;
  const profitablePositions = positions.filter(p => p.pnl > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">🎯 Multi-Token Portfolio Manager</h2>
        <p className="text-gray-400 text-sm mt-1">Manage multiple token positions simultaneously</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Positions</div>
          <div className="text-2xl font-bold text-white">{positions.length}</div>
          <div className="text-xs text-gray-400">{activePositions} active</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total Invested</div>
          <div className="text-2xl font-bold text-white">{totalInvested.toFixed(2)} SOL</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Current Value</div>
          <div className="text-2xl font-bold text-cyan-400">{totalValue.toFixed(2)} SOL</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Total PnL</div>
          <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} SOL
          </div>
          <div className={`text-xs ${totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm">Profitable</div>
          <div className="text-2xl font-bold text-green-400">{profitablePositions}</div>
          <div className="text-xs text-gray-400">
            {positions.length > 0 ? ((profitablePositions / positions.length) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTokens.length > 0 && (
        <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="text-cyan-400 font-medium">
              {selectedTokens.length} token(s) selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkSell(25)}
                className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
              >
                Sell 25%
              </button>
              <button
                onClick={() => handleBulkSell(50)}
                className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
              >
                Sell 50%
              </button>
              <button
                onClick={() => handleBulkSell(100)}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Sell All
              </button>
              <button
                onClick={handleRebalance}
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
              >
                Rebalance
              </button>
              <button
                onClick={() => setSelectedTokens([])}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
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

      {/* Positions Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTokens.length === positions.length && positions.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Token</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Wallets</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Invested</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Current Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">PnL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    {loading ? 'Loading positions...' : 'No active positions. Create tokens to see them here.'}
                  </td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr key={position.tokenAddress} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTokens.includes(position.tokenAddress)}
                        onChange={() => toggleSelection(position.tokenAddress)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-white">{position.symbol}</div>
                        <div className="text-xs text-gray-400">{position.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{position.walletCount}</td>
                    <td className="px-4 py-3 text-sm text-white">{position.invested.toFixed(2)} SOL</td>
                    <td className="px-4 py-3 text-sm text-cyan-400">{position.currentValue.toFixed(2)} SOL</td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} SOL
                      </div>
                      <div className={`text-xs ${position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">${position.currentPrice.toFixed(6)}</div>
                      <div className="text-xs text-gray-400">Avg: ${position.avgBuyPrice.toFixed(6)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        position.status === 'active' ? 'bg-green-900/30 text-green-400' :
                        position.status === 'partial' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {position.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
        <h4 className="text-purple-400 font-bold mb-2">💡 Portfolio Management Tips</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
          <li>Select multiple tokens for bulk actions - save time and gas fees</li>
          <li>Rebalance to maintain equal allocation across profitable tokens</li>
          <li>Sell partial positions (25%, 50%) to secure profits while staying exposed</li>
          <li>Monitor PnL% to identify underperforming tokens</li>
          <li>Active status means tokens are still held across multiple wallets</li>
        </ul>
      </div>
    </div>
  );
}
