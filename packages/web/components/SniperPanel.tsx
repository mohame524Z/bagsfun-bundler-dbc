'use client';

import { PumpMode } from '@pump-bundler/types';

export default function SniperPanel({ mode }: { mode: PumpMode }) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-gray-800/50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">🎯 Token Sniper</h2>

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
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Exclude Keywords</label>
                <input
                  type="text"
                  placeholder="scam, rug"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="require-socials" className="w-4 h-4" />
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
                <input type="checkbox" id="auto-buy" className="w-4 h-4" />
                <label htmlFor="auto-buy" className="text-sm text-gray-300">
                  Enable auto-buy
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Amount per Wallet (SOL)</label>
                <input
                  type="number"
                  defaultValue={0.1}
                  step={0.01}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Max Wallets</label>
                <input
                  type="number"
                  defaultValue={3}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <button className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors">
          Start Sniper
        </button>
      </div>

      {/* Recent Tokens */}
      <div className="bg-gray-800/50 rounded-xl p-8">
        <h3 className="text-xl font-bold text-white mb-4">Recent Tokens</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Token Name {i}</p>
                <p className="text-sm text-gray-400">SYMBOL{i} • 2 min ago</p>
              </div>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm">
                Buy Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
