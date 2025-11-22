'use client';

import { useState, useEffect } from 'react';

interface EmergencyState {
  killSwitchActive: boolean;
  activatedAt?: number;
  activatedBy?: string;
  reason?: string;
  pausedOperations: string[];
  emergencySellTriggered: boolean;
  emergencySellStatus?: {
    initiated: boolean;
    tokensSold: number;
    totalTokens: number;
    solRecovered: number;
  };
}

export default function EmergencyStopLoss() {
  const [state, setState] = useState<EmergencyState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const loadState = async () => {
    try {
      const response = await fetch('/api/emergency');
      const data = await response.json();

      if (response.ok) {
        setState(data.state);
      }
    } catch (err) {
      // Silent fail for polling
    }
  };

  const activateKillSwitch = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activateKillSwitch', reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate kill switch');
      }

      setSuccess(data.message);
      setShowConfirm(false);
      loadState();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deactivateKillSwitch = async () => {
    if (!confirm('Deactivate kill switch and resume all operations?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivateKillSwitch' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate kill switch');
      }

      setSuccess(data.message);
      loadState();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerEmergencySell = async () => {
    if (!confirm('EMERGENCY SELL: Sell all tokens immediately? This action cannot be undone!')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'emergencySell' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger emergency sell');
      }

      setSuccess(data.message);
      loadState();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!state) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">🚨 Emergency Stop Loss</h2>
        <p className="text-gray-400 text-sm mt-1">Global kill switch and emergency controls</p>
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

      {/* Kill Switch Status */}
      <div className={`p-6 rounded-xl border-2 ${
        state.killSwitchActive
          ? 'bg-red-900/20 border-red-500'
          : 'bg-gray-800 border-gray-700'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              state.killSwitchActive
                ? 'bg-red-500 animate-pulse'
                : 'bg-gray-700'
            }`}>
              <span className="text-3xl">{state.killSwitchActive ? '🛑' : '✅'}</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {state.killSwitchActive ? 'KILL SWITCH ACTIVE' : 'System Operational'}
              </h3>
              {state.killSwitchActive && state.activatedAt && (
                <p className="text-red-400 text-sm">
                  Activated {new Date(state.activatedAt).toLocaleString()}
                </p>
              )}
              {state.reason && (
                <p className="text-gray-400 text-sm">Reason: {state.reason}</p>
              )}
            </div>
          </div>

          {state.killSwitchActive ? (
            <button
              onClick={deactivateKillSwitch}
              disabled={loading}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50"
            >
              Resume Operations
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium disabled:opacity-50"
            >
              Activate Kill Switch
            </button>
          )}
        </div>

        {state.killSwitchActive && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-black/30 rounded p-4">
              <h4 className="text-sm font-bold text-white mb-2">Paused Operations</h4>
              <div className="space-y-1">
                {state.pausedOperations.map((op) => (
                  <div key={op} className="text-xs text-red-400">❌ {op}</div>
                ))}
              </div>
            </div>

            {state.emergencySellStatus && (
              <div className="bg-black/30 rounded p-4">
                <h4 className="text-sm font-bold text-white mb-2">Emergency Sell Status</h4>
                <div className="space-y-1 text-xs">
                  <div className="text-gray-300">
                    Tokens Sold: {state.emergencySellStatus.tokensSold} / {state.emergencySellStatus.totalTokens}
                  </div>
                  <div className="text-green-400">
                    SOL Recovered: {state.emergencySellStatus.solRecovered.toFixed(4)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Emergency Actions */}
      {state.killSwitchActive && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Emergency Actions</h3>

          <div className="space-y-3">
            <button
              onClick={triggerEmergencySell}
              disabled={loading || state.emergencySellTriggered}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-between"
            >
              <span>🔥 Emergency Sell All Tokens</span>
              {state.emergencySellTriggered && <span className="text-xs">TRIGGERED</span>}
            </button>

            <div className="text-xs text-gray-400 bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
              ⚠️ This will immediately sell all token positions at market price. Use only in critical situations.
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-3">ℹ️ About Kill Switch</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• <strong>Kill Switch:</strong> Immediately pauses all automated operations (bundling, sniping, volume generation)</p>
          <p>• <strong>Emergency Sell:</strong> Sells all token positions instantly (only available when kill switch is active)</p>
          <p>• <strong>Use Cases:</strong> Market crashes, suspected exploits, regulatory concerns, or any critical situation</p>
          <p>• <strong>Best Practice:</strong> Activate at first sign of trouble, investigate, then resume when safe</p>
        </div>
      </div>

      {/* Activation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full border-2 border-red-500"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-red-500 mb-4">⚠️ Activate Kill Switch?</h3>

            <p className="text-gray-300 mb-4">
              This will immediately pause all operations. You can resume them later.
            </p>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="e.g., Market crash, suspected exploit"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={activateKillSwitch}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium disabled:opacity-50"
              >
                {loading ? 'Activating...' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
