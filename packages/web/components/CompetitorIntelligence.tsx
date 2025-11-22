'use client';

import { useState, useEffect } from 'react';

interface CompetitorActivity {
  id: string;
  wallet: string;
  label?: string;
  lastActive: number;
  tokensTraded24h: number;
  volume24h: number;
  profitLoss24h: number;
  successRate: number;
  avgHoldTime: number;
  topTokens: {
    address: string;
    symbol: string;
    profit: number;
    holdTime: number;
  }[];
  tradingPattern: 'aggressive' | 'moderate' | 'conservative';
  riskScore: number;
}

interface SmartAlert {
  id: string;
  type: 'copy_trade' | 'new_token' | 'large_exit' | 'pattern_change';
  wallet: string;
  timestamp: number;
  message: string;
  tokenAddress?: string;
  amount?: number;
}

export default function CompetitorIntelligence() {
  const [competitors, setCompetitors] = useState<CompetitorActivity[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [watchedWallets, setWatchedWallets] = useState<string[]>([]);
  const [newWallet, setNewWallet] = useState('');
  const [walletLabel, setWalletLabel] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadCompetitors();
    loadAlerts();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadCompetitors();
        loadAlerts();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadCompetitors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/intelligence?action=getCompetitors');
      const data = await response.json();
      if (response.ok && data.competitors) {
        setCompetitors(data.competitors);
        setWatchedWallets(data.competitors.map((c: CompetitorActivity) => c.wallet));
      }
    } catch (err) {
      console.error('Failed to load competitors');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/intelligence?action=getAlerts');
      const data = await response.json();
      if (response.ok && data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Failed to load alerts');
    }
  };

  const addWallet = async () => {
    if (!newWallet) return;

    try {
      const response = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addWallet',
          wallet: newWallet,
          label: walletLabel || undefined
        }),
      });

      if (response.ok) {
        setNewWallet('');
        setWalletLabel('');
        loadCompetitors();
      }
    } catch (err) {
      console.error('Failed to add wallet');
    }
  };

  const removeWallet = async (wallet: string) => {
    if (!confirm('Stop watching this wallet?')) return;

    try {
      await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeWallet', wallet }),
      });

      loadCompetitors();
    } catch (err) {
      console.error('Failed to remove wallet');
    }
  };

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'aggressive': return 'text-red-400 bg-red-900/20';
      case 'moderate': return 'text-yellow-400 bg-yellow-900/20';
      case 'conservative': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'copy_trade': return '🎯';
      case 'new_token': return '🆕';
      case 'large_exit': return '🚪';
      case 'pattern_change': return '📊';
      default: return '📢';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">🔍 Competitor Intelligence</h2>
          <p className="text-gray-400 text-sm mt-1">Track and analyze successful traders</p>
        </div>
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

      {/* Add Wallet */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-bold mb-3">Add Wallet to Watch</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newWallet}
            onChange={(e) => setNewWallet(e.target.value)}
            placeholder="Wallet address"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
          />
          <input
            type="text"
            value={walletLabel}
            onChange={(e) => setWalletLabel(e.target.value)}
            placeholder="Label (optional)"
            className="w-40 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
          <button
            onClick={addWallet}
            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium"
          >
            Add
          </button>
        </div>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <h3 className="text-yellow-400 font-bold mb-3">🔔 Recent Alerts</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="text-sm text-gray-300 flex items-start gap-2">
                <span>{getAlertIcon(alert.type)}</span>
                <div className="flex-1">
                  <span>{alert.message}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitors List */}
      <div className="space-y-4">
        {loading && competitors.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Loading competitors...</div>
        ) : competitors.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No wallets being watched. Add a successful trader's wallet to start tracking.
          </div>
        ) : (
          competitors.map((comp) => (
            <div key={comp.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white font-mono">
                      {comp.wallet.slice(0, 8)}...{comp.wallet.slice(-6)}
                    </h3>
                    {comp.label && (
                      <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs">
                        {comp.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Last active: {new Date(comp.lastActive).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => removeWallet(comp.wallet)}
                  className="px-3 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
                >
                  Remove
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs">24h Volume</div>
                  <div className="text-white font-medium">{comp.volume24h.toFixed(2)} SOL</div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs">24h P&L</div>
                  <div className={`font-medium ${comp.profitLoss24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {comp.profitLoss24h >= 0 ? '+' : ''}{comp.profitLoss24h.toFixed(2)} SOL
                  </div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs">Success Rate</div>
                  <div className={`font-medium ${comp.successRate >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {comp.successRate.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <div className="text-gray-400 text-xs">Avg Hold Time</div>
                  <div className="text-white font-medium">
                    {comp.avgHoldTime < 60 ? `${comp.avgHoldTime.toFixed(0)}m` : `${(comp.avgHoldTime / 60).toFixed(1)}h`}
                  </div>
                </div>
              </div>

              {/* Trading Pattern */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Pattern:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPatternColor(comp.tradingPattern)}`}>
                    {comp.tradingPattern.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Risk Score:</span>
                  <span className={`font-medium ${
                    comp.riskScore < 30 ? 'text-green-400' :
                    comp.riskScore < 70 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {comp.riskScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Tokens (24h):</span>
                  <span className="text-white font-medium">{comp.tokensTraded24h}</span>
                </div>
              </div>

              {/* Top Tokens */}
              {comp.topTokens.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-300 mb-2">Top Performing Tokens</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {comp.topTokens.slice(0, 3).map((token, idx) => (
                      <div key={idx} className="bg-gray-700/50 rounded p-2 text-xs">
                        <div className="font-mono text-cyan-400">{token.symbol}</div>
                        <div className="flex justify-between mt-1">
                          <span className={token.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {token.profit >= 0 ? '+' : ''}{token.profit.toFixed(2)} SOL
                          </span>
                          <span className="text-gray-400">
                            {token.holdTime < 60 ? `${token.holdTime}m` : `${(token.holdTime / 60).toFixed(0)}h`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-3">💡 About Competitor Intelligence</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• Track successful traders' on-chain activity in real-time</p>
          <p>• Get alerts when watched wallets make significant moves</p>
          <p>• Analyze trading patterns and risk profiles</p>
          <p>• Copy successful strategies and timing</p>
          <p>• Discover new token opportunities early</p>
        </div>
      </div>
    </div>
  );
}
