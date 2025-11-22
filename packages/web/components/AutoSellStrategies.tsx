'use client';

import { useState, useEffect } from 'react';

interface AutoSellStrategy {
  id: string;
  name: string;
  tokenAddress: string;
  enabled: boolean;
  type: 'takeProfit' | 'stopLoss' | 'trailing' | 'ladder' | 'timeBased' | 'volumeBased';
  takeProfitPercent?: number;
  sellPercentage?: number;
  stopLossPercent?: number;
  trailingPercent?: number;
  activationPercent?: number;
  ladderSteps?: { priceMultiplier: number; sellPercent: number }[];
  sellAfterMinutes?: number;
  volumeDropPercent?: number;
  executionMode: 'instant' | 'gradual';
  gradualDuration?: number;
  createdAt: number;
  lastChecked?: number;
  triggered?: boolean;
  triggeredAt?: number;
  executedAmount?: number;
}

export default function AutoSellStrategies() {
  const [strategies, setStrategies] = useState<AutoSellStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    tokenAddress: '',
    type: 'takeProfit' as AutoSellStrategy['type'],
    takeProfitPercent: 100,
    stopLossPercent: 50,
    sellPercentage: 100,
    trailingPercent: 10,
    activationPercent: 50,
    sellAfterMinutes: 60,
    volumeDropPercent: 50,
    executionMode: 'instant' as 'instant' | 'gradual',
    gradualDuration: 30,
  });

  const [ladderSteps, setLadderSteps] = useState([
    { priceMultiplier: 2, sellPercent: 25 },
    { priceMultiplier: 5, sellPercent: 25 },
    { priceMultiplier: 10, sellPercent: 50 },
  ]);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/autosell?action=list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load strategies');
      }

      setStrategies(data.strategies || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.tokenAddress) {
      setError('Name and token address are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const strategy: any = {
        name: formData.name,
        tokenAddress: formData.tokenAddress,
        type: formData.type,
        executionMode: formData.executionMode,
        sellPercentage: formData.sellPercentage,
      };

      // Add type-specific fields
      switch (formData.type) {
        case 'takeProfit':
          strategy.takeProfitPercent = formData.takeProfitPercent;
          break;
        case 'stopLoss':
          strategy.stopLossPercent = formData.stopLossPercent;
          break;
        case 'trailing':
          strategy.trailingPercent = formData.trailingPercent;
          strategy.activationPercent = formData.activationPercent;
          break;
        case 'ladder':
          strategy.ladderSteps = ladderSteps;
          break;
        case 'timeBased':
          strategy.sellAfterMinutes = formData.sellAfterMinutes;
          break;
        case 'volumeBased':
          strategy.volumeDropPercent = formData.volumeDropPercent;
          break;
      }

      if (formData.executionMode === 'gradual') {
        strategy.gradualDuration = formData.gradualDuration;
      }

      const response = await fetch('/api/autosell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', strategy }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create strategy');
      }

      setSuccess('Strategy created successfully!');
      setShowCreate(false);
      loadStrategies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const response = await fetch('/api/autosell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle strategy');
      }

      loadStrategies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this strategy?')) {
      return;
    }

    try {
      const response = await fetch('/api/autosell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete strategy');
      }

      setSuccess('Strategy deleted');
      loadStrategies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStrategyDescription = (strategy: AutoSellStrategy) => {
    switch (strategy.type) {
      case 'takeProfit':
        return `Sell ${strategy.sellPercentage}% at +${strategy.takeProfitPercent}% profit`;
      case 'stopLoss':
        return `Sell ${strategy.sellPercentage}% at -${strategy.stopLossPercent}% loss`;
      case 'trailing':
        return `Trailing ${strategy.trailingPercent}% stop (activate at +${strategy.activationPercent}%)`;
      case 'ladder':
        return `Ladder sell: ${strategy.ladderSteps?.length} steps`;
      case 'timeBased':
        return `Sell after ${strategy.sellAfterMinutes} minutes`;
      case 'volumeBased':
        return `Sell if volume drops ${strategy.volumeDropPercent}%`;
      default:
        return 'Unknown strategy';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">🎯 Auto-Sell Strategies</h2>
          <p className="text-gray-400 text-sm mt-1">Automate your profit taking and loss protection</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 font-medium"
        >
          {showCreate ? '✕ Cancel' : '+ New Strategy'}
        </button>
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

      {/* Create Form */}
      {showCreate && (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Create New Strategy</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Strategy Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="My Take Profit Strategy"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Token Address</label>
              <input
                type="text"
                value={formData.tokenAddress}
                onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Token address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Strategy Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { value: 'takeProfit', label: '💰 Take Profit', desc: 'Sell at target profit' },
                { value: 'stopLoss', label: '🛡️ Stop Loss', desc: 'Cut losses automatically' },
                { value: 'trailing', label: '📈 Trailing Stop', desc: 'Lock in profits' },
                { value: 'ladder', label: '🪜 Ladder', desc: 'Sell in steps' },
                { value: 'timeBased', label: '⏰ Time Based', desc: 'Sell after duration' },
                { value: 'volumeBased', label: '📊 Volume Based', desc: 'Based on volume change' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData({ ...formData, type: type.value as any })}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    formData.type === type.value
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-bold text-sm">{type.label}</div>
                  <div className="text-xs opacity-80">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific fields */}
          {formData.type === 'takeProfit' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Take Profit % (e.g., 100 = 2x)</label>
                <input
                  type="number"
                  value={formData.takeProfitPercent}
                  onChange={(e) => setFormData({ ...formData, takeProfitPercent: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Sell % of Holdings</label>
                <input
                  type="number"
                  value={formData.sellPercentage}
                  onChange={(e) => setFormData({ ...formData, sellPercentage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          )}

          {formData.type === 'stopLoss' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Stop Loss %</label>
                <input
                  type="number"
                  value={formData.stopLossPercent}
                  onChange={(e) => setFormData({ ...formData, stopLossPercent: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Sell % of Holdings</label>
                <input
                  type="number"
                  value={formData.sellPercentage}
                  onChange={(e) => setFormData({ ...formData, sellPercentage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          )}

          {formData.type === 'trailing' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Trailing %</label>
                <input
                  type="number"
                  value={formData.trailingPercent}
                  onChange={(e) => setFormData({ ...formData, trailingPercent: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Activate at % Gain</label>
                <input
                  type="number"
                  value={formData.activationPercent}
                  onChange={(e) => setFormData({ ...formData, activationPercent: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Sell % of Holdings</label>
                <input
                  type="number"
                  value={formData.sellPercentage}
                  onChange={(e) => setFormData({ ...formData, sellPercentage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          )}

          {formData.type === 'ladder' && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Ladder Steps</label>
              <div className="space-y-2">
                {ladderSteps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="number"
                      value={step.priceMultiplier}
                      onChange={(e) => {
                        const newSteps = [...ladderSteps];
                        newSteps[index].priceMultiplier = parseFloat(e.target.value);
                        setLadderSteps(newSteps);
                      }}
                      className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      placeholder="2x"
                    />
                    <span className="text-gray-400 py-2">x price →</span>
                    <input
                      type="number"
                      value={step.sellPercent}
                      onChange={(e) => {
                        const newSteps = [...ladderSteps];
                        newSteps[index].sellPercent = parseFloat(e.target.value);
                        setLadderSteps(newSteps);
                      }}
                      className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      placeholder="25%"
                    />
                    <span className="text-gray-400 py-2">% sell</span>
                  </div>
                ))}
                <button
                  onClick={() => setLadderSteps([...ladderSteps, { priceMultiplier: 1, sellPercent: 10 }])}
                  className="text-cyan-400 text-sm hover:text-cyan-300"
                >
                  + Add Step
                </button>
              </div>
            </div>
          )}

          {formData.type === 'timeBased' && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Sell After (minutes)</label>
              <input
                type="number"
                value={formData.sellAfterMinutes}
                onChange={(e) => setFormData({ ...formData, sellAfterMinutes: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                min="1"
              />
            </div>
          )}

          {formData.type === 'volumeBased' && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Volume Drop % Trigger</label>
              <input
                type="number"
                value={formData.volumeDropPercent}
                onChange={(e) => setFormData({ ...formData, volumeDropPercent: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                min="1"
              />
            </div>
          )}

          {/* Execution Mode */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Execution Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData({ ...formData, executionMode: 'instant' })}
                className={`px-4 py-2 rounded ${
                  formData.executionMode === 'instant'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                ⚡ Instant
              </button>
              <button
                onClick={() => setFormData({ ...formData, executionMode: 'gradual' })}
                className={`px-4 py-2 rounded ${
                  formData.executionMode === 'gradual'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                ⏳ Gradual
              </button>
              {formData.executionMode === 'gradual' && (
                <input
                  type="number"
                  value={formData.gradualDuration}
                  onChange={(e) => setFormData({ ...formData, gradualDuration: parseFloat(e.target.value) })}
                  className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Duration (min)"
                />
              )}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Strategy'}
          </button>
        </div>
      )}

      {/* Strategy List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Token</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {strategies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No strategies created. Click "New Strategy" to get started.
                  </td>
                </tr>
              ) : (
                strategies.map((strategy) => (
                  <tr key={strategy.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-white font-medium">{strategy.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{strategy.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{getStrategyDescription(strategy)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {strategy.tokenAddress.slice(0, 4)}...{strategy.tokenAddress.slice(-4)}
                    </td>
                    <td className="px-4 py-3">
                      {strategy.triggered ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400">
                          Triggered
                        </span>
                      ) : strategy.enabled ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-cyan-900/30 text-cyan-400">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-400">
                          Paused
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggle(strategy.id)}
                          className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                        >
                          {strategy.enabled ? 'Pause' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(strategy.id)}
                          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
