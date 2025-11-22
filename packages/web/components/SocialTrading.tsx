'use client';

import { useState } from 'react';

interface Trader {
  id: string;
  username: string;
  roi: number;
  followers: number;
  trades24h: number;
  winRate: number;
}

export default function SocialTrading() {
  const [topTraders] = useState<Trader[]>([
    { id: '1', username: 'MoonMaster', roi: 245, followers: 1234, trades24h: 15, winRate: 78 },
    { id: '2', username: 'DiamondHands', roi: 189, followers: 892, trades24h: 8, winRate: 85 },
    { id: '3', username: 'SniperKing', roi: 156, followers: 2341, trades24h: 23, winRate: 72 },
  ]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">👥 Social Trading</h2>
      <p className="text-gray-400 text-sm">Follow and copy top traders</p>

      <div className="space-y-3">
        {topTraders.map((trader, idx) => (
          <div key={trader.id} className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold">
                  #{idx + 1}
                </div>
                <div>
                  <h3 className="text-white font-bold">{trader.username}</h3>
                  <p className="text-sm text-gray-400">{trader.followers} followers</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                Follow
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">ROI (30d)</div>
                <div className="text-green-400 font-bold">+{trader.roi}%</div>
              </div>
              <div>
                <div className="text-gray-400">Win Rate</div>
                <div className="text-cyan-400 font-bold">{trader.winRate}%</div>
              </div>
              <div>
                <div className="text-gray-400">Trades (24h)</div>
                <div className="text-white font-bold">{trader.trades24h}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
