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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSell = async () => {
    if (!publicKey || !tokenAddress) return;

    setLoading(true);
    setResult(null);

    try {
      // In a real implementation, you would:
      // 1. Load bundler wallets
      // 2. Create Seller instance
      // 3. Execute sell with selected mode

      // Mock result
      await new Promise(resolve => setTimeout(resolve, 2000));

      setResult({
        mode: sellMode,
        successfulSells: 12,
        totalSells: 12,
        totalSold: 1000000,
        solReceived: 5.5,
        totalPnL: 1.2,
        duration: 8500
      });
    } catch (error) {
      console.error('Sell failed:', error);
      alert('Sell failed: ' + (error as Error).message);
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

            {/* Sell Button */}
            <button
              onClick={handleSell}
              disabled={loading || !tokenAddress}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Selling...' : `Sell ${sellPercentage}% via ${sellMode.charAt(0).toUpperCase() + sellMode.slice(1)} Mode`}
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
                {result.successfulSells}/{result.totalSells}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Tokens Sold</p>
              <p className="text-lg font-bold">{result.totalSold.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">SOL Received</p>
              <p className="text-lg font-bold text-cyan-400">{result.solReceived.toFixed(4)} SOL</p>
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
