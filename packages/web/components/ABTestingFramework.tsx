'use client';

import { useState, useEffect } from 'react';

interface ABTest {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: number;
  endDate?: number;
  variants: {
    id: string;
    name: string;
    config: {
      walletCount?: number;
      stealthMode?: string;
      jitoTip?: number;
      priorityFee?: number;
      mode?: string;
    };
    performance: {
      trials: number;
      successRate: number;
      avgConfirmTime: number;
      totalCost: number;
      detectionEvents: number;
    };
  }[];
  winner?: string;
}

export default function ABTestingFramework() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/abtests?action=list');
      const data = await response.json();
      if (response.ok && data.tests) {
        setTests(data.tests);
      }
    } catch (err) {
      console.error('Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (id: string) => {
    try {
      await fetch('/api/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', id }),
      });

      setTests(tests.map(t => t.id === id ? { ...t, status: 'running' } : t));
      setSuccess('A/B test started');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const pauseTest = async (id: string) => {
    try {
      await fetch('/api/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause', id }),
      });

      setTests(tests.map(t => t.id === id ? { ...t, status: 'paused' } : t));
      setSuccess('A/B test paused');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const completeTest = async (id: string) => {
    if (!confirm('Complete this A/B test and determine winner?')) return;

    try {
      const response = await fetch('/api/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', id }),
      });

      const data = await response.json();

      setTests(tests.map(t => t.id === id ? { ...t, status: 'completed', winner: data.winner } : t));
      setSuccess(`Test completed. Winner: ${data.winnerName}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-900/30 text-green-400';
      case 'paused': return 'bg-yellow-900/30 text-yellow-400';
      case 'completed': return 'bg-blue-900/30 text-blue-400';
      default: return 'bg-gray-700 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">🧪 A/B Testing Framework</h2>
          <p className="text-gray-400 text-sm mt-1">Compare different strategies and configurations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          + New A/B Test
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <p className="text-green-400">✅ {success}</p>
        </div>
      )}

      {/* Tests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading A/B tests...</div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No A/B tests yet. Create your first test to start optimizing!
          </div>
        ) : (
          tests.map((test) => (
            <div
              key={test.id}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750"
              onClick={() => setSelectedTest(selectedTest?.id === test.id ? null : test)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{test.name}</h3>
                  <div className="text-sm text-gray-400 mt-1">
                    Started: {new Date(test.startDate).toLocaleDateString()}
                    {test.endDate && ` • Ended: ${new Date(test.endDate).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(test.status)}`}>
                    {test.status.toUpperCase()}
                  </span>
                  {test.status === 'draft' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); startTest(test.id); }}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Start
                    </button>
                  )}
                  {test.status === 'running' && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); pauseTest(test.id); }}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                      >
                        Pause
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); completeTest(test.id); }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Complete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Variants Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {test.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`border-2 rounded-lg p-4 ${
                      test.winner === variant.id
                        ? 'border-yellow-500 bg-yellow-900/10'
                        : 'border-gray-600 bg-gray-700/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-white font-bold">{variant.name}</h4>
                      {test.winner === variant.id && (
                        <span className="text-2xl">🏆</span>
                      )}
                    </div>

                    {/* Configuration */}
                    <div className="mb-3 text-xs space-y-1">
                      {variant.config.walletCount && (
                        <div className="text-gray-400">
                          Wallets: <span className="text-white">{variant.config.walletCount}</span>
                        </div>
                      )}
                      {variant.config.stealthMode && (
                        <div className="text-gray-400">
                          Stealth: <span className="text-white">{variant.config.stealthMode}</span>
                        </div>
                      )}
                      {variant.config.mode && (
                        <div className="text-gray-400">
                          Mode: <span className="text-white">{variant.config.mode}</span>
                        </div>
                      )}
                    </div>

                    {/* Performance Metrics */}
                    {variant.performance.trials > 0 && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Trials:</span>
                          <span className="text-white font-medium">{variant.performance.trials}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Success Rate:</span>
                          <span className={`font-medium ${
                            variant.performance.successRate >= 95 ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {variant.performance.successRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Confirm:</span>
                          <span className="text-cyan-400 font-medium">
                            {variant.performance.avgConfirmTime.toFixed(0)}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Cost:</span>
                          <span className="text-orange-400 font-medium">
                            {variant.performance.totalCost.toFixed(4)} SOL
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Detection Events:</span>
                          <span className={`font-medium ${
                            variant.performance.detectionEvents === 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {variant.performance.detectionEvents}
                          </span>
                        </div>
                      </div>
                    )}

                    {variant.performance.trials === 0 && (
                      <div className="text-gray-500 text-sm text-center py-2">
                        No data yet
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedTest?.id === test.id && test.winner && (
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded">
                  <p className="text-yellow-300 text-sm">
                    🏆 Winner: <strong>{test.variants.find(v => v.id === test.winner)?.name}</strong>
                    <br />
                    This configuration performed best across all metrics. Consider applying it to your main strategy.
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-3">💡 About A/B Testing</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• <strong>A/B Testing</strong> lets you compare different configurations side-by-side</p>
          <p>• Tests run simultaneously with equal distribution across variants</p>
          <p>• Metrics tracked: success rate, confirmation time, cost, detection risk</p>
          <p>• Statistical significance calculated automatically</p>
          <p>• Winner is determined by weighted score across all metrics</p>
        </div>
      </div>
    </div>
  );
}
