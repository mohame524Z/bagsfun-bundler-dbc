'use client';

import { useState, useEffect } from 'react';

interface NotificationRule {
  id: string;
  name: string;
  type: 'price_alert' | 'volume_spike' | 'new_token' | 'profit_target';
  enabled: boolean;
  conditions: string;
}

export default function SmartNotifications() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRules(data.rules || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notification rules');
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          // In a real implementation, this would come from a form
          rule: {
            name: 'New Notification',
            type: 'price_alert',
            conditions: 'Price change condition',
          },
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await loadNotifications();
    } catch (err: any) {
      setError(err.message || 'Failed to create notification');
    } finally {
      setCreating(false);
    }
  };

  const toggleRule = async (ruleId: string, newEnabled: boolean) => {
    setToggling(ruleId);
    setError(null);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle',
          ruleId,
          enabled: newEnabled,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Update rule locally
      setRules(
        rules.map((rule) =>
          rule.id === ruleId ? { ...rule, enabled: newEnabled } : rule
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update notification');
    } finally {
      setToggling(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'price_alert': return 'bg-green-900/30 text-green-400';
      case 'volume_spike': return 'bg-blue-900/30 text-blue-400';
      case 'new_token': return 'bg-purple-900/30 text-purple-400';
      case 'profit_target': return 'bg-yellow-900/30 text-yellow-400';
      default: return 'bg-gray-700 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🔔 Smart Notifications</h2>
          <p className="text-gray-400 text-sm">Intelligent alerts based on custom conditions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={createNotification}
            disabled={creating || loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Add Rule'}
          </button>
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading notification rules...</div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-medium">{rule.name}</h3>
                    {rule.type && (
                      <span className={`px-2 py-1 rounded text-xs ${getTypeColor(rule.type)}`}>
                        {rule.type.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{rule.conditions}</p>
                </div>
                <button
                  onClick={() => toggleRule(rule.id, !rule.enabled)}
                  disabled={toggling === rule.id}
                  className={`px-4 py-2 rounded font-medium ${
                    rule.enabled ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  } disabled:opacity-50`}
                >
                  {toggling === rule.id ? 'Updating...' : rule.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rules.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          No notification rules yet. Click "Add Rule" to create one.
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          💡 Notifications can be sent via browser push, email, or webhook to external services
        </p>
      </div>
    </div>
  );
}
