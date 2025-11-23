'use client';

import { useState, useEffect } from 'react';

interface Trader {
  id: string;
  username: string;
  roi: number;
  followers: number;
  trades24h: number;
  winRate: number;
  isFollowing?: boolean;
}

export default function SocialTrading() {
  const [topTraders, setTopTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<string | null>(null);

  useEffect(() => {
    loadTraders();
  }, []);

  const loadTraders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/social');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTopTraders(data.traders || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load traders');
    } finally {
      setLoading(false);
    }
  };

  const followTrader = async (traderId: string) => {
    setFollowing(traderId);
    setError(null);
    try {
      const response = await fetch('/api/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'follow',
          traderId,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Update trader's follow status
      setTopTraders(
        topTraders.map((trader) =>
          trader.id === traderId ? { ...trader, isFollowing: true } : trader
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to follow trader');
    } finally {
      setFollowing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">👥 Social Trading</h2>
          <p className="text-gray-400 text-sm">Follow and copy top traders</p>
        </div>
        <button
          onClick={loadTraders}
          disabled={loading}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading traders...</div>
      ) : (
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
                <button
                  onClick={() => followTrader(trader.id)}
                  disabled={following === trader.id || trader.isFollowing}
                  className={`px-4 py-2 rounded text-white font-medium ${
                    trader.isFollowing
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-purple-600 hover:bg-purple-700 disabled:opacity-50'
                  }`}
                >
                  {following === trader.id ? 'Following...' : trader.isFollowing ? 'Following' : 'Follow'}
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
      )}

      {topTraders.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          No traders available at the moment
        </div>
      )}
    </div>
  );
}
