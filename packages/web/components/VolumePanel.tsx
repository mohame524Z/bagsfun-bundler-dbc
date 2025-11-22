'use client';

import { useState } from 'react';
import { PumpMode } from '@pump-bundler/types';

export default function VolumePanel({ mode }: { mode: PumpMode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tokenAddress: '',
    targetVolume: 50,
    duration: 60,
    pattern: 'constant',
  });

  const handleStart = async () => {
    if (!formData.tokenAddress) {
      setError('Token address is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/volume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress: formData.tokenAddress,
          targetVolume: formData.targetVolume,
          duration: formData.duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start volume generation');
      }

      setSuccess(`Volume generation started! Target: ${formData.targetVolume} SOL over ${formData.duration} minutes`);
    } catch (err: any) {
      setError(err.message || 'Failed to start volume generation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <p className="text-green-400">✅ {success}</p>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">📈 Volume Generator</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Token Mint Address *</label>
            <input
              type="text"
              placeholder="Enter token mint address..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
              value={formData.tokenAddress}
              onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Target Volume (SOL)</label>
              <input
                type="number"
                value={formData.targetVolume}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                onChange={(e) => setFormData({ ...formData, targetVolume: parseFloat(e.target.value) })}
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Pattern</label>
            <select
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
            >
              <option value="constant">Constant</option>
              <option value="increasing">Increasing</option>
              <option value="decreasing">Decreasing</option>
              <option value="wave">Wave</option>
              <option value="random">Random</option>
            </select>
          </div>

          <button
            onClick={handleStart}
            disabled={loading || !formData.tokenAddress}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Starting...</span>
              </div>
            ) : (
              'Start Volume Generation'
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-900/20 rounded-xl p-6 border border-blue-500/20">
        <h3 className="text-lg font-bold text-white mb-2">ℹ️ How Volume Generation Works</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p>• Creates organic-looking wash trading between bundler wallets</p>
          <p>• Distributes buys/sells over specified duration</p>
          <p>• Uses randomized amounts and intervals to appear natural</p>
          <p>• Helps boost token visibility on pump.fun charts</p>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-4 bg-yellow-900/20 rounded-xl p-6 border border-yellow-500/20">
        <h3 className="text-lg font-bold text-yellow-400 mb-2">⚠️ Important Notes</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p>• Volume generation runs in the background</p>
          <p>• Make sure you have sufficient SOL in bundler wallets</p>
          <p>• Transactions will execute over the specified duration</p>
          <p>• Monitor your portfolio for actual P&L tracking</p>
        </div>
      </div>
    </div>
  );
}
