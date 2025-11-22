'use client';

import { useState } from 'react';

export default function MarketSentiment() {
  const [sentiment] = useState({
    overall: 'bullish',
    score: 72,
    fearGreedIndex: 65,
    socialVolume: 8450,
    trendingTokens: 15,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">📊 Market Sentiment</h2>
      <p className="text-gray-400 text-sm">Real-time market mood analysis</p>

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
    </div>
  );
}
