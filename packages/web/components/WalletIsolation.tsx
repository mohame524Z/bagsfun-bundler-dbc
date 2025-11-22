'use client';

import { useState, useEffect } from 'react';

interface IsolationGroup {
  id: string;
  name: string;
  wallets: string[];
  purpose: 'trading' | 'holding' | 'distribution' | 'testing';
  riskLevel: 'low' | 'medium' | 'high';
  maxExposure: number;
  crossContamination: boolean;
  notes: string;
}

export default function WalletIsolation() {
  const [groups, setGroups] = useState<IsolationGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/isolation?action=getGroups');
      const data = await response.json();
      if (response.ok && data.groups) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-900/30 text-green-400';
      case 'medium': return 'bg-yellow-900/30 text-yellow-400';
      case 'high': return 'bg-red-900/30 text-red-400';
      default: return 'bg-gray-700 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">🔒 Wallet Isolation</h2>
        <p className="text-gray-400 text-sm mt-1">Separate wallets by purpose and risk level</p>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-yellow-300 text-sm">
          ⚠️ Wallet isolation prevents cross-contamination by grouping wallets by purpose and risk level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">Loading isolation groups...</div>
        ) : groups.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            No isolation groups configured. Create groups to separate wallet purposes.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{group.name}</h3>
                  <p className="text-sm text-gray-400 capitalize">{group.purpose}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(group.riskLevel)}`}>
                  {group.riskLevel.toUpperCase()} RISK
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Wallets:</span>
                  <span className="text-white">{group.wallets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Exposure:</span>
                  <span className="text-white">{group.maxExposure} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cross-contamination:</span>
                  <span className={group.crossContamination ? 'text-red-400' : 'text-green-400'}>
                    {group.crossContamination ? 'Allowed' : 'Blocked'}
                  </span>
                </div>
              </div>

              {group.notes && (
                <div className="mt-3 text-xs text-gray-400 bg-gray-700/50 rounded p-2">
                  {group.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-3">💡 Isolation Benefits</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• Separate high-risk trading wallets from holding wallets</p>
          <p>• Limit exposure per wallet group</p>
          <p>• Prevent contamination between different operations</p>
          <p>• Track performance by wallet purpose</p>
        </div>
      </div>
    </div>
  );
}
