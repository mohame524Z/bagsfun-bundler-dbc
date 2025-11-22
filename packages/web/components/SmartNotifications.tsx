'use client';

import { useState } from 'react';

interface NotificationRule {
  id: string;
  name: string;
  type: 'price_alert' | 'volume_spike' | 'new_token' | 'profit_target';
  enabled: boolean;
  conditions: string;
}

export default function SmartNotifications() {
  const [rules] = useState<NotificationRule[]>([
    { id: '1', name: 'Price Up 50%', type: 'price_alert', enabled: true, conditions: 'Price increase >= 50%' },
    { id: '2', name: 'Large Volume Spike', type: 'volume_spike', enabled: true, conditions: 'Volume > 2x avg' },
    { id: '3', name: 'New High MC Token', type: 'new_token', enabled: false, conditions: 'New token MC > 100k' },
  ]);

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
      <h2 className="text-2xl font-bold text-white">🔔 Smart Notifications</h2>
      <p className="text-gray-400 text-sm">Intelligent alerts based on custom conditions</p>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white font-medium">{rule.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${getTypeColor(rule.type)}`}>
                    {rule.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{rule.conditions}</p>
              </div>
              <button
                className={`px-4 py-2 rounded font-medium ${
                  rule.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {rule.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          💡 Notifications can be sent via browser push, email, or webhook to external services
        </p>
      </div>
    </div>
  );
}
