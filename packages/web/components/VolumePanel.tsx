'use client';

import { PumpMode } from '@pump-bundler/types';

export default function VolumePanel({ mode }: { mode: PumpMode }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800/50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">📈 Volume Generator</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Token Mint Address</label>
            <input
              type="text"
              placeholder="Enter token mint address..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Target Volume (SOL)</label>
              <input
                type="number"
                defaultValue={50}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Duration (minutes)</label>
              <input
                type="number"
                defaultValue={60}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Pattern</label>
            <select className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white">
              <option>Constant</option>
              <option>Increasing</option>
              <option>Decreasing</option>
              <option>Wave</option>
              <option>Random</option>
            </select>
          </div>

          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-colors">
            Start Volume Generation
          </button>
        </div>
      </div>
    </div>
  );
}
