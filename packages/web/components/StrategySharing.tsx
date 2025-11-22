'use client';

import { useState } from 'react';

interface SharedStrategy {
  id: string;
  name: string;
  author: string;
  rating: number;
  downloads: number;
  description: string;
  category: string;
}

export default function StrategySharing() {
  const [strategies] = useState<SharedStrategy[]>([
    { id: '1', name: 'Aggressive Sniper', author: 'Anon123', rating: 4.5, downloads: 234, description: 'Fast entry on new tokens', category: 'Sniper' },
    { id: '2', name: 'Safe Volume Bot', author: 'SafeTrader', rating: 4.8, downloads: 512, description: 'Natural volume patterns', category: 'Volume' },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🔄 Strategy Sharing</h2>
      <p className="text-gray-400 text-sm">Share and discover winning strategies</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-bold">{strategy.name}</h3>
                <p className="text-sm text-gray-400">by {strategy.author}</p>
              </div>
              <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs">
                {strategy.category}
              </span>
            </div>
            <p className="text-gray-300 text-sm mb-4">{strategy.description}</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-yellow-400">⭐ {strategy.rating}</span>
                <span className="text-gray-400">{strategy.downloads} downloads</span>
              </div>
              <button className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 text-sm">
                Import
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
