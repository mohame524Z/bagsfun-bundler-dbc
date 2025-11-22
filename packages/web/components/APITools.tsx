'use client';

import { useState, useEffect } from 'react';

interface APIKey {
  id: string;
  key: string;
  masked: string;
  createdAt: number;
  lastUsed?: number;
}

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  desc: string;
}

export default function APITools() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/apikeys');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setApiKeys(data.keys || []);
      setEndpoints(data.endpoints || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createNewKey = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/apikeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await loadAPIKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🔌 API for External Tools</h2>
          <p className="text-gray-400 text-sm">Integrate with external applications</p>
        </div>
        <button
          onClick={loadAPIKeys}
          disabled={loading}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">API Keys</h3>
          <button
            onClick={createNewKey}
            disabled={creating}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {creating ? 'Creating...' : 'Create New Key'}
          </button>
        </div>

        {apiKeys.length > 0 ? (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded">
                <div className="flex-1">
                  <input
                    type="password"
                    value={showKey === key.id ? key.key : key.masked}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white font-mono text-sm"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => setShowKey(showKey === key.id ? null : key.id)}
                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
                >
                  {showKey === key.id ? 'Hide' : 'Show'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No API keys yet. Click "Create New Key" to generate one.</p>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-white font-bold mb-4">Available Endpoints</h3>
        <div className="space-y-2">
          {endpoints.length > 0 ? (
            endpoints.map((endpoint, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-700 rounded">
                <span className={`px-2 py-1 rounded text-xs font-mono ${
                  endpoint.method === 'GET' ? 'bg-blue-600' : endpoint.method === 'POST' ? 'bg-green-600' : 'bg-purple-600'
                } text-white`}>
                  {endpoint.method}
                </span>
                <code className="text-cyan-400 font-mono text-sm">{endpoint.path}</code>
                <span className="text-gray-400 text-sm ml-auto">{endpoint.desc}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No endpoints available</p>
          )}
        </div>
      </div>
    </div>
  );
}
