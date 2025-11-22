'use client';

import { useState, useEffect } from 'react';

interface LaunchTemplate {
  id: string;
  name: string;
  description: string;
  category: 'safe' | 'balanced' | 'aggressive' | 'custom';
  config: {
    walletCount: number;
    totalSol: number;
    stealthMode: string;
    jitoEnabled: boolean;
    jitoTip: number;
    priorityFee: number;
    mode: 'classic' | 'mayhem';
    maxSolPerBundle: number;
    requireSimulation: boolean;
    autoSellEnabled: boolean;
    autoSellConfig?: {
      takeProfitPercent: number;
      stopLossPercent: number;
    };
  };
}

export default function OneClickTemplates() {
  const [templates, setTemplates] = useState<LaunchTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'safe' | 'balanced' | 'aggressive' | 'custom'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<LaunchTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [filterCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/templates?action=list&category=${filterCategory}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load templates');
      }

      setTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (id: string) => {
    if (!confirm('Apply this template? This will update your bundler configuration.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply template');
      }

      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safe':
        return '🛡️';
      case 'balanced':
        return '⚖️';
      case 'aggressive':
        return '⚡';
      case 'custom':
        return '⭐';
      default:
        return '📦';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safe':
        return 'border-green-500/30 bg-green-900/10';
      case 'balanced':
        return 'border-blue-500/30 bg-blue-900/10';
      case 'aggressive':
        return 'border-red-500/30 bg-red-900/10';
      case 'custom':
        return 'border-purple-500/30 bg-purple-900/10';
      default:
        return 'border-gray-500/30 bg-gray-900/10';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">📋 One-Click Templates</h2>
        <p className="text-gray-400 text-sm mt-1">Pre-configured launch strategies for different goals</p>
      </div>

      {/* Messages */}
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

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'safe', 'balanced', 'aggressive', 'custom'].map((category) => (
          <button
            key={category}
            onClick={() => setFilterCategory(category as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterCategory === category
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            No templates found for this category.
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg p-6 cursor-pointer transition-all hover:scale-105 ${getCategoryColor(template.category)}`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="text-4xl mb-3">{getCategoryIcon(template.category)}</div>
              <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{template.description}</p>

              <div className="space-y-1 text-xs text-gray-300 mb-4">
                <div className="flex justify-between">
                  <span>Wallets:</span>
                  <span className="font-medium">{template.config.walletCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total SOL:</span>
                  <span className="font-medium">{template.config.totalSol}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stealth:</span>
                  <span className="font-medium">{template.config.stealthMode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-medium capitalize">{template.config.mode}</span>
                </div>
                {template.config.autoSellEnabled && template.config.autoSellConfig && (
                  <div className="flex justify-between">
                    <span>Auto-Sell:</span>
                    <span className="font-medium text-green-400">
                      TP:{template.config.autoSellConfig.takeProfitPercent}% / SL:{template.config.autoSellConfig.stopLossPercent}%
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  applyTemplate(template.id);
                }}
                disabled={loading}
                className="w-full px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 font-medium disabled:opacity-50"
              >
                Apply Template
              </button>
            </div>
          ))
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-4xl mb-2">{getCategoryIcon(selectedTemplate.category)}</div>
                <h2 className="text-2xl font-bold text-white">{selectedTemplate.name}</h2>
                <p className="text-gray-400">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Configuration Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400">Wallet Count</div>
                    <div className="text-white font-medium">{selectedTemplate.config.walletCount}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400">Total SOL</div>
                    <div className="text-white font-medium">{selectedTemplate.config.totalSol}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400">Stealth Mode</div>
                    <div className="text-white font-medium">{selectedTemplate.config.stealthMode}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400">Pump Mode</div>
                    <div className="text-white font-medium capitalize">{selectedTemplate.config.mode}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400">Jito Enabled</div>
                    <div className="text-white font-medium">{selectedTemplate.config.jitoEnabled ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400">Jito Tip</div>
                    <div className="text-white font-medium">{selectedTemplate.config.jitoTip} SOL</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400">Max SOL/Bundle</div>
                    <div className="text-white font-medium">{selectedTemplate.config.maxSolPerBundle}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-3">
                    <div className="text-gray-400">Require Simulation</div>
                    <div className="text-white font-medium">{selectedTemplate.config.requireSimulation ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>

              {selectedTemplate.config.autoSellEnabled && selectedTemplate.config.autoSellConfig && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Auto-Sell Strategy</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                      <div className="text-green-400">Take Profit</div>
                      <div className="text-white font-medium">{selectedTemplate.config.autoSellConfig.takeProfitPercent}%</div>
                    </div>
                    <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
                      <div className="text-red-400">Stop Loss</div>
                      <div className="text-white font-medium">{selectedTemplate.config.autoSellConfig.stopLossPercent}%</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => applyTemplate(selectedTemplate.id)}
                disabled={loading}
                className="w-full px-4 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium disabled:opacity-50"
              >
                {loading ? 'Applying...' : 'Apply This Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
