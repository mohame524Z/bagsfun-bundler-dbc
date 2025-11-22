'use client';

import { useState, useEffect } from 'react';

interface RPCEndpoint {
  id: string;
  name: string;
  url: string;
  priority: number;
}

interface RPCHealth {
  endpointId: string;
  isHealthy: boolean;
  latency: number;
  successRate: number;
}

export default function RPCManager() {
  const [endpoints, setEndpoints] = useState<RPCEndpoint[]>([]);
  const [health, setHealth] = useState<RPCHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEndpoints = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rpc?action=list');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load endpoints');
      }

      setEndpoints(data.endpoints || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load endpoints');
      console.error('Failed to load endpoints:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHealth = async () => {
    try {
      const response = await fetch('/api/rpc?action=health');
      const data = await response.json();

      if (response.ok) {
        setHealth(data.health || []);
      }
    } catch (err) {
      console.error('Failed to load health:', err);
    }
  };

  const switchEndpoint = async (endpointId: string) => {
    try {
      const response = await fetch('/api/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'switch',
          endpointId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to switch endpoint');
      }

      await loadEndpoints();
      await loadHealth();
    } catch (err: any) {
      setError(err.message || 'Failed to switch endpoint');
      console.error('Failed to switch endpoint:', err);
    }
  };

  useEffect(() => {
    loadEndpoints();
    loadHealth();

    // Refresh health every 30 seconds
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthForEndpoint = (endpointId: string) => {
    return health.find(h => h.endpointId === endpointId);
  };

  const healthyCount = health.filter(h => h.isHealthy).length;
  const avgLatency = health.length > 0
    ? Math.round(health.reduce((sum, h) => sum + h.latency, 0) / health.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800/50 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">📡 RPC Manager</h2>
          <button
            onClick={() => { loadEndpoints(); loadHealth(); }}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        <div className="space-y-4">
          {endpoints.length === 0 && !loading && (
            <p className="text-center text-gray-400 py-8">
              No RPC endpoints configured. Please run setup first.
            </p>
          )}

          {endpoints.map((rpc, i) => {
            const healthData = getHealthForEndpoint(rpc.id);
            const isHealthy = healthData?.isHealthy ?? true;
            const latency = healthData?.latency ?? 0;

            return (
              <div key={rpc.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                    <p className="text-white font-medium">{rpc.name}</p>
                    {i === 0 && (
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">Active</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{rpc.url}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {latency > 0 ? `Latency: ${latency}ms` : 'Checking...'} • Priority: {rpc.priority}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => switchEndpoint(rpc.id)}
                    disabled={i === 0}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {i === 0 ? 'Active' : 'Switch'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Total Endpoints</p>
          <p className="text-3xl font-bold text-white">{endpoints.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Healthy</p>
          <p className="text-3xl font-bold text-green-400">{healthyCount}/{health.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Avg Latency</p>
          <p className="text-3xl font-bold text-white">{avgLatency}ms</p>
        </div>
      </div>
    </div>
  );
}
