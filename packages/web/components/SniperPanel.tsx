'use client';

import { useState } from 'react';
import { PumpMode } from '@pump-bundler/types';

export default function SniperPanel({ mode }: { mode: PumpMode }) {
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    keywords: '',
    excludeKeywords: '',
    requireSocials: false,
    autoB: false,
    buyAmount: 0.1,
    maxWallets: 3,
  });

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/sniper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start sniper');
      }

      setIsRunning(true);
      setSuccess('Sniper bot started successfully! Monitoring for new tokens...');
    } catch (err: any) {
      setError(err.message || 'Failed to start sniper');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/sniper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'stop',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop sniper');
      }

      setIsRunning(false);
      setSuccess('Sniper bot stopped.');
    } catch (err: any) {
      setError(err.message || 'Failed to stop sniper');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      <div className="bg-gray-800/50 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🎯 Token Sniper</h2>
          {isRunning && (
            <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full animate-pulse">
              Running...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Keywords (comma separated)</label>
                <input
                  type="text"
                  placeholder="pepe, doge, moon"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Exclude Keywords</label>
                <input
                  type="text"
                  placeholder="scam, rug"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  value={formData.excludeKeywords}
                  onChange={(e) => setFormData({ ...formData, excludeKeywords: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="require-socials"
                  className="w-4 h-4"
                  checked={formData.requireSocials}
                  onChange={(e) => setFormData({ ...formData, requireSocials: e.target.checked })}
                />
                <label htmlFor="require-socials" className="text-sm text-gray-300">
                  Require social links
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white mb-4">Auto-Buy Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-buy"
                  className="w-4 h-4"
                  checked={formData.autoBuy}
                  onChange={(e) => setFormData({ ...formData, autoBuy: e.target.checked })}
                />
                <label htmlFor="auto-buy" className="text-sm text-gray-300">
                  Enable auto-buy
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Amount per Wallet (SOL)</label>
                <input
                  type="number"
                  value={formData.buyAmount}
                  step={0.01}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  onChange={(e) => setFormData({ ...formData, buyAmount: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Max Wallets</label>
                <input
                  type="number"
                  value={formData.maxWallets}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  onChange={(e) => setFormData({ ...formData, maxWallets: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Sniper'}
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={loading}
            className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Stopping...' : 'Stop Sniper'}
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/20">
        <h3 className="text-lg font-bold text-white mb-2">ℹ️ How Sniper Works</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p>• Monitors pump.fun for new token launches in real-time</p>
          <p>• Filters tokens based on your keywords and criteria</p>
          <p>• Optionally auto-bundles matching tokens instantly</p>
          <p>• Uses your configured bundler settings (HYBRID mode, Jito, etc.)</p>
        </div>
      </div>
    </div>
  );
}
