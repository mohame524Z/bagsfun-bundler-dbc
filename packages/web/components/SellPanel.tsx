'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PumpMode, SellMode } from '@pump-bundler/types';

interface SellPanelProps {
  connection: Connection;
  mode: PumpMode;
}

export default function SellPanel({ connection, mode }: SellPanelProps) {
  const { publicKey } = useWallet();
  const [tokenAddress, setTokenAddress] = useState('');
  const [sellMode, setSellMode] = useState<SellMode>(SellMode.REGULAR);
  const [sellPercentage, setSellPercentage] = useState(100);
  const [jitoTip, setJitoTip] = useState(0.001);
  const [priorityFee, setPriorityFee] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSell = async () => {
    if (!publicKey || !tokenAddress) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress,
          mode: sellMode,
          percentage: sellPercentage,
          priorityFee,
          jitoTip,
          jitoBundleSize: 20,
          delayBetweenSells: 1000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sell operation failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Sell failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSellModeDescription = (mode: SellMode) => {
    switch (mode) {
      case SellMode.REGULAR:
        return 'Sequential 1-by-1 sells through RPC. Slower but more reliable.';
      case SellMode.BUNDLE:
        return 'Sell in groups of 4 through RPC. Faster, medium reliability.';
      case SellMode.JITO:
        return 'Sell in groups of 20+ through Jito bundles. Fastest, best for large operations.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sell Configuration */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">💰 Sell Tokens</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {!publicKey ? (
          <p className="text-gray-400 text-center py-8">Connect your wallet to sell tokens</p>
        ) : (
          <div className="space-y-4">
            {/* Token Address */}
            <div>
              <label className="block text-sm font-medium mb-2">Token Address</label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="Enter token mint address"
                className="w-full bg-gray-700 rounded px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Sell Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Sell Mode</label>
              <div className="space-y-2">
                {Object.values(SellMode).map((mode) => (
                  <div
                    key={mode}
                    className={`p-4 rounded border-2 cursor-pointer transition-colors ${
                      sellMode === mode
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSellMode(mode)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold capitalize">{mode}</p>
                        <p className="text-sm text-gray-400">{getSellModeDescription(mode)}</p>
                      </div>
                      <div className="text-2xl">
                        {sellMode === mode ? '✅' : '⚪'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sell Percentage */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Sell Percentage: {sellPercentage}%
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={sellPercentage}
                onChange={(e) => setSellPercentage(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border-t border-gray-700 pt-4 space-y-4">
              <h3 className="font-semibold">Advanced Settings</h3>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority Fee (microLamports)
                </label>
                <input
                  type="number"
                  value={priorityFee}
                  onChange={(e) => setPriorityFee(parseInt(e.target.value))}
                  min="1000"
                  className="w-full bg-gray-700 rounded px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* Jito Settings (only for Jito mode) */}
              {sellMode === SellMode.JITO && (
                <div>
                  <label className="block text-sm font-medium mb-2">Jito Tip (SOL)</label>
                  <input
                    type="number"
                    value={jitoTip}
                    onChange={(e) => setJitoTip(parseFloat(e.target.value))}
                    step="0.0001"
                    min="0.0001"
                    className="w-full bg-gray-700 rounded px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Higher tips increase bundle priority
                  </p>
                </div>
              )}
            </div>

            {/* Sell Button */}
            <button
              onClick={handleSell}
              disabled={loading || !tokenAddress}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Selling...</span>
                </div>
              ) : (
                `Sell ${sellPercentage}% via ${sellMode.charAt(0).toUpperCase() + sellMode.slice(1)} Mode`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sell Result */}
      {result && (
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-lg p-6 border border-green-500/20">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            ✅ Sell Complete
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Mode</p>
              <p className="text-lg font-bold capitalize">{result.mode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-lg font-bold text-green-400">
                {result.successfulSells}/{result.successfulSells + result.failedSells}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tokens Sold</p>
              <p className="text-lg font-bold">{result.totalSold.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">SOL Received</p>
              <p className="text-lg font-bold text-cyan-400">{result.totalReceived.toFixed(4)} SOL</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">PnL</p>
              <p className={`text-lg font-bold ${result.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result.totalPnL >= 0 ? '+' : ''}{result.totalPnL.toFixed(4)} SOL
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-lg font-bold">{(result.duration / 1000).toFixed(1)}s</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
        <h4 className="font-semibold mb-2">ℹ️ Sell Mode Comparison</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p>• <strong>Regular</strong>: Best for small operations, highest reliability</p>
          <p>• <strong>Bundle</strong>: Good balance of speed and reliability</p>
          <p>• <strong>Jito</strong>: Fastest option, best for large batches, requires tip</p>
        </div>
      </div>

      {/* Rent Recovery Info */}
      <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/20">
        <h4 className="font-semibold mb-2">💸 Rent Recovery</h4>
        <p className="text-sm text-gray-300 mb-3">
          After selling, you can close empty token accounts to recover ~$0.40 per account in rent.
        </p>
        <button className="text-sm bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition-colors">
          Recover Rent from Empty Accounts
        </button>
      </div>
    </div>
  );
}
