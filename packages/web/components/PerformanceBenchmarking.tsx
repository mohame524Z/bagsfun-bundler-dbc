'use client';

import { useState, useEffect } from 'react';

interface BenchmarkResult {
  category: string;
  metric: string;
  yourValue: number;
  avgValue: number;
  topPerformers: number;
  percentile: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface ComparisonData {
  timeframe: '7d' | '30d' | 'all';
  results: BenchmarkResult[];
  overallRank: number;
  totalUsers: number;
  lastUpdated: number;
}

export default function PerformanceBenchmarking() {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    loadBenchmarkData();
  }, [timeframe]);

  const loadBenchmarkData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/benchmarks?timeframe=${timeframe}`);
      const result = await response.json();
      if (response.ok && result.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to load benchmark data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-400';
    if (percentile >= 75) return 'text-cyan-400';
    if (percentile >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">📊 Performance Benchmarking</h2>
        <p className="text-gray-400 text-sm mt-1">Compare your performance against other users</p>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2">
        {[
          { value: '7d', label: 'Last 7 Days' },
          { value: '30d', label: 'Last 30 Days' },
          { value: 'all', label: 'All Time' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setTimeframe(option.value as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === option.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading benchmark data...</div>
      ) : !data ? (
        <div className="text-center py-12 text-gray-400">No benchmark data available</div>
      ) : (
        <>
          {/* Overall Rank */}
          <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-300 text-sm">Your Overall Rank</div>
                <div className="text-6xl font-bold text-white">#{data.overallRank}</div>
                <div className="text-gray-400 text-sm mt-1">
                  Out of {data.totalUsers.toLocaleString()} users
                </div>
              </div>
              <div className="text-8xl">
                {data.overallRank <= 10 ? '🏆' : data.overallRank <= 100 ? '🥇' : data.overallRank <= 1000 ? '🥈' : '🥉'}
              </div>
            </div>
          </div>

          {/* Benchmark Categories */}
          {['Profitability', 'Speed & Execution', 'Risk Management', 'Volume & Activity'].map((category) => {
            const categoryResults = data.results.filter(r => r.category === category);
            if (categoryResults.length === 0) return null;

            return (
              <div key={category} className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">{category}</h3>
                <div className="space-y-3">
                  {categoryResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-650"
                      onClick={() => setShowDetails(showDetails === result.metric ? null : result.metric)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white font-medium">{result.metric}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            Your value: <span className="text-cyan-400 font-medium">
                              {result.yourValue.toFixed(2)} {result.unit}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getPerformanceColor(result.percentile)}`}>
                            {result.percentile.toFixed(0)}th
                          </div>
                          <div className="text-xs text-gray-400">percentile</div>
                        </div>
                      </div>

                      {showDetails === result.metric && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-gray-400">Your Value</div>
                              <div className="text-white font-medium">
                                {result.yourValue.toFixed(2)} {result.unit}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">Average</div>
                              <div className="text-white font-medium">
                                {result.avgValue.toFixed(2)} {result.unit}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">Top Performers</div>
                              <div className="text-green-400 font-medium">
                                {result.topPerformers.toFixed(2)} {result.unit}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-sm">
                            <span className="text-gray-400">Trend:</span>
                            <span className="text-white">{getTrendIcon(result.trend)} {result.trend}</span>
                          </div>

                          {/* Performance Bar */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-600 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full ${
                                  result.percentile >= 90 ? 'bg-green-500' :
                                  result.percentile >= 75 ? 'bg-cyan-500' :
                                  result.percentile >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${result.percentile}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Last Updated */}
          <div className="text-center text-xs text-gray-500">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
