'use client';

import { useState, useEffect } from 'react';

interface MarketSentimentData {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number;
  fearGreedIndex: number;
  socialVolume: number;
  trendingTokens: number;
}

export default function MarketSentiment() {
  const [sentiment, setSentiment] = useState<MarketSentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSentiment();
  }, []);

  const loadSentiment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sentiment');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: MarketSentimentData = await response.json();
      setSentiment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sentiment data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">📊 Market Sentiment</h2>
          <p className="text-gray-400 text-sm">Real-time market mood analysis</p>
        </div>
        <button
          onClick={loadSentiment}
          disabled={loading}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      {sentiment && (
        <>
          <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-300 text-sm">Overall Sentiment</div>
                <div className="text-4xl font-bold text-green-400 capitalize">{sentiment.overall}</div>
                <div className="text-gray-400 text-sm mt-1">Score: {sentiment.score}/100</div>
              </div>
              <div className="text-6xl">📈</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Fear & Greed</div>
              <div className="text-2xl font-bold text-yellow-400">{sentiment.fearGreedIndex}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Social Volume</div>
              <div className="text-2xl font-bold text-cyan-400">{sentiment.socialVolume}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Trending Tokens</div>
              <div className="text-2xl font-bold text-purple-400">{sentiment.trendingTokens}</div>
            </div>
          </div>
        </>
      )}

      {!sentiment && !error && (
        <div className="text-center py-12 text-gray-400">
          {loading ? 'Loading sentiment data...' : 'Click Refresh to load sentiment data'}
        </div>
      )}
    </div>
  );
}
