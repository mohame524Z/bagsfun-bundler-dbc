'use client';

import { useState, useEffect } from 'react';

interface TokenAnalytics {
  tokenAddress: string;
  name: string;
  symbol: string;
  createdAt: number;
  initialBuy: number;
  totalInvested: number;
  currentMarketCap: number;
  peakMarketCap: number;
  currentPrice: number;
  peakPrice: number;
  holders: number;
  volume24h: number;
  bondingCurveProgress: number;
  graduatedAt?: number;
  timeToGraduation?: number;
  successRate: number;
  pnl: number;
  pnlPercent: number;
  status: 'active' | 'graduated' | 'failed' | 'sold';
  rugRiskScore: number;
  transactions: number;
  avgConfirmationTime: number;
  bundleConfig: {
    walletCount: number;
    stealthMode: string;
    jitoEnabled: boolean;
  };
}

interface AnalyticsSummary {
  totalTokensCreated: number;
  activeTokens: number;
  graduatedTokens: number;
  failedTokens: number;
  totalBundles: number;
  avgBundleSuccessRate: number;
  avgConfirmationTime: number;
  totalInvested: number;
  totalPnL: number;
  avgPnLPercent: number;
  totalFeesSpent: number;
  totalJitoTips: number;
  bestPerformer: TokenAnalytics | null;
  worstPerformer: TokenAnalytics | null;
  avgTimeToGraduation: number;
}

export default function TokenPerformanceDashboard() {
  const [tokens, setTokens] = useState<TokenAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenAnalytics | null>(null);
  const [sortBy, setSortBy] = useState<'pnl' | 'marketCap' | 'created'>('pnl');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'graduated' | 'failed' | 'sold'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load tokens
      const tokensRes = await fetch('/api/analytics?action=tokens');
      const tokensData = await tokensRes.json();

      // Load summary
      const summaryRes = await fetch('/api/analytics?action=summary');
      const summaryData = await summaryRes.json();

      if (tokensRes.ok && summaryRes.ok) {
        setTokens(tokensData.tokens || []);
        setSummary(summaryData.summary || null);
      } else {
        throw new Error('Failed to load analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const filteredTokens = tokens
    .filter(t => filterStatus === 'all' || t.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'pnl':
          return b.pnl - a.pnl;
        case 'marketCap':
          return b.currentMarketCap - a.currentMarketCap;
        case 'created':
          return b.createdAt - a.createdAt;
        default:
          return 0;
      }
    });

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  const getRiskBadge = (score: number) => {
    if (score < 30) return { label: 'Low Risk', color: 'bg-green-900/30 text-green-400' };
    if (score < 60) return { label: 'Medium Risk', color: 'bg-yellow-900/30 text-yellow-400' };
    return { label: 'High Risk', color: 'bg-red-900/30 text-red-400' };
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total Tokens</div>
            <div className="text-2xl font-bold text-white">{summary.totalTokensCreated}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Active</div>
            <div className="text-2xl font-bold text-cyan-400">{summary.activeTokens}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Graduated</div>
            <div className="text-2xl font-bold text-green-400">{summary.graduatedTokens}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Failed</div>
            <div className="text-2xl font-bold text-red-400">{summary.failedTokens}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Total PnL</div>
            <div className={`text-2xl font-bold ${summary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.totalPnL >= 0 ? '+' : ''}{summary.totalPnL.toFixed(2)} SOL
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm">Avg PnL %</div>
            <div className={`text-2xl font-bold ${summary.avgPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.avgPnLPercent >= 0 ? '+' : ''}{summary.avgPnLPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Performance Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Bundle Performance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Bundles:</span>
                <span className="text-white font-medium">{summary.totalBundles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Success Rate:</span>
                <span className="text-green-400 font-medium">{summary.avgBundleSuccessRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Confirmation:</span>
                <span className="text-cyan-400 font-medium">{summary.avgConfirmationTime.toFixed(0)}ms</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Financial Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Invested:</span>
                <span className="text-white font-medium">{summary.totalInvested.toFixed(2)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Fees:</span>
                <span className="text-orange-400 font-medium">{summary.totalFeesSpent.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Jito Tips:</span>
                <span className="text-purple-400 font-medium">{summary.totalJitoTips.toFixed(4)} SOL</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">Time Metrics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Time to Graduate:</span>
                <span className="text-white font-medium">{formatTime(summary.avgTimeToGraduation)}</span>
              </div>
              {summary.bestPerformer && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Best PnL:</span>
                  <span className="text-green-400 font-medium">
                    {summary.bestPerformer.symbol} (+{summary.bestPerformer.pnlPercent.toFixed(0)}%)
                  </span>
                </div>
              )}
              {summary.worstPerformer && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Worst PnL:</span>
                  <span className="text-red-400 font-medium">
                    {summary.worstPerformer.symbol} ({summary.worstPerformer.pnlPercent.toFixed(0)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filterStatus === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filterStatus === 'active' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('graduated')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filterStatus === 'graduated' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Graduated
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filterStatus === 'failed' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Failed
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-gray-400 text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="pnl">PnL</option>
              <option value="marketCap">Market Cap</option>
              <option value="created">Created Date</option>
            </select>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm font-medium"
            >
              {loading ? 'Loading...' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Token List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {error && (
          <div className="p-4 bg-red-900/30 border-b border-red-500">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Token</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Market Cap</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Bonding Curve</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Holders</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Volume 24h</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">PnL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Rug Risk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    No tokens found. Create your first token to see analytics here.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token) => {
                  const riskBadge = getRiskBadge(token.rugRiskScore);
                  return (
                    <tr
                      key={token.tokenAddress}
                      className="hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => setSelectedToken(token)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-white">{token.symbol}</div>
                          <div className="text-xs text-gray-400">{token.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {new Date(token.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white">${(token.currentMarketCap / 1000).toFixed(1)}k</div>
                        <div className="text-xs text-gray-400">Peak: ${(token.peakMarketCap / 1000).toFixed(1)}k</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-24">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{token.bondingCurveProgress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-cyan-500 h-2 rounded-full"
                              style={{ width: `${token.bondingCurveProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{token.holders}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{token.volume24h.toFixed(2)} SOL</td>
                      <td className="px-4 py-3">
                        <div className={`text-sm font-medium ${token.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.pnl >= 0 ? '+' : ''}{token.pnl.toFixed(2)} SOL
                        </div>
                        <div className={`text-xs ${token.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {token.pnlPercent >= 0 ? '+' : ''}{token.pnlPercent.toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${riskBadge.color}`}>
                          {riskBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          token.status === 'graduated' ? 'bg-green-900/30 text-green-400' :
                          token.status === 'active' ? 'bg-cyan-900/30 text-cyan-400' :
                          token.status === 'sold' ? 'bg-blue-900/30 text-blue-400' :
                          'bg-red-900/30 text-red-400'
                        }`}>
                          {token.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Token Detail Modal */}
      {selectedToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedToken(null)}>
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedToken.name}</h2>
                <p className="text-gray-400">{selectedToken.symbol}</p>
              </div>
              <button
                onClick={() => setSelectedToken(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Address:</div>
                <div className="text-white font-mono text-xs">{selectedToken.tokenAddress.slice(0, 8)}...{selectedToken.tokenAddress.slice(-8)}</div>
              </div>
              <div>
                <div className="text-gray-400">Created:</div>
                <div className="text-white">{formatDate(selectedToken.createdAt)}</div>
              </div>
              <div>
                <div className="text-gray-400">Total Invested:</div>
                <div className="text-white">{selectedToken.totalInvested.toFixed(2)} SOL</div>
              </div>
              <div>
                <div className="text-gray-400">Transactions:</div>
                <div className="text-white">{selectedToken.transactions}</div>
              </div>
              <div>
                <div className="text-gray-400">Bundle Config:</div>
                <div className="text-white">
                  {selectedToken.bundleConfig.walletCount} wallets ({selectedToken.bundleConfig.stealthMode})
                </div>
              </div>
              <div>
                <div className="text-gray-400">Jito:</div>
                <div className="text-white">{selectedToken.bundleConfig.jitoEnabled ? 'Enabled' : 'Disabled'}</div>
              </div>
              {selectedToken.graduatedAt && (
                <>
                  <div>
                    <div className="text-gray-400">Graduated:</div>
                    <div className="text-green-400">{formatDate(selectedToken.graduatedAt)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Time to Graduate:</div>
                    <div className="text-white">{formatTime(selectedToken.timeToGraduation || 0)}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
