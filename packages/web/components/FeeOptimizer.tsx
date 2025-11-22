'use client';

import { useState, useEffect } from 'react';

interface FeeRecommendation {
  bestTime: {
    hour: number;
    label: string;
    savingsPercent: number;
  };
  currentFees: {
    baseFee: number;
    priorityFee: number;
    jitoTip: number;
    total: number;
  };
  optimalFees: {
    baseFee: number;
    priorityFee: number;
    jitoTip: number;
    total: number;
    savings: number;
  };
  trends: {
    hour: number;
    avgFee: number;
    congestion: 'low' | 'medium' | 'high';
  }[];
}

export default function FeeOptimizer() {
  const [recommendation, setRecommendation] = useState<FeeRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBundleSize, setSelectedBundleSize] = useState(12);
  const [useJito, setUseJito] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [selectedBundleSize, useJito]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate fee data (in production, fetch from API)
      const mockData: FeeRecommendation = {
        bestTime: {
          hour: 3,
          label: '3:00 AM - 5:00 AM UTC',
          savingsPercent: 45,
        },
        currentFees: {
          baseFee: 0.000005,
          priorityFee: 0.0002,
          jitoTip: useJito ? 0.005 : 0,
          total: useJito ? 0.005205 * selectedBundleSize : 0.000205 * selectedBundleSize,
        },
        optimalFees: {
          baseFee: 0.000005,
          priorityFee: 0.00008,
          jitoTip: useJito ? 0.003 : 0,
          total: useJito ? 0.003085 * selectedBundleSize : 0.000085 * selectedBundleSize,
          savings: useJito ? 0.00212 * selectedBundleSize : 0.00012 * selectedBundleSize,
        },
        trends: Array.from({ length: 24 }, (_, i) => {
          const baseAvg = 0.0002;
          const variance = Math.sin((i - 12) / 12 * Math.PI) * 0.0001;
          const avgFee = baseAvg + variance;
          return {
            hour: i,
            avgFee,
            congestion: avgFee > 0.00025 ? 'high' : avgFee > 0.00015 ? 'medium' : 'low',
          };
        }),
      };

      setRecommendation(mockData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">💰 Fee Optimizer</h2>
        <p className="text-gray-400 text-sm mt-1">Find the best times and strategies to minimize fees</p>
      </div>

      {/* Configuration */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Bundle Size (Wallets)</label>
            <input
              type="number"
              value={selectedBundleSize}
              onChange={(e) => setSelectedBundleSize(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              min="1"
              max="50"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 mt-8">
              <input
                type="checkbox"
                checked={useJito}
                onChange={(e) => setUseJito(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-300">Use Jito Bundling</span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {recommendation && (
        <>
          {/* Best Time Recommendation */}
          <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">💡 Best Time to Bundle</h3>
                <p className="text-xl text-white mb-1">{recommendation.bestTime.label}</p>
                <p className="text-green-300">
                  Save up to {recommendation.bestTime.savingsPercent}% on fees ({recommendation.optimalFees.savings.toFixed(6)} SOL per bundle)
                </p>
              </div>
              <div className="text-6xl">🕐</div>
            </div>
          </div>

          {/* Fee Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Current Fees (Now)</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Fee:</span>
                  <span className="text-white">{recommendation.currentFees.baseFee.toFixed(6)} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Priority Fee:</span>
                  <span className="text-white">{recommendation.currentFees.priorityFee.toFixed(6)} SOL</span>
                </div>
                {useJito && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Jito Tip:</span>
                    <span className="text-white">{recommendation.currentFees.jitoTip.toFixed(6)} SOL</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-gray-700 pt-3">
                  <span className="text-white font-bold">Per Tx:</span>
                  <span className="text-white font-bold">{(recommendation.currentFees.total / selectedBundleSize).toFixed(6)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white font-bold">Total Bundle:</span>
                  <span className="text-red-400 font-bold text-lg">{recommendation.currentFees.total.toFixed(6)} SOL</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/20 to-cyan-900/20 border border-green-500/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">Optimal Fees (Best Time)</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Fee:</span>
                  <span className="text-white">{recommendation.optimalFees.baseFee.toFixed(6)} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Priority Fee:</span>
                  <span className="text-green-400">{recommendation.optimalFees.priorityFee.toFixed(6)} SOL</span>
                </div>
                {useJito && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Jito Tip:</span>
                    <span className="text-green-400">{recommendation.optimalFees.jitoTip.toFixed(6)} SOL</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-gray-700 pt-3">
                  <span className="text-white font-bold">Per Tx:</span>
                  <span className="text-green-400 font-bold">{(recommendation.optimalFees.total / selectedBundleSize).toFixed(6)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white font-bold">Total Bundle:</span>
                  <span className="text-green-400 font-bold text-lg">{recommendation.optimalFees.total.toFixed(6)} SOL</span>
                </div>
                <div className="flex justify-between border-t border-green-500/30 pt-3">
                  <span className="text-green-300 font-bold">You Save:</span>
                  <span className="text-green-300 font-bold text-lg">↓ {recommendation.optimalFees.savings.toFixed(6)} SOL</span>
                </div>
              </div>
            </div>
          </div>

          {/* 24h Fee Trends */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">24-Hour Fee Trends (UTC)</h3>
            <div className="space-y-2">
              {recommendation.trends.map((trend) => (
                <div key={trend.hour} className="flex items-center gap-2">
                  <div className="w-16 text-sm text-gray-400">{formatHour(trend.hour)}</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${getCongestionColor(trend.congestion)} transition-all flex items-center px-2`}
                      style={{ width: `${(trend.avgFee / 0.0003) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {trend.avgFee.toFixed(6)} SOL
                      </span>
                    </div>
                  </div>
                  <div className="w-20 text-xs text-right">
                    <span className={`px-2 py-1 rounded ${
                      trend.congestion === 'low' ? 'bg-green-900/30 text-green-400' :
                      trend.congestion === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {trend.congestion}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-blue-400 font-bold mb-3">💡 Fee Optimization Tips</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
              <li>Bundle during low congestion hours (typically 2-6 AM UTC) to save 30-50% on fees</li>
              <li>Use Jito bundling for MEV protection, but adjust tip based on network congestion</li>
              <li>Lower Jito tips during off-peak hours (0.003 SOL vs 0.005-0.01 SOL peak times)</li>
              <li>Reduce priority fees when network is not congested (100-150k vs 200-500k micro-lamports)</li>
              <li>Monitor fee trends before large bundles - waiting 1-2 hours can save significant SOL</li>
              <li>Weekend mornings (UTC) typically have lowest fees</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
