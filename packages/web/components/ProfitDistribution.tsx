'use client';

import { useState, useEffect } from 'react';

interface DistributionRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: 'threshold' | 'daily' | 'weekly' | 'manual';
  threshold?: number;
  recipients: {
    address: string;
    percentage: number;
    label: string;
  }[];
  autoCompound?: boolean;
  compoundPercentage?: number;
}

interface DistributionHistory {
  id: string;
  timestamp: number;
  totalAmount: number;
  recipients: {
    address: string;
    amount: number;
    txSignature: string;
  }[];
  status: 'pending' | 'completed' | 'failed';
}

export default function ProfitDistribution() {
  const [rules, setRules] = useState<DistributionRule[]>([]);
  const [history, setHistory] = useState<DistributionHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [currentBalance, setCurrentBalance] = useState({
    total: 15.5,
    distributed: 5.2,
    pending: 10.3,
  });

  useEffect(() => {
    loadRules();
    loadHistory();
  }, []);

  const loadRules = async () => {
    try {
      const response = await fetch('/api/distribution?action=getRules');
      const data = await response.json();
      if (response.ok && data.rules) {
        setRules(data.rules);
      }
    } catch (err) {
      console.error('Failed to load distribution rules');
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/distribution?action=getHistory');
      const data = await response.json();
      if (response.ok && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to load distribution history');
    }
  };

  const distributeNow = async () => {
    if (!confirm('Distribute profits now according to active rules?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'distribute' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to distribute profits');
      }

      setSuccess(`Successfully distributed ${data.totalAmount} SOL to ${data.recipientCount} recipients`);
      loadHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">💰 Profit Distribution</h2>
          <p className="text-gray-400 text-sm mt-1">Automated profit sharing and distribution</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
          + New Rule
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

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/30 to-purple-700/30 border border-purple-500/30 rounded-lg p-6">
          <div className="text-purple-300 text-sm mb-1">Total Profits</div>
          <div className="text-4xl font-bold text-white">{currentBalance.total.toFixed(2)} SOL</div>
        </div>
        <div className="bg-gradient-to-br from-green-900/30 to-green-700/30 border border-green-500/30 rounded-lg p-6">
          <div className="text-green-300 text-sm mb-1">Already Distributed</div>
          <div className="text-4xl font-bold text-white">{currentBalance.distributed.toFixed(2)} SOL</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-700/30 border border-yellow-500/30 rounded-lg p-6">
          <div className="text-yellow-300 text-sm mb-1">Pending Distribution</div>
          <div className="text-4xl font-bold text-white">{currentBalance.pending.toFixed(2)} SOL</div>
          <button
            onClick={distributeNow}
            disabled={loading || currentBalance.pending === 0}
            className="mt-3 w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium"
          >
            Distribute Now
          </button>
        </div>
      </div>

      {/* Distribution Rules */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Distribution Rules</h3>
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No distribution rules configured. Create your first rule to automate profit sharing.
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-medium">{rule.name}</h4>
                    <div className="text-xs text-gray-400 mt-1">
                      Trigger: {rule.trigger}
                      {rule.threshold && ` (at ${rule.threshold} SOL)`}
                    </div>
                  </div>
                  <button
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      rule.enabled
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {rule.enabled ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <div className="space-y-2">
                  {rule.recipients.map((recipient, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        {recipient.label || `Recipient ${idx + 1}`}
                      </span>
                      <span className="text-cyan-400 font-mono">
                        {recipient.percentage}% → {recipient.address.slice(0, 8)}...
                      </span>
                    </div>
                  ))}

                  {rule.autoCompound && (
                    <div className="text-sm text-purple-400 mt-2">
                      💎 Auto-compound: {rule.compoundPercentage}%
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Distribution History */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Distribution History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Total Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Recipients</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No distribution history yet
                  </td>
                </tr>
              ) : (
                history.map((dist) => (
                  <tr key={dist.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {new Date(dist.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-400">
                      {dist.totalAmount.toFixed(4)} SOL
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {dist.recipients.length} recipients
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        dist.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                        dist.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {dist.status.toUpperCase()}
                      </span>
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
